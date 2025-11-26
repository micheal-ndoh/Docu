import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = 'nodejs';

const DOCUSEAL_API_BASE_URL = process.env.DOCUSEAL_URL || "https://api.docuseal.com";

/**
 * GET /api/docuseal/templates
 * Fetches all templates from DocuSeal (admin-created templates)
 * Any authenticated user can view all templates
 */
export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    // Require authentication to view templates
    if (!session) {
        return NextResponse.json(
            { message: "Unauthorized - please sign in to view templates" },
            { status: 401 }
        );
    }

    try {
        const { searchParams } = new URL(request.url);

        // Build query parameters for DocuSeal API
        const params = new URLSearchParams();

        // Pagination parameters
        const limit = searchParams.get("limit") || "100"; // Get more templates by default
        params.append("limit", limit);

        if (searchParams.has("after")) {
            params.append("after", searchParams.get("after")!);
        }
        if (searchParams.has("before")) {
            params.append("before", searchParams.get("before")!);
        }

        // Filter parameters
        if (searchParams.has("folder")) {
            params.append("folder", searchParams.get("folder")!);
        }

        if (searchParams.has("external_id")) {
            params.append("external_id", searchParams.get("external_id")!);
        }

        if (searchParams.has("archived")) {
            params.append("archived", searchParams.get("archived")!);
        }

        // Search query
        if (searchParams.has("q")) {
            params.append("q", searchParams.get("q")!);
        }

        const url = `${DOCUSEAL_API_BASE_URL}/templates?${params.toString()}`;

        console.log('Fetching templates from DocuSeal:', url);

        const docusealResponse = await fetch(url, {
            headers: {
                "X-Auth-Token": process.env.DOCUSEAL_API_KEY ?? '',
                "Content-Type": "application/json",
            },
            cache: 'no-store', // Don't cache to always get fresh templates
        });

        if (!docusealResponse.ok) {
            const errorData = await docusealResponse.json();
            console.error('DocuSeal API error:', docusealResponse.status, errorData);
            return NextResponse.json(errorData, {
                status: docusealResponse.status,
            });
        }

        const data = await docusealResponse.json();
        console.log('Templates fetched successfully:', data);

        // Return the data in the expected format
        // DocuSeal returns { data: [...], pagination: {...} }
        return NextResponse.json(data);
    } catch (error: unknown) {
        console.error("Error fetching DocuSeal templates:", error);
        return NextResponse.json(
            {
                message: "Internal Server Error",
                error: (error as Error).message ?? String(error)
            },
            { status: 500 }
        );
    }
}
