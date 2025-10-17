import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";

export const runtime = 'nodejs';

// DocuSeal API base - can be self-hosted or cloud (https://api.docuseal.com)
const DOCUSEAL_API_BASE_URL = process.env.DOCUSEAL_URL || "https://api.docuseal.com";

export async function GET(request: Request) {
  const session = await getServerSession(request);
  console.log('[api/docuseal/templates] runtime-info', { NODE_ENV: process.env.NODE_ENV, runtime: typeof globalThis !== 'undefined' ? (globalThis as any).process?.release?.name ?? 'unknown' : 'unknown', sessionFound: !!session });
  if (!session) {
    // Allow anonymous reads (local/dev) so the UI can load templates using the server-side proxy.
    // If you want to enforce auth in production, gate this behind an env flag.
    console.warn('[api/docuseal/templates] no session - proceeding as anonymous');
  }

  console.log('[api/docuseal/templates] GET', { url: request.url });

  try {
    const { searchParams } = new URL(request.url);
    // Forward commonly used filters from query string (q, slug, external_id, folder, archived, limit, after, before)
    const allowed = [
      'q',
      'slug',
      'external_id',
      'folder',
      'archived',
      'limit',
      'after',
      'before'
    ];
    const forwarded = new URLSearchParams();
    for (const key of allowed) {
      const v = searchParams.get(key);
      if (v) forwarded.set(key, v);
    }
    // default to limit=10 if not provided
    if (!forwarded.has('limit')) forwarded.set('limit', '10');

    const outgoingUrl = `${DOCUSEAL_API_BASE_URL}/templates?${forwarded.toString()}`;
    console.log('[api/docuseal/templates] forwarding GET to DocuSeal', { outgoingUrl, hasApiKey: !!process.env.DOCUSEAL_API_KEY, apiKeyLength: process.env.DOCUSEAL_API_KEY?.length ?? 0 });
    const docusealResponse = await fetch(outgoingUrl, {
      headers: {
        "X-Auth-Token": process.env.DOCUSEAL_API_KEY ?? "",
      },
    });

    if (!docusealResponse.ok) {
      // Log DocuSeal error for debugging
      const bodyText = await docusealResponse.text();
      let parsed: unknown = bodyText;
      try { parsed = JSON.parse(bodyText); } catch { /* not JSON */ }
      console.error('[api/docuseal/templates] DocuSeal GET error', { status: docusealResponse.status, body: parsed });
      return NextResponse.json(parsed, { status: docusealResponse.status });
    }

    const data = await docusealResponse.json();
    // Normalize array responses to { data: [...] } so frontend can rely on a consistent shape
    if (Array.isArray(data)) {
      return NextResponse.json({ data });
    }
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error fetching DocuSeal templates:", message);
    return NextResponse.json(
      { message: "Internal Server Error", error: message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(request);
  console.log('[api/docuseal/templates] runtime-info', { NODE_ENV: process.env.NODE_ENV, runtime: typeof globalThis !== 'undefined' ? (globalThis as any).process?.release?.name ?? 'unknown' : 'unknown', sessionFound: !!session });
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  console.log('[api/docuseal/templates] POST received', {
    url: request.url,
    contentType: request.headers.get('content-type'),
  });

  try {
    const formData = await request.formData();
    // Debug: list form keys to ensure file was received
    const keys: string[] = [];
    for (const key of formData.keys()) keys.push(key as string);
    console.log('[api/docuseal/templates] formData keys:', keys);
    const file = formData.get('file') as File | null;
    const name = (formData.get('name') as string) || formData.get('template_name') || 'Untitled Template';

    if (!file) {
      console.error('[api/docuseal/templates] no file provided in formData');
      return NextResponse.json({ message: 'File is required' }, { status: 400 });
    }

    // Minimal typed access to File-like object to satisfy linter
    type UploadedFile = {
      name?: string;
      type?: string;
      arrayBuffer: () => Promise<ArrayBuffer>;
    };

    const uploaded = file as unknown as UploadedFile;

    // Convert uploaded File -> base64 so we can call /templates/pdf or /templates/docx which expect JSON with base64 file
    const arrayBuffer = await uploaded.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    // Detect file type by mime or filename
    const mime = uploaded.type || '';
    const filename = uploaded.name || 'document';
    const isPdf = mime === 'application/pdf' || filename.toLowerCase().endsWith('.pdf');
    const isDocx = mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || filename.toLowerCase().endsWith('.docx');

    let targetPath = '/templates/pdf';
    if (isDocx) targetPath = '/templates/docx';
    if (!isPdf && !isDocx) {
      // If non-pdf/docx, fallback to /templates/pdf if docuseal accepts it, but warn
      console.warn('[api/docuseal/templates] unknown file mime, defaulting to PDF endpoint', { mime, fileName: filename });
    }

    const outgoingUrl = `${DOCUSEAL_API_BASE_URL}${targetPath}`;
    console.log('[api/docuseal/templates] forwarding POST to DocuSeal (json)', { outgoingUrl, targetPath, hasApiKey: !!process.env.DOCUSEAL_API_KEY });

    const bodyPayload = {
      name: name,
      documents: [
        {
          name: filename,
          file: base64,
        },
      ],
    } as unknown;

    const docusealResponse = await fetch(outgoingUrl, {
      method: 'POST',
      headers: {
        'X-Auth-Token': process.env.DOCUSEAL_API_KEY ?? "",
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyPayload),
    });

    if (!docusealResponse.ok) {
      const bodyText = await docusealResponse.text();
      let parsed: unknown = bodyText;
      try { parsed = JSON.parse(bodyText); } catch { /* not JSON */ }
      console.error('[api/docuseal/templates] DocuSeal POST error', { status: docusealResponse.status, body: parsed });
      return NextResponse.json(parsed, { status: docusealResponse.status });
    }

    const data = await docusealResponse.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error creating DocuSeal template:', message);
    return NextResponse.json(
      { message: 'Internal Server Error', error: message },
      { status: 500 }
    );
  }
}
