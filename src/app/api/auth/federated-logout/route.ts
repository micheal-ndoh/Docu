import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.idToken) {
        console.warn("No session or idToken found for federated logout");
        return NextResponse.json({ url: process.env.NEXTAUTH_URL || "http://localhost:3000" });
    }

    const idToken = session.idToken;
    const issuer = process.env.KEYCLOAK_ISSUER;
    const nextAuthUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    // Keycloak logout URL structure
    // ${issuer}/protocol/openid-connect/logout?post_logout_redirect_uri=${encodedRedirectUri}&id_token_hint=${idToken}

    const logoutUrl = `${issuer}/protocol/openid-connect/logout?post_logout_redirect_uri=${encodeURIComponent(
        nextAuthUrl
    )}&id_token_hint=${idToken}`;

    return NextResponse.json({ url: logoutUrl });
}
