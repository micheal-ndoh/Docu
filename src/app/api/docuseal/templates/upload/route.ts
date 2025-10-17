import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

const DOCUSEAL_API_BASE_URL = process.env.DOCUSEAL_URL || 'https://api.docuseal.com';

export async function POST(request: Request) {
  const session = await getServerSession();
  // Allow use of a server-side API key when no user session is available
  const hasServerApiKey = !!process.env.DOCUSEAL_API_KEY;
  if (!session && !hasServerApiKey) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const name = (formData.get('name') as string) || formData.get('template_name') || 'Uploaded Template';

    if (!file) {
      return NextResponse.json({ message: 'File is required' }, { status: 400 });
    }

    // Convert uploaded File -> base64 so we can call /templates/pdf or /templates/docx which expect JSON with base64 file
    type UploadedFile = {
      name?: string;
      type?: string;
      arrayBuffer: () => Promise<ArrayBuffer>;
    };
    const uploaded = file as unknown as UploadedFile;
    const arrayBuffer = await uploaded.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    const mime = uploaded.type || '';
    const filename = uploaded.name || 'document';
    const isDocx = mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || filename.toLowerCase().endsWith('.docx');

    let targetPath = '/templates/pdf';
    if (isDocx) targetPath = '/templates/docx';

    const outgoingUrl = `${DOCUSEAL_API_BASE_URL}${targetPath}`;

    const bodyPayload = {
      name: name,
      documents: [
        {
          name: filename,
          file: base64,
        },
      ],
    } as unknown;

    const res = await fetch(outgoingUrl, {
      method: 'POST',
      headers: {
        'X-Auth-Token': process.env.DOCUSEAL_API_KEY ?? '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyPayload),
    });

    if (!res.ok) {
      const bodyText = await res.text();
      let parsed: unknown = bodyText;
      try { parsed = JSON.parse(bodyText); } catch { /* not JSON */ }
      return NextResponse.json(parsed, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error creating DocuSeal template:', message);
    return NextResponse.json({ message: 'Internal Server Error', error: message }, { status: 500 });
  }
}
