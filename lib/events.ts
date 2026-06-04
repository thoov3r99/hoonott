import { and, gte, lte, inArray, eq } from "drizzle-orm";
import { db } from "@/db";
import { events, eventAttendees, users } from "@/db/schema";

export type EventAttendeeDto = {
  id: string;
  name: string | null;
  color: string | null;
};

export type EventDto = {
  id: string;
  title: string;
  location: string | null;
  description: string | null;
  allDay: boolean;
  startsAt: string;
  endsAt: string;
  createdBy: string;
  attendees: EventAttendeeDto[];
};

export async function fetchEventsInRange(
  rangeStart: Date,
  rangeEnd: Date
): Promise<EventDto[]> {
  const eventRows = await db
    .select()
    .from(events)
    .where(
      and(lte(events.startsAt, rangeEnd), gte(events.endsAt, rangeStart))
    );

  if (eventRows.length === 0) return [];

  const eventIds = eventRows.map((e) => e.id);
  const attendeeRows = await db
    .select({
      eventId: eventAttendees.eventId,
      userId: users.id,
      name: users.name,
      color: users.color,
    })
    .from(eventAttendees)
    .innerJoin(users, eq(users.id, eventAttendees.userId))
    .where(inArray(eventAttendees.eventId, eventIds));

  const attendeesByEvent = new Map<string, EventAttendeeDto[]>();
  for (const row of attendeeRows) {
    const list = attendeesByEvent.get(row.eventId) ?? [];
    list.push({ id: row.userId, name: row.name, color: row.color });
    attendeesByEvent.set(row.eventId, list);
  }

  return eventRows.map((e) => ({
    id: e.id,
    title: e.title,
    location: e.location,
    description: e.description,
    allDay: e.allDay,
    startsAt: e.startsAt.toISOString(),
    endsAt: e.endsAt.toISOString(),
    createdBy: e.createdBy,
    attendees: attendeesByEvent.get(e.id) ?? [],
  }));
}

export async function fetchEventById(id: string): Promise<EventDto | null> {
  const [row] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!row) return null;
  const attendeeRows = await db
    .select({ id: users.id, name: users.name, color: users.color })
    .from(eventAttendees)
    .innerJoin(users, eq(users.id, eventAttendees.userId))
    .where(eq(eventAttendees.eventId, id));
  return {
    id: row.id,
    title: row.title,
    location: row.location,
    description: row.description,
    allDay: row.allDay,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    createdBy: row.createdBy,
    attendees: attendeeRows,
  };
}
