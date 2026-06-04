import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { users } from "@/db/schema";
import { ADMIN_EMAIL } from "@/lib/env";
import { sendAdminNewSignupEmail } from "@/lib/email/send";

const signupSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(255),
  phone: z.string().trim().min(3).max(40),
  password: z.string().min(8).max(200),
});

function backToSignup(req: NextRequest, params: URLSearchParams): NextResponse {
  const url = new URL(`/signup?${params.toString()}`, req.url);
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const params = new URLSearchParams({ error: "invalid" });
    return backToSignup(req, params);
  }
  const { name, email, phone, password } = parsed.data;

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  const current = existing[0];

  if (current) {
    if (current.status === "approved") {
      return backToSignup(req, new URLSearchParams({ error: "exists_active" }));
    }
    if (current.status === "pending") {
      return backToSignup(req, new URLSearchParams({ error: "exists_pending" }));
    }
    // rejected — allow re-application: flip back to pending and update fields
    const passwordHash = await bcrypt.hash(password, 12);
    await db
      .update(users)
      .set({
        name,
        phone,
        passwordHash,
        status: "pending",
        approvedAt: null,
        approvedBy: null,
      })
      .where(eq(users.id, current.id));

    await sendAdminNewSignupEmail({
      name,
      email,
      phone,
      method: "credentials",
    });
    return backToSignup(req, new URLSearchParams({ ok: "1" }));
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const isAdminEmail = email === ADMIN_EMAIL;
  await db.insert(users).values({
    name,
    email,
    phone,
    passwordHash,
    status: isAdminEmail ? "approved" : "pending",
    role: isAdminEmail ? "admin" : "user",
    approvedAt: isAdminEmail ? new Date() : null,
  });

  if (!isAdminEmail) {
    await sendAdminNewSignupEmail({
      name,
      email,
      phone,
      method: "credentials",
    });
  }

  return backToSignup(req, new URLSearchParams({ ok: "1" }));
}
