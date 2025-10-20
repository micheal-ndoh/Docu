import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { db } from "@/db"

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Prefer explicit BETTER_AUTH_URL (production), then NEXTAUTH_URL for
      // backwards compatibility. Only fallback to localhost for local dev.
      redirectURI: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/callback/google`,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000",
  rateLimit: {
    window: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
  },
})

export type Session = typeof auth.$Infer.Session

// Helper to obtain server session in a stable way for API routes.
// The better-auth library exposes various helpers; use defensive checks
// so this code works across versions and in environments where server
// session helpers may not be available.
export async function getServerSession(request?: Request): Promise<Session | null> {
  try {
    const anyAuth = auth as any;
    console.log('[getServerSession] Attempting to get server session...');

    if (typeof anyAuth.getServerSession === 'function') {
      const session = await anyAuth.getServerSession(request ?? undefined);
      console.log('[getServerSession] Using getServerSession, session:', session ? 'found' : 'not found');
      return session;
    }

    if (typeof anyAuth.getSession === 'function') {
      const session = await anyAuth.getSession(request ?? undefined);
      console.log('[getServerSession] Using getSession, session:', session ? 'found' : 'not found');
      return session;
    }

    console.warn('[getServerSession] No server session helper found in better-auth.');
    return null;
  } catch (error) {
    console.error('[getServerSession] Error obtaining server session from better-auth:', error);
    return null;
  }
}
