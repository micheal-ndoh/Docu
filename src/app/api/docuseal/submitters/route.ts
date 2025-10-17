import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";

const DOCUSEAL_API_BASE_URL = process.env.DOCUSEAL_URL || "https://api.docuseal.com";

export async function GET(request: Request) {
  const session = await getServerSession(request);
  if (!session) {
    console.warn('[api/docuseal/submitters] no session - proceeding as anonymous');
  }

  try {
    const { searchParams } = new URL(request.url);

    // Build query parameters
    const params = new URLSearchParams();

    // Pagination parameters
    const limit = searchParams.get("limit") || "10";
    params.append("limit", limit);

    if (searchParams.has("after")) {
      const after = searchParams.get("after");
      if (after) params.append("after", after);
    }
    if (searchParams.has("before")) {
      const before = searchParams.get("before");
      if (before) params.append("before", before);
    }

    // Filter parameters
    if (searchParams.has("submission_id")) {
      const submissionId = searchParams.get("submission_id");
      if (submissionId) params.append("submission_id", submissionId);
    }

    // Search query
    if (searchParams.has("q")) {
      const q = searchParams.get("q");
      if (q) params.append("q", q);
    }

    // Slug filter
    if (searchParams.has("slug")) {
      const slug = searchParams.get("slug");
      if (slug) params.append("slug", slug);
    }

    // Date filters
    if (searchParams.has("completed_after")) {
      const completedAfter = searchParams.get("completed_after");
      if (completedAfter) params.append("completed_after", completedAfter);
    }
    if (searchParams.has("completed_before")) {
      const completedBefore = searchParams.get("completed_before");
      if (completedBefore) params.append("completed_before", completedBefore);
    }

    // External ID filter
    if (searchParams.has("external_id")) {
      const externalId = searchParams.get("external_id");
      if (externalId) params.append("external_id", externalId);
    }

    const url = `${DOCUSEAL_API_BASE_URL}/submitters?${params.toString()}`;

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
    console.error("Error fetching DocuSeal submitters:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: (error as Error).message ?? String(error) },
      { status: 500 }
    );
  }
}
