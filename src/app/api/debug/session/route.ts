import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        return NextResponse.json({
            hasSession: !!session,
            session: session,
            env: {
                KEYCLOAK_ID: process.env.KEYCLOAK_ID ? "SET" : "NOT SET",
                KEYCLOAK_SECRET: process.env.KEYCLOAK_SECRET ? "SET" : "NOT SET",
                KEYCLOAK_ISSUER: process.env.KEYCLOAK_ISSUER,
                NEXTAUTH_URL: process.env.NEXTAUTH_URL,
                NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "SET" : "NOT SET",
            }
        });
    } catch (error) {
        return NextResponse.json({
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}
