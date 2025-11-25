import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const DOCUSEAL_API_BASE_URL = process.env.DOCUSEAL_URL || "https://api.docuseal.com";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    console.warn('[api/docuseal/submissions/[id]] no session - proceeding as anonymous');
  }

  try {
    const { id } = await params;

    // Fetch submission data
    const docusealResponse = await fetch(
      `${DOCUSEAL_API_BASE_URL}/submissions/${id}`,
      {
        headers: {
          "X-Auth-Token": process.env.DOCUSEAL_API_KEY ?? '',
          "Content-Type": "application/json",
        },
      }
    );

    if (!docusealResponse.ok) {
      const errorData = await docusealResponse.json();
      return NextResponse.json(errorData, {
        status: docusealResponse.status,
      });
    }

    const submission = await docusealResponse.json();
    return NextResponse.json(submission);
  } catch (error: unknown) {
    const { id } = await params;
    console.error(`Error fetching DocuSeal submission ${id}:`, error);
    return NextResponse.json(
      { message: "Internal Server Error", error: (error as Error).message ?? String(error) },
      { status: 500 }
    );
  }
}


// Note: Resend functionality should use PUT /submitters/{id} endpoint
// This is handled in the submitters API route

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const awaitedParams = await params;
  const id = awaitedParams.id;
  console.log('[api/docuseal/submissions/[id]] DELETE request received for ID:', id);
  const session = await getServerSession(authOptions);
  if (!session) {
    console.warn('[api/docuseal/submissions/[id]] Unauthorized: No session found.');
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  console.log('[api/docuseal/submissions/[id]] Session found for user:', session.user?.email);

  try {
    const docusealApiKey = process.env.DOCUSEAL_API_KEY;
    if (!docusealApiKey) {
      console.error('[api/docuseal/submissions/[id]] DOCUSEAL_API_KEY is not set.');
      return NextResponse.json({ message: "Server configuration error: DocuSeal API key missing." }, { status: 500 });
    }
    console.log('[api/docuseal/submissions/[id]] Using DOCUSEAL_API_KEY:', docusealApiKey ? 'present' : 'missing');

    const docusealResponse = await fetch(
      `${DOCUSEAL_API_BASE_URL}/submissions/${id}?permanently=true`,
      {
        method: "DELETE",
        headers: {
          "X-Auth-Token": docusealApiKey,
        },
      }
    );
    if (!docusealResponse.ok) {
      const errorData = await docusealResponse.json();
      console.error('[api/docuseal/submissions/[id]] DocuSeal DELETE error:', { status: docusealResponse.status, body: errorData });
      return NextResponse.json(errorData, {
        status: docusealResponse.status,
      });
    }

    console.log('[api/docuseal/submissions/[id]] DocuSeal DELETE success', { id });
    return NextResponse.json(
      { message: "Submission deleted successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error(`Error deleting DocuSeal submission ${id}:`, error);
    return NextResponse.json(
      { message: "Internal Server Error", error: (error as Error).message ?? String(error) },
      { status: 500 }
    );
  }
}