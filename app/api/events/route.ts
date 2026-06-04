import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/db";
import { events, eventAttendees } from "@/db/schema";
import { fetchEventsInRange, fetchEventById } from "@/lib/events";
import { isApproved } from "@/lib/permissions";

const eventInputSchema = z
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

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!isApproved(session?.user)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const startParam = url.searchParams.get("start");
  const endParam = url.searchParams.get("end");
  if (!startParam || !endParam) {
    return NextResponse.json(
      { error: "start and end query params required" },
      { status: 400 }
    );
  }
  const rangeStart = new Date(startParam);
  const rangeEnd = new Date(endParam);
  if (Number.isNaN(rangeStart.getTime()) || Number.isNaN(rangeEnd.getTime())) {
    return NextResponse.json({ error: "invalid date" }, { status: 400 });
  }
  const data = await fetchEventsInRange(rangeStart, rangeEnd);
  return NextResponse.json({ events: data });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isApproved(session.user)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const parsed = eventInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const v = parsed.data;
  const startsAt = new Date(v.startsAt);
  const endsAt = new Date(v.endsAt);

  const attendeeIds = Array.from(new Set(v.attendeeIds));
  const userId = session.user.id;

  const [created] = await db
    .insert(events)
    .values({
      title: v.title,
      location: v.location ?? null,
      description: v.description ?? null,
      allDay: v.allDay,
      startsAt,
      endsAt,
      createdBy: userId,
    })
    .returning();

  await db
    .insert(eventAttendees)
    .values(attendeeIds.map((id) => ({ eventId: created.id, userId: id })));

  const full = await fetchEventById(created.id);
  return NextResponse.json({ event: full }, { status: 201 });
}
