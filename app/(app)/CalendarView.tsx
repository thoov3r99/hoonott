"use client";

import { useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventDto } from "@/lib/events";
import { APP_TIMEZONE } from "@/lib/tz";

type Props = {
  events: EventDto[];
  onSelectDate: (isoString: string, allDay: boolean) => void;
  onSelectEvent: (id: string) => void;
};

export default function CalendarView({
  events,
  onSelectDate,
  onSelectEvent,
}: Props) {
  const calendarRef = useRef<FullCalendar | null>(null);

  const fcEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.startsAt,
    end: e.endsAt,
    allDay: e.allDay,
    extendedProps: { dto: e },
  }));

  return (
    <div className="bg-white border rounded p-3 [&_.fc-event]:cursor-pointer">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek",
        }}
        height="auto"
        timeZone={APP_TIMEZONE}
        events={fcEvents}
        eventDisplay="block"
        selectable
        select={(info) => {
          onSelectDate(info.startStr, info.allDay);
        }}
        dateClick={(info) => {
          onSelectDate(info.dateStr, info.allDay);
        }}
        eventClick={(info) => {
          info.jsEvent.preventDefault();
          onSelectEvent(info.event.id);
        }}
        eventContent={(arg) => {
          const dto = arg.event.extendedProps.dto as EventDto;
          return (
            <div className="flex items-center gap-1 px-1 py-0.5 overflow-hidden">
              <AttendeeChips attendees={dto.attendees} />
              <span className="text-xs truncate text-gray-900">
                {arg.event.title}
              </span>
            </div>
          );
        }}
        nowIndicator
        firstDay={0}
      />
    </div>
  );
}

function AttendeeChips({
  attendees,
}: {
  attendees: EventDto["attendees"];
}) {
  const visible = attendees.slice(0, 4);
  const overflow = attendees.length - visible.length;
  return (
    <div className="flex items-center -space-x-1 shrink-0">
      {visible.map((a) => (
        <span
          key={a.id}
          title={a.name ?? "Unknown"}
          className="inline-block w-3 h-3 rounded-full border border-white"
          style={{ backgroundColor: a.color ?? "#9ca3af" }}
        />
      ))}
      {overflow > 0 && (
        <span className="ml-1 text-[10px] text-gray-700">+{overflow}</span>
      )}
    </div>
  );
}
