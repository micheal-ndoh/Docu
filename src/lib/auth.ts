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
      redirectURI: `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/api/auth/callback/google`,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
})

export type Session = typeof auth.$Infer.Session

// Helper to obtain server session in a stable way for API routes.
// The better-auth library exposes various helpers; for our API routes
// we provide a thin wrapper that can be extended later to call the
// appropriate method on `auth` (for now it returns null when no
// session handling is available during static analysis).
export async function getServerSession(): Promise<Session | null> {
  // If the better-auth instance exposes a `getSession` or similar helper
  // we could call it here (for example: return await auth.getSession());
  // To avoid type errors during static analysis, return null by default.
  return null as unknown as Session | null;
}
