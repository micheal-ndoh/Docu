import { NextResponse } from 'next/server'

export async function GET() {
    // Return only non-sensitive truthy information so it's safe to expose
    const present = {
        DOCUSEAL_API_KEY: !!process.env.DOCUSEAL_API_KEY,
        DOCUSEAL_URL: !!process.env.DOCUSEAL_URL,
        BETTER_AUTH_URL: !!process.env.BETTER_AUTH_URL,
        NEXT_PUBLIC_BETTER_AUTH_URL: !!process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
        GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
        BETTER_AUTH_SECRET: !!process.env.BETTER_AUTH_SECRET,
    }

    return NextResponse.json({ ok: true, env: present })
}
