import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";

export const runtime = 'nodejs';

const DOCUSEAL_API_BASE_URL = process.env.DOCUSEAL_URL || "https://api.docuseal.com";

export async function GET(request: Request) {
  const session = await getServerSession(request);
  if (!session) {
    console.warn('[api/docuseal/submissions] no session - proceeding as anonymous');
  }

  try {
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
    if (status === "SENT") {
      status = "pending";
    }
    if (status === "OPENED") {
      status = ""; // API doesn't support 'opened' filter
    }
    if (status && status !== "ALL") {
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

    const url = `${DOCUSEAL_API_BASE_URL}/submissions?${params.toString()}`;

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
    if (Array.isArray(data)) return NextResponse.json({ data });
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Error fetching DocuSeal submissions:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: (error as Error).message ?? String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(request);
  // Accept API key either from server env or from an incoming header.
  const incomingApiKey = request.headers.get('x-auth-token') || request.headers.get('X-Auth-Token');
  const apiKey = process.env.DOCUSEAL_API_KEY ?? incomingApiKey ?? '';

  // Allow server-side submission forwarding when we have an API key or a session
  if (!session && !apiKey) {
    return NextResponse.json({ message: "Unauthorized - no session and no server API key configured" }, { status: 401 });
  }

  try {
    const contentType = request.headers.get('content-type') || '';

    // If multipart/form-data (file uploads), forward the raw request body and content-type header
    if (contentType.startsWith('multipart/form-data')) {
      const rawBody = await request.arrayBuffer();
      const docusealResponse = await fetch(`${DOCUSEAL_API_BASE_URL}/submissions`, {
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

    // Otherwise expect JSON - forward the entire payload to DocuSeal API
    const body = (await request.json()) as Partial<DocuSeal.CreateSubmissionRequest>;

    console.log('Received submission request:', JSON.stringify(body, null, 2));

    // The payload is already in the correct format for DocuSeal API
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

    // Validate each submitter has an email
    for (let i = 0; i < body.submitters.length; i++) {
      if (!body.submitters[i].email) {
        console.error(`Submitter ${i} missing email`);
        return NextResponse.json(
          { message: `Submitter ${i + 1} must have an email address` },
          { status: 400 }
        );
      }
    }

    console.log('Sending to DocuSeal API:', JSON.stringify(body, null, 2));

    const docusealResponse = await fetch(`${DOCUSEAL_API_BASE_URL}/submissions`, {
      method: 'POST',
      headers: {
        'X-Auth-Token': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!docusealResponse.ok) {
      const errorData = await docusealResponse.json();
      console.error('DocuSeal API error:', docusealResponse.status, errorData);
      return NextResponse.json(errorData, {
        status: docusealResponse.status,
      });
    }

    const data = await docusealResponse.json();
    console.log('DocuSeal API success:', data);
    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating DocuSeal submission:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: (error as Error).message ?? String(error) },
      { status: 500 }
    );
  }
}