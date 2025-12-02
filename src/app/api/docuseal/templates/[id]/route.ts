import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = 'nodejs';

const DOCUSEAL_API_BASE_URL = process.env.DOCUSEAL_URL || "https://api.docuseal.com";

/**
 * GET /api/docuseal/templates/[id]
 * Fetches a specific template details from DocuSeal
 * Used to determine number of parties and build dynamic submission form
 */
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);

    // Require authentication
    if (!session) {
        return NextResponse.json(
            { message: "Unauthorized - please sign in" },
            { status: 401 }
        );
    }

    const templateId = params.id;

    try {
        const apiPath = DOCUSEAL_API_BASE_URL.includes('api.docuseal.com') ? 'templates' : 'api/templates';
        const url = `${DOCUSEAL_API_BASE_URL}/${apiPath}/${templateId}`;

        console.log('Fetching template details from DocuSeal:', url);

        const docusealResponse = await fetch(url, {
            headers: {
                "X-Auth-Token": process.env.DOCUSEAL_API_KEY ?? '',
                "Content-Type": "application/json",
            },
            cache: 'no-store',
        });

        if (!docusealResponse.ok) {
            const errorText = await docusealResponse.text();
            console.error('DocuSeal API error:', docusealResponse.status, errorText);
            return NextResponse.json(
                { message: `DocuSeal API error: ${docusealResponse.status}`, details: errorText },
                { status: docusealResponse.status }
            );
        }

        const template = await docusealResponse.json();
        console.log(`Template ${templateId} fetched successfully. Submitters: ${template.submitters?.length || 0}`);

        return NextResponse.json(template);
    } catch (error: unknown) {
        console.error("Error fetching template:", error);
        return NextResponse.json(
            {
                message: "Internal Server Error",
                error: (error as Error).message ?? String(error)
            },
            { status: 500 }
        );
    }
}
