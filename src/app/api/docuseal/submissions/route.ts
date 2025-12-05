import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export const runtime = 'nodejs';

const DOCUSEAL_API_BASE_URL = process.env.DOCUSEAL_URL || "https://api.docuseal.com";

// Use /api/submissions for self-hosted, /submissions for hosted
const getSubmissionsApiPath = () => DOCUSEAL_API_BASE_URL.includes('api.docuseal.com') ? 'submissions' : 'api/submissions';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  // Require authentication to view submissions
  if (!session) {
    return NextResponse.json({ message: "Unauthorized - please sign in to view submissions" }, { status: 401 });
  }

  const userId = session.user?.id;
  if (!userId) {
    return NextResponse.json({ message: "User ID not found in session" }, { status: 400 });
  }

  try {
    // Get user's submissions from database with per-party status
    const userSubmissions = await prisma.submission.findMany({
      where: { userId },
      include: { submitterStatus: true },
    });

    const submissionIds = userSubmissions.map(s => s.docusealId);

    // If user has no submissions, return empty array
    if (submissionIds.length === 0) {
      return NextResponse.json({ data: [], pagination: { count: 0, next: null, prev: null } });
    }

    const { searchParams } = new URL(request.url);

    // Build query parameters
    const params = new URLSearchParams();

    // Pagination parameters
    const limit = searchParams.get("limit") || "10";
    params.append("limit", limit);

    if (searchParams.has("after")) {
      params.append("after", searchParams.get("after")!);
    }
    if (searchParams.has("before")) {
      params.append("before", searchParams.get("before")!);
    }

    // Filter parameters
    if (searchParams.has("template_id")) {
      params.append("template_id", searchParams.get("template_id")!);
    }

    let status = searchParams.get("status") || "";
    // Map frontend status values to API values
    if (status === "SENT") { // Map frontend SENT to API's PENDING
      status = "pending";
    }
    if (status && status !== "ALL") { // Only append status if it's not ALL
      params.append("status", status);
    }

    // Search query
    if (searchParams.has("q")) {
      params.append("q", searchParams.get("q")!);
    }

    // Slug filter
    if (searchParams.has("slug")) {
      params.append("slug", searchParams.get("slug")!);
    }

    // Template folder filter
    if (searchParams.has("template_folder")) {
      params.append("template_folder", searchParams.get("template_folder")!);
    }

    // Archived filter
    if (searchParams.has("archived")) {
      params.append("archived", searchParams.get("archived")!);
    }

    const url = `${DOCUSEAL_API_BASE_URL}/${getSubmissionsApiPath()}?${params.toString()}`;

    const docusealResponse = await fetch(url, {
      headers: {
        "X-Auth-Token": process.env.DOCUSEAL_API_KEY ?? '',
        "Content-Type": "application/json",
      },
    });

    if (!docusealResponse.ok) {
      const errorData = await docusealResponse.json();
      return NextResponse.json(errorData, {
        status: docusealResponse.status,
      });
    }

    const data = await docusealResponse.json();

    // Filter submissions to only include user's submissions
    let submissions = Array.isArray(data) ? data : (data.data || []);
    submissions = submissions.filter((sub: any) => submissionIds.includes(sub.id));

    // Merge local submitter status into the response
    // Sync local DB with fresh data from DocuSeal
    const syncPromises = submissions.map(async (sub: any) => {
      const localSubmission = userSubmissions.find(s => s.docusealId === sub.id);

      if (localSubmission) {
        // 1. Update overall status if changed
        if (localSubmission.status !== sub.status) {
          await prisma.submission.update({
            where: { id: localSubmission.id },
            data: { status: sub.status }
          });
        }

        // 2. Update submitter statuses
        if (sub.submitters && Array.isArray(sub.submitters)) {
          for (const apiSubmitter of sub.submitters) {
            const localSubmitter = localSubmission.submitterStatus.find(
              s => s.email === apiSubmitter.email || s.docusealSubmitterId === apiSubmitter.id
            );

            if (localSubmitter && (localSubmitter.status !== apiSubmitter.status || !localSubmitter.embedSrc)) {
              await prisma.submitterStatus.update({
                where: { id: localSubmitter.id },
                data: {
                  status: apiSubmitter.status,
                  embedSrc: apiSubmitter.embed_src || localSubmitter.embedSrc,
                  openedAt: apiSubmitter.opened_at ? new Date(apiSubmitter.opened_at) : localSubmitter.openedAt,
                  completedAt: apiSubmitter.completed_at ? new Date(apiSubmitter.completed_at) : localSubmitter.completedAt,
                }
              });
            }
          }
        }

        // Return the merged object with FRESH data from API mapped to local structure
        // We construct submitter_status from the API response to ensure frontend gets latest data
        return {
          ...sub,
          submitter_status: sub.submitters.map((s: any) => {
            const localSubmitter = localSubmission.submitterStatus.find(
              ls => ls.email === s.email || ls.docusealSubmitterId === s.id
            );
            return {
              id: s.id, // Use DocuSeal ID temporarily or map to local ID if needed, but for display API data is fine
              email: s.email,
              role: s.role,
              status: s.status,
              embedSrc: s.embed_src || localSubmitter?.embedSrc, // Fallback to local DB if API doesn't return it
              sentAt: s.sent_at,
              openedAt: s.opened_at,
              completedAt: s.completed_at
            };
          })
        };
      }
      return sub;
    });

    submissions = await Promise.all(syncPromises);

    if (Array.isArray(data)) {
      return NextResponse.json({ data: submissions });
    }
    return NextResponse.json({ ...data, data: submissions });
  } catch (error: unknown) {
    console.error("Error fetching GIS Docusign submissions:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: (error as Error).message ?? String(error) },
      { status: 500 }
    );
  }
}

