import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config used by middleware. Does NOT include the
 * Credentials provider or the Drizzle adapter (both depend on Node-only
 * modules: bcryptjs and the Neon driver).
 */
export const authConfig = {
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;

      const PUBLIC_PREFIXES = [
        "/login",
        "/signup",
        "/forgot-password",
        "/reset-password",
        "/pending",
        "/rejected",
        "/api/auth",
        "/api/signup",
        "/api/password-reset",
      ];
      const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

      if (isPublic) return true;
      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
