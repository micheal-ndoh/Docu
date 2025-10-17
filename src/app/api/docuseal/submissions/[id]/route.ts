import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";

const DOCUSEAL_API_BASE_URL = process.env.DOCUSEAL_URL || "https://api.docuseal.com";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();
  if (!session) {
    console.warn('[api/docuseal/submissions/[id]] no session - proceeding as anonymous');
  }

  try {
    const { id } = params;
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

    const data = await docusealResponse.json();
    return NextResponse.json({ data });
  } catch (error: unknown) {
    console.error(`Error fetching DocuSeal submission ${params.id}:`, error);
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
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;
    const docusealResponse = await fetch(
      `${DOCUSEAL_API_BASE_URL}/submissions/${id}`,
      {
        method: "DELETE",
        headers: {
          "X-Auth-Token": process.env.DOCUSEAL_API_KEY ?? '',
        },
      }
    );

    if (!docusealResponse.ok) {
      const errorData = await docusealResponse.json();
      return NextResponse.json(errorData, {
        status: docusealResponse.status,
      });
    }

    return NextResponse.json(
      { message: "Submission deleted successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error(`Error deleting DocuSeal submission ${params.id}:`, error);
    return NextResponse.json(
      { message: "Internal Server Error", error: (error as Error).message ?? String(error) },
      { status: 500 }
    );
  }
}