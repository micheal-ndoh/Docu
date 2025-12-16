import { NextAuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import { db } from "@/db";

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_ID!,
      clientSecret: process.env.KEYCLOAK_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the OAuth access_token and user info to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        token.keycloakId = account.providerAccountId;
      }
      if (profile) {
        token.email = profile.email;
        token.name = profile.name;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (session.user) {
        session.idToken = token.idToken as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;

        // Sync user to database and get the actual database user ID
        const keycloakId = token.keycloakId as string;
        if (keycloakId) {
          let existingUser = await db.user.findFirst({
            where: { email: token.email as string },
          });

          if (!existingUser) {
            // Create new user - let Prisma generate the CUID
            existingUser = await db.user.create({
              data: {
                email: token.email as string,
                name: token.name as string,
                emailVerified: null,
                image: null,
              },
            });
          }

          // Use the actual database user ID, not the Keycloak ID
          session.user.id = existingUser.id;
        } else {
          // Fallback to token.sub if no keycloakId (shouldn't happen normally)
          session.user.id = token.sub!;
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // If the URL is a relative path, prepend baseUrl
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // If the URL is from the same origin, use it
      if (url.startsWith(baseUrl)) {
        return url;
      }
      // Default to submissions page
      return `${baseUrl}/submissions`;
    },
  },
  pages: {
    signIn: '/', // Redirect to home if not authenticated
  },
  session: {
    strategy: "jwt", // Changed from "database" for troubleshooting
  },
};
