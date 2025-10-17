import { createAuthClient } from "better-auth/react"

// Use NEXT_PUBLIC_BETTER_AUTH_URL when provided (production), otherwise
// default to a relative base so the client calls the same origin where the
// frontend is served. This avoids hard-coding `http://localhost:3000` which
// breaks in deployments and triggers CORS issues.
const clientBase = process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? ""

export const authClient = createAuthClient({
  baseURL: clientBase,
})

export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient
