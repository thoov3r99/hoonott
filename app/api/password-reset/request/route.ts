import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { z } from "zod";

import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { sendPasswordResetEmail } from "@/lib/email/send";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
});

function back(req: NextRequest, params: URLSearchParams): NextResponse {
  return NextResponse.redirect(
    new URL(`/forgot-password?${params.toString()}`, req.url),
    { status: 303 }
  );
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return back(req, new URLSearchParams({ error: "invalid" }));
  }
  const email = parsed.data.email;

  try {
    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (row && row.passwordHash) {
      const token = randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + TOKEN_TTL_MS);

      // wipe any prior tokens for this email
      await db
        .delete(verificationTokens)
        .where(eq(verificationTokens.identifier, email));
      await db.insert(verificationTokens).values({
        identifier: email,
        token,
        expires,
      });

      await sendPasswordResetEmail({ to: email, token });
    }
  } catch (err) {
    console.error("[password-reset] request failed", err);
    // swallow — same response either way to avoid email enumeration
  }

  return back(req, new URLSearchParams({ ok: "1" }));
}