// Helper function to sync submission status from GIS Docusign
export async function syncSubmissionStatus(submissionId: number, status: string) {
  try {
    await prisma.submission.update({
      where: { docusealId: submissionId },
      data: { status },
    });
  } catch (error) {
    console.error(`Error syncing submission ${submissionId} status:`, error);
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  const incomingApiKey = request.headers.get('x-auth-token') || request.headers.get('X-Auth-Token');
  const apiKey = process.env.DOCUSEAL_API_KEY ?? incomingApiKey ?? '';

  if (!session) {
    return NextResponse.json({ message: "Unauthorized - please sign in to create submissions" }, { status: 401 });
  }

  const userEmail = session.user?.email;
  const userName = session.user?.name;
  const userId = session.user?.id;

  if (!userEmail || !userId) {
    return NextResponse.json({ message: "User email or ID not found in session" }, { status: 400 });
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminName = process.env.ADMIN_NAME || "Administrator";

  if (!adminEmail) {
    console.error('ADMIN_EMAIL not configured in environment variables');
    return NextResponse.json(
      { message: "Server configuration error: Admin email not configured" },
      { status: 500 }
    );
  }

  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.startsWith('multipart/form-data')) {
      const rawBody = await request.arrayBuffer();
      const docusealResponse = await fetch(`${DOCUSEAL_API_BASE_URL}/${getSubmissionsApiPath()}`, {
        method: 'POST',
        headers: { 'X-Auth-Token': apiKey, 'Content-Type': contentType },
        body: Buffer.from(rawBody),
      });

      if (!docusealResponse.ok) {
        const errorData = await docusealResponse.json();
        return NextResponse.json(errorData, { status: docusealResponse.status });
      }

      const data = await docusealResponse.json();
      return NextResponse.json(data, { status: 201 });
    }

    const body = (await request.json()) as Partial<DocuSeal.CreateSubmissionRequest> & {
      additional_parties?: Array<{ email: string; name?: string; role?: string }>;
    };

    if (!body.template_id) {
      return NextResponse.json({ message: "template_id is required" }, { status: 400 });
    }

    const templateResponse = await fetch(`${DOCUSEAL_API_BASE_URL}/${DOCUSEAL_API_BASE_URL.includes('api.docuseal.com') ? 'templates' : 'api/templates'}/${body.template_id}`, {
      headers: { "X-Auth-Token": apiKey, "Content-Type": "application/json" },
    });

    if (!templateResponse.ok) {
      return NextResponse.json({ message: "Failed to fetch template details" }, { status: 500 });
    }

    const template = await templateResponse.json();
    const templateSubmitters = template.submitters || [];

    const submitters: any[] = [];

    if (templateSubmitters.length > 0) {
      submitters.push({
        email: userEmail,
        name: userName || "",
        role: templateSubmitters[0].name,
        send_email: true,
      });
    }

    const additionalParties = body.additional_parties || [];
    const expectedAdditionalParties = Math.max(0, templateSubmitters.length - 2);

    if (additionalParties.length !== expectedAdditionalParties) {
      return NextResponse.json(
        { message: `Template requires ${templateSubmitters.length} parties. Please provide ${expectedAdditionalParties} additional parties.` },
        { status: 400 }
      );
    }

    additionalParties.forEach((party, index) => {
      submitters.push({
        email: party.email,
        name: party.name || "",
        role: templateSubmitters[index + 1]?.name || `Party ${index + 2}`,
        send_email: true,
      });
    });

    if (templateSubmitters.length > 1) {
      submitters.push({
        email: adminEmail,
        name: adminName,
        role: templateSubmitters[templateSubmitters.length - 1].name,
        send_email: true,
      });
    }

    if (submitters.length !== templateSubmitters.length) {
      return NextResponse.json(
        { message: "Mismatch between constructed parties and template requirements." },
        { status: 500 }
      );
    }

    submitters.forEach((submitter) => {
      submitter.external_id = userId;
      submitter.metadata = { created_by_user_id: userId, created_by_email: userEmail };
    });

    const submissionPayload = {
      template_id: body.template_id,
      submitters: submitters,
      send_email: body.send_email !== false,
    };

    const docusealResponse = await fetch(`${DOCUSEAL_API_BASE_URL}/${getSubmissionsApiPath()}`, {
      method: 'POST',
      headers: { 'X-Auth-Token': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionPayload),
    });

    if (!docusealResponse.ok) {
      const errorData = await docusealResponse.json();
      return NextResponse.json(errorData, { status: docusealResponse.status });
    }

    const data = await docusealResponse.json();

    try {
      if (data.length > 0 && data[0].submission_id) {
        const submissionId = data[0].submission_id;
        await prisma.submission.create({
          data: {
            userId: userId,
            docusealId: submissionId,
            status: 'pending',
            submitterEmail: userEmail,
            submitterStatus: {
              create: data.map((s: any) => ({
                docusealSubmitterId: s.id,
                email: s.email,
                name: s.name || null,
                role: s.role || 'Unknown',
                status: s.status || 'pending',
                embedSrc: s.embed_src || null,
              })),
            },
          },
        });
      }
    } catch (dbError) {
      console.error('Error saving submission to database:', dbError);
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating DocuSeal submission:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: (error as Error).message ?? String(error) },
      { status: 500 }
    );
  }
}