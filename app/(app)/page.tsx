import { redirect } from "next/navigation";
import { eq, asc } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { fetchEventsInRange } from "@/lib/events";
import CalendarHome from "./CalendarHome";

export const metadata = { title: "Calendar · HooNott Portal" };
export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.status !== "approved") redirect("/pending");

  const now = new Date();
  const rangeStart = new Date(now);
  rangeStart.setFullYear(rangeStart.getFullYear() - 1);
  const rangeEnd = new Date(now);
  rangeEnd.setFullYear(rangeEnd.getFullYear() + 1);

  const [initialEvents, approvedUsers] = await Promise.all([
    fetchEventsInRange(rangeStart, rangeEnd),
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        color: users.color,
      })
      .from(users)
      .where(eq(users.status, "approved"))
      .orderBy(asc(users.name)),
  ]);

  return (
    <CalendarHome
      initialEvents={initialEvents}
      users={approvedUsers}
      currentUser={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        color: session.user.color,
      }}
    />
  );
}
