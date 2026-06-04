import { NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { isApproved } from "@/lib/permissions";

export async function GET() {
  const session = await auth();
  if (!session?.user || !isApproved(session.user)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      color: users.color,
    })
    .from(users)
    .where(eq(users.status, "approved"))
    .orderBy(asc(users.name));
  return NextResponse.json({ users: rows });
}
