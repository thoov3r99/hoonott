import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users, accounts, verificationTokens } from "@/db/schema";
import { ADMIN_EMAIL } from "@/lib/env";
import { nextFreeColor } from "@/lib/palette";
import { sendAdminNewSignupEmail } from "@/lib/email/send";
import authConfig from "./auth.config";

class InvalidLogin extends CredentialsSignin {
  code = "invalid-credentials";
}

class AccountPending extends CredentialsSignin {
  code = "pending";
}

class AccountRejected extends CredentialsSignin {
  code = "rejected";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) throw new InvalidLogin();

        const [row] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!row || !row.passwordHash) throw new InvalidLogin();
        const ok = await bcrypt.compare(password, row.passwordHash);
        if (!ok) throw new InvalidLogin();

        if (row.status === "pending") throw new AccountPending();
        if (row.status === "rejected") throw new AccountRejected();

        return {
          id: row.id,
          email: row.email,
          name: row.name,
          image: row.image,
          status: row.status,
          role: row.role,
          color: row.color,
        };
      },
    }),
  ],
  events: {
    async createUser({ user }) {
      if (!user.id || !user.email) return;
      const email = user.email.toLowerCase();

      if (email === ADMIN_EMAIL) {
        const allColors = await db
          .select({ color: users.color })
          .from(users);
        await db
          .update(users)
          .set({
            status: "approved",
            role: "admin",
            color: nextFreeColor(allColors.map((u) => u.color)),
            approvedAt: new Date(),
          })
          .where(eq(users.id, user.id));
        return;
      }

      await sendAdminNewSignupEmail({
        name: user.name ?? null,
        email,
        phone: null,
        method: "google",
      });
    },
  },
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (!user?.email) return false;
      const email = user.email.toLowerCase();

      if (account?.provider === "google") {
        const [row] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
        if (!row) return true; // adapter will create; events.createUser handles it
        if (row.status === "approved") return true;
        if (row.status === "pending") return "/pending";
        if (row.status === "rejected") return "/rejected";
      }

      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = (user as { id?: string }).id ?? token.sub;
        token.status = (user as { status?: "pending" | "approved" | "rejected" }).status;
        token.role = (user as { role?: "user" | "admin" }).role;
        token.color = (user as { color?: string | null }).color ?? null;
      }

      if (!token.status || trigger === "update") {
        const id = token.id ?? token.sub;
        if (id) {
          const [row] = await db
            .select({
              status: users.status,
              role: users.role,
              color: users.color,
              email: users.email,
              name: users.name,
            })
            .from(users)
            .where(eq(users.id, id))
            .limit(1);
          if (row) {
            token.status = row.status;
            token.role = row.role;
            token.color = row.color;
            token.email = row.email;
            token.name = row.name;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id ?? token.sub ?? "") as string;
        session.user.status = (token.status ?? "pending") as
          | "pending"
          | "approved"
          | "rejected";
        session.user.role = (token.role ?? "user") as "user" | "admin";
        session.user.color = (token.color ?? null) as string | null;
      }
      return session;
    },
  },
});
