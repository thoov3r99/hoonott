import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/db";
import { events, eventAttendees } from "@/db/schema";
import { canEditEvent, isApproved } from "@/lib/permissions";
import { fetchEventById } from "@/lib/events";

const patchSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    location: z.string().trim().max(300).optional().nullable(),
    description: z.string().trim().max(2000).optional().nullable(),
    allDay: z.boolean(),
    startsAt: z.string().min(1),
    endsAt: z.string().min(1),
    attendeeIds: z.array(z.string().min(1)).min(1).max(50),
  })
  .refine(
    (v) => new Date(v.endsAt).getTime() >= new Date(v.startsAt).getTime(),
    { message: "endsAt must be >= startsAt", path: ["endsAt"] }
  );

async function loadEvent(id: string) {
  const [row] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return row ?? null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !isApproved(session.user)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const row = await loadEvent(id);
  if (!row) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!canEditEvent(row, session.user)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const v = parsed.data;

  await db
    .update(events)
    .set({
      title: v.title,
      location: v.location ?? null,
      description: v.description ?? null,
      allDay: v.allDay,
      startsAt: new Date(v.startsAt),
      endsAt: new Date(v.endsAt),
      updatedAt: new Date(),
    })
    .where(eq(events.id, id));

  const attendeeIds = Array.from(new Set(v.attendeeIds));
  await db.delete(eventAttendees).where(eq(eventAttendees.eventId, id));
  await db
    .insert(eventAttendees)
    .values(attendeeIds.map((uid) => ({ eventId: id, userId: uid })));

  const full = await fetchEventById(id);
  return NextResponse.json({ event: full });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !isApproved(session.user)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const row = await loadEvent(id);
  if (!row) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!canEditEvent(row, session.user)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  await db.delete(events).where(eq(events.id, id));
  return NextResponse.json({ ok: true });
}
