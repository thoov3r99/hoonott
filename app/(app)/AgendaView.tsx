"use client";

import { useState } from "react";
import type { EventDto } from "@/lib/events";
import { formatInNy } from "@/lib/tz";

type Props = {
  events: EventDto[];
  onSelectEvent: (event: EventDto) => void;
};

export default function AgendaView({ events, onSelectEvent }: Props) {
  const [now] = useState(() => Date.now());
  const upcoming = events.filter((e) => new Date(e.endsAt).getTime() >= now);
  const grouped = groupByDay(upcoming);

  if (grouped.length === 0) {
    return (
      <div className="rounded border bg-white p-6 text-center text-sm text-gray-500">
        No upcoming events.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {grouped.map(({ key, dateLabel, events }) => (
        <div key={key}>
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">
            {dateLabel}
          </div>
          <ul className="space-y-2">
            {events.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => onSelectEvent(e)}
                  className="w-full text-left rounded border bg-white px-3 py-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex -space-x-1">
                      {e.attendees.slice(0, 4).map((a) => (
                        <span
                          key={a.id}
                          title={a.name ?? "Unknown"}
                          className="inline-block w-3 h-3 rounded-full border border-white"
                          style={{ backgroundColor: a.color ?? "#9ca3af" }}
                        />
                      ))}
                      {e.attendees.length > 4 && (
                        <span className="ml-1 text-[10px] text-gray-700">
                          +{e.attendees.length - 4}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-medium truncate">{e.title}</div>
                  </div>
                  <div className="text-xs text-gray-600">
                    {e.allDay
                      ? "All day"
                      : `${formatInNy(new Date(e.startsAt), "h:mm a")} – ${formatInNy(new Date(e.endsAt), "h:mm a")}`}
                    {e.location ? ` · ${e.location}` : ""}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function groupByDay(events: EventDto[]): Array<{
  key: string;
  dateLabel: string;
  events: EventDto[];
}> {
  const map = new Map<string, EventDto[]>();
  for (const e of events) {
    const key = formatInNy(new Date(e.startsAt), "yyyy-MM-dd");
    const list = map.get(key) ?? [];
    list.push(e);
    map.set(key, list);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, events]) => ({
      key,
      dateLabel: formatInNy(new Date(events[0].startsAt), "EEEE, MMM d"),
      events,
    }));
}
