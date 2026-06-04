import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  token: z.string().min(10).max(200),
  password: z.string().min(8).max(200),
});

function backToReset(
  req: NextRequest,
  email: string,
  token: string,
  error: string
): NextResponse {
  const params = new URLSearchParams({ email, token, error });
  return NextResponse.redirect(
    new URL(`/reset-password?${params.toString()}`, req.url),
    { status: 303 }
  );
}

function success(req: NextRequest): NextResponse {
  return NextResponse.redirect(
    new URL(`/reset-password?ok=1`, req.url),
    { status: 303 }
  );
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const parsed = schema.safeParse({
    email: formData.get("email"),
    token: formData.get("token"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const email = String(formData.get("email") ?? "");
    const token = String(formData.get("token") ?? "");
    const isPasswordIssue = parsed.error.issues.some((i) =>
      i.path.includes("password")
    );
    return backToReset(
      req,
      email,
      token,
      isPasswordIssue ? "weak_password" : "invalid_token"
    );
  }

  const { email, token, password } = parsed.data;

  try {
    const [tokenRow] = await db
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, email),
          eq(verificationTokens.token, token)
        )
      )
      .limit(1);

    if (!tokenRow || tokenRow.expires.getTime() < Date.now()) {
      return backToReset(req, email, token, "invalid_token");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.email, email));

    await db
      .delete(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, email),
          eq(verificationTokens.token, token)
        )
      );

    return success(req);
  } catch (err) {
    console.error("[password-reset] confirm failed", err);
    return backToReset(req, email, token, "server");
  }
}
