import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";

export const runtime = 'nodejs';

const DOCUSEAL_API_BASE_URL = process.env.DOCUSEAL_URL || "https://api.docuseal.com";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(request);
  if (!session) {
    console.warn('[api/docuseal/templates/[id]] no session - proceeding as anonymous');
  }

  // Next.js recommends awaiting params in dynamic API routes
  const awaitedParams = await params;
  const id = awaitedParams.id;
  try {
    const res = await fetch(`${DOCUSEAL_API_BASE_URL}/templates/${id}`, {
      headers: {
        "X-Auth-Token": process.env.DOCUSEAL_API_KEY ?? "",
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(errorData, { status: res.status });
    }

    const data = await res.json();
    // wrap single template into { data }
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error fetching DocuSeal template ${id}:`, message);
    return NextResponse.json({ message: "Internal Server Error", error: message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(request);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const awaitedParams = await params;
  const id = awaitedParams.id;
  try {
    // Accept either JSON body (metadata update) or multipart/form-data (document replacement)
    const contentType = request.headers.get("content-type") || "";
    let res: Response;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");

      if (!file) {
        return NextResponse.json({ message: 'File is required for document update' }, { status: 400 });
      }

      // convert file to base64 and call /templates/{id}/documents as JSON
      type UploadedFile = { name?: string; type?: string; arrayBuffer: () => Promise<ArrayBuffer> };
      const uploaded = file as unknown as UploadedFile;
      const arrayBuffer = await uploaded.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      const filename = uploaded.name || 'document';

      const payload = {
        documents: [
          {
            name: filename,
            file: base64,
          },
        ],
      };

      res = await fetch(`${DOCUSEAL_API_BASE_URL}/templates/${id}/documents`, {
        method: "PUT",
        headers: {
          "X-Auth-Token": process.env.DOCUSEAL_API_KEY ?? "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } else {
      const body = await request.json();
      res = await fetch(`${DOCUSEAL_API_BASE_URL}/templates/${id}`, {
        method: "PUT",
        headers: {
          "X-Auth-Token": process.env.DOCUSEAL_API_KEY ?? "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    }

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(errorData, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error updating DocuSeal template ${id}:`, message);
    return NextResponse.json({ message: "Internal Server Error", error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(request);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const awaitedParams = await params;
  const id = awaitedParams.id;
  try {
    const outgoingUrl = `${DOCUSEAL_API_BASE_URL}/templates/${id}`;
    console.log('[api/docuseal/templates/[id]] DELETE forwarding to DocuSeal', { outgoingUrl, hasApiKey: !!process.env.DOCUSEAL_API_KEY });
    const res = await fetch(outgoingUrl, {
      method: "DELETE",
      headers: { "X-Auth-Token": process.env.DOCUSEAL_API_KEY ?? "" },
    });

    if (!res.ok) {
      const bodyText = await res.text();
      let parsed: unknown = bodyText;
      try { parsed = JSON.parse(bodyText); } catch { /* not JSON */ }
      console.error('[api/docuseal/templates/[id]] DocuSeal DELETE error', { status: res.status, body: parsed });
      return NextResponse.json(parsed, { status: res.status });
    }

    console.log('[api/docuseal/templates/[id]] DocuSeal DELETE success', { id });
    return NextResponse.json({ message: "Template deleted successfully" }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error deleting DocuSeal template ${id}:`, message);
    return NextResponse.json({ message: "Internal Server Error", error: message }, { status: 500 });
  }
}