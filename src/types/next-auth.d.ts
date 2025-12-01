import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        /** OpenID ID Token */
        idToken?: string
        user: {
            /** The user's unique identifier. */
            id: string
        } & DefaultSession["user"]
    }

    interface Profile {
        email?: string
        name?: string
    }
}

declare module "next-auth/jwt" {
    /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
    interface JWT {
        /** OpenID ID Token */
        idToken?: string
        /** Keycloak user ID */
        keycloakId?: string
    }
}
