import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export const runtime = 'nodejs';

/**
 * POST /api/docuseal/webhook
 * Webhook endpoint to receive status updates from DocuSeal
 * Updates per-party status in database when submitters sign/complete documents
 */
export async function POST(request: Request) {
    try {
        const payload = await request.json();

        console.log('📩 Received DocuSeal webhook:', JSON.stringify(payload, null, 2));

        // DocuSeal webhook payload structure:
        // {
        //   "event_type": "submission.completed" | "submitter.completed" | "submitter.sent",
        //   "timestamp": "2023-01-01T00:00:00.000Z",
        //   "data": {
        //     "id": 123,
        //     "submission_id": 456,
        //     ...
        //   }
        // }

        const eventType = payload.event_type;
        const data = payload.data;

        if (!eventType || !data) {
            console.error('Invalid webhook payload: missing event_type or data');
            return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
        }

        // Handle different webhook events
        switch (eventType) {
            case 'submitter.sent':
                await handleSubmitterSent(data);
                break;

            case 'submitter.opened':
                await handleSubmitterOpened(data);
                break;

            case 'submitter.completed':
                await handleSubmitterCompleted(data);
                break;

            case 'submitter.declined':
                await handleSubmitterDeclined(data);
                break;

            case 'submission.completed':
                await handleSubmissionCompleted(data);
                break;

            // Email delivery failure events
            case 'bounce_email':
            case 'complaint_email':
                console.error(`⚠️ EMAIL DELIVERY FAILED: ${eventType}`, JSON.stringify(data, null, 2));
                // We could also update the database here if we had a status for it
                break;

            default:
                console.log(`Unhandled webhook event: ${eventType}`);
        }

        return NextResponse.json({ message: "Webhook processed successfully" }, { status: 200 });
    } catch (error) {
        console.error('Error processing webhook:', error);
        return NextResponse.json(
            { message: "Internal Server Error", error: (error as Error).message },
            { status: 500 }
        );
    }
}

// Update submitter status when email is sent
async function handleSubmitterSent(data: any) {
    try {
        const submitterId = Number(data.id);
        const sentAt = data.sent_at ? new Date(data.sent_at) : new Date();

        await prisma.submitterStatus.updateMany({
            where: { docusealSubmitterId: submitterId },
            data: {
                status: 'sent',
                sentAt: sentAt,
            },
        });

        console.log(`✅ Updated submitter ${submitterId} status to 'sent'`);
    } catch (error) {
        console.error('Error handling submitter.sent:', error);
    }
}

// Update submitter status when document is opened
async function handleSubmitterOpened(data: any) {
    try {
        const submitterId = Number(data.id);
        const openedAt = data.opened_at ? new Date(data.opened_at) : new Date();

        await prisma.submitterStatus.updateMany({
            where: { docusealSubmitterId: submitterId },
            data: {
                status: 'opened',
                openedAt: openedAt,
            },
        });

        console.log(`✅ Updated submitter ${submitterId} status to 'opened'`);
    } catch (error) {
        console.error('Error handling submitter.opened:', error);
    }
}

// Update submitter status when document is signed/completed
async function handleSubmitterCompleted(data: any) {
    try {
        const submitterId = Number(data.id);
        const completedAt = data.completed_at ? new Date(data.completed_at) : new Date();

        console.log(`Processing submitter.completed for ID: ${submitterId}`);

        const result = await prisma.submitterStatus.updateMany({
            where: { docusealSubmitterId: submitterId },
            data: {
                status: 'completed',
                completedAt: completedAt,
            },
        });

        console.log(`✅ Updated submitter ${submitterId} status to 'completed'. Count: ${result.count}`);

        if (result.count === 0) {
            console.warn(`⚠️ No submitter found with docusealSubmitterId: ${submitterId}`);
        }
    } catch (error) {
        console.error('Error handling submitter.completed:', error);
    }
}

// Update submitter status when document is declined
async function handleSubmitterDeclined(data: any) {
    try {
        const submitterId = Number(data.id);
        const declinedAt = data.declined_at ? new Date(data.declined_at) : new Date();

        await prisma.submitterStatus.updateMany({
            where: { docusealSubmitterId: submitterId },
            data: {
                status: 'declined',
                declinedAt: declinedAt,
            },
        });

        console.log(`✅ Updated submitter ${submitterId} status to 'declined'`);
    } catch (error) {
        console.error('Error handling submitter.declined:', error);
    }
}

// Update overall submission status when all parties complete
async function handleSubmissionCompleted(data: any) {
    try {
        const submissionId = Number(data.id);

        // Find submission in our database
        const submission = await prisma.submission.findUnique({
            where: { docusealId: submissionId },
            include: { submitterStatus: true },
        });

        if (!submission) {
            console.log(`Submission ${submissionId} not found in database`);
            return;
        }

        // Check if all submitters have completed
        const allCompleted = submission.submitterStatus?.every(
            (s) => s.status === 'completed'
        ) ?? false;

        if (allCompleted) {
            await prisma.submission.update({
                where: { docusealId: submissionId },
                data: { status: 'completed' },
            });

            console.log(`✅ Updated submission ${submissionId} status to 'completed'`);
        }
    } catch (error) {
        console.error('Error handling submission.completed:', error);
    }
}
