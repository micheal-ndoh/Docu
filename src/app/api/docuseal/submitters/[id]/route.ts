import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";

const DOCUSEAL_API_BASE_URL = process.env.DOCUSEAL_URL || "https://api.docuseal.com";

export async function GET(
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
      `${DOCUSEAL_API_BASE_URL}/submitters/${id}`,
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
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error(`Error fetching DocuSeal submitter ${params.id}:`, error);
    return NextResponse.json(
      { message: "Internal Server Error", error: (error as Error).message ?? String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;
    const body = await request.json();

    const docusealResponse = await fetch(
      `${DOCUSEAL_API_BASE_URL}/submitters/${id}`,
      {
        method: "PUT",
        headers: {
          "X-Auth-Token": process.env.DOCUSEAL_API_KEY ?? '',
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!docusealResponse.ok) {
      const errorData = await docusealResponse.json();
      return NextResponse.json(errorData, {
        status: docusealResponse.status,
      });
    }

    const data = await docusealResponse.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error(`Error updating DocuSeal submitter ${params.id}:`, error);
    return NextResponse.json(
      { message: "Internal Server Error", error: (error as Error).message ?? String(error) },
      { status: 500 }
    );
  }
}
