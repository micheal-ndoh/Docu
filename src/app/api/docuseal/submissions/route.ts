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
    // Get user's submissions from database
    const userSubmissions = await prisma.submission.findMany({
      where: { userId },
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

  // Accept API key either from server env or from an incoming header.
  const incomingApiKey = request.headers.get('x-auth-token') || request.headers.get('X-Auth-Token');
  const apiKey = process.env.DOCUSEAL_API_KEY ?? incomingApiKey ?? '';

  // Require authentication for creating submissions
  if (!session) {
    return NextResponse.json({ message: "Unauthorized - please sign in to create submissions" }, { status: 401 });
  }

  const userEmail = session.user?.email;
  const userId = session.user?.id;

  if (!userEmail || !userId) {
    return NextResponse.json({ message: "User email or ID not found in session" }, { status: 400 });
  }

  try {
    const contentType = request.headers.get('content-type') || '';

    // If multipart/form-data (file uploads), forward the raw request body and content-type header
    if (contentType.startsWith('multipart/form-data')) {
      const rawBody = await request.arrayBuffer();
      const docusealResponse = await fetch(`${DOCUSEAL_API_BASE_URL}/${getSubmissionsApiPath()}`, {
        method: 'POST',
        headers: {
          'X-Auth-Token': apiKey,
          'Content-Type': contentType,
        },
        body: Buffer.from(rawBody),
      });

      if (!docusealResponse.ok) {
        const errorData = await docusealResponse.json();
        return NextResponse.json(errorData, {
          status: docusealResponse.status,
        });
      }

      const data = await docusealResponse.json();
      return NextResponse.json(data, { status: 201 });
    }

    // Otherwise expect JSON - forward the entire payload to GIS Docusign API
    const body = (await request.json()) as Partial<DocuSeal.CreateSubmissionRequest>;

    console.log('Received submission request:', JSON.stringify(body, null, 2));

    // The payload is already in the correct format for GIS Docusign API
    // Just ensure required fields are present
    if (!body.template_id) {
      console.error('Missing template_id in request body');
      return NextResponse.json(
        { message: "template_id is required", received: body },
        { status: 400 }
      );
    }

    if (!body.submitters || body.submitters.length === 0) {
      console.error('Missing or empty submitters array');
      return NextResponse.json(
        { message: "At least one submitter is required", received: body },
        { status: 400 }
      );
    }

    // Validate each submitter has an email and add external_id for tracking
    for (let i = 0; i < body.submitters.length; i++) {
      if (!body.submitters[i].email) {
        console.error(`Submitter ${i} missing email`);
        return NextResponse.json(
          { message: `Submitter ${i + 1} must have an email address` },
          { status: 400 }
        );
      }
      // Add the creator's user ID as external_id to track ownership
      body.submitters[i].external_id = userId;
      // Add metadata with creator info
      body.submitters[i].metadata = {
        ...body.submitters[i].metadata,
        created_by_user_id: userId,
        created_by_email: userEmail,
      };
    }

    console.log('Sending to GIS Docusign API:', JSON.stringify(body, null, 2));

    const docusealResponse = await fetch(`${DOCUSEAL_API_BASE_URL}/${getSubmissionsApiPath()}`, {
      method: 'POST',
      headers: {
        'X-Auth-Token': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!docusealResponse.ok) {
      const errorData = await docusealResponse.json();
      console.error('GIS Docusign API error:', docusealResponse.status, errorData);
      return NextResponse.json(errorData, {
        status: docusealResponse.status,
      });
    }

    const data = await docusealResponse.json();
    console.log('GIS Docusign API success:', data);

    // Save submission to database for tracking
    try {
      // GIS Docusign returns an array of submitters, we need to extract submission_id
      const submitters = Array.isArray(data) ? data : [data];
      console.log('Attempting to save to database. Data structure:', JSON.stringify(submitters, null, 2));

      if (submitters.length > 0 && submitters[0].submission_id) {
        const submissionId = submitters[0].submission_id;
        const submitterEmail = submitters[0].email;

        console.log(`Saving submission ${submissionId} for user ${userId}`);

        // Create submission record
        const savedSubmission = await prisma.submission.create({
          data: {
            userId: userId,
            docusealId: submissionId,
            status: submitters[0].status || 'pending',
            submitterEmail: submitterEmail,
          },
        });

        console.log(`✅ Successfully saved submission ${submissionId} to database:`, savedSubmission);
      } else {
        console.error('❌ No submission_id found in response data:', submitters);
      }
    } catch (dbError) {
      console.error('❌ Error saving submission to database:');
      console.error('Error details:', dbError);
      console.error('Error name:', (dbError as Error).name);
      console.error('Error message:', (dbError as Error).message);
      console.error('Full error:', JSON.stringify(dbError, null, 2));
      // Don't fail the request if database save fails
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating GIS Docusign submission:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: (error as Error).message ?? String(error) },
      { status: 500 }
    );
  }
}