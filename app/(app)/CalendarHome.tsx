"use client";

import { useCallback, useMemo, useState } from "react";
import type { EventDto } from "@/lib/events";
import CalendarView from "./CalendarView";
import AgendaView from "./AgendaView";
import EventModal, { type EventDraft } from "./EventModal";

export type AppUser = {
  id: string;
  name: string | null;
  email: string;
  color: string | null;
};

export type CurrentUser = AppUser & { role: "user" | "admin" };

type Props = {
  initialEvents: EventDto[];
  users: AppUser[];
  currentUser: CurrentUser;
};

export default function CalendarHome({
  initialEvents,
  users,
  currentUser,
}: Props) {
  const [events, setEvents] = useState<EventDto[]>(initialEvents);
  const [modalState, setModalState] = useState<
    | { mode: "closed" }
    | { mode: "create"; defaults: Partial<EventDraft> }
    | { mode: "edit"; event: EventDto }
  >({ mode: "closed" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCreate = useCallback(
    (defaults: Partial<EventDraft> = {}) => {
      setError(null);
      setModalState({
        mode: "create",
        defaults: {
          attendeeIds: [currentUser.id],
          allDay: false,
          ...defaults,
        },
      });
    },
    [currentUser.id]
  );

  const openEdit = useCallback((event: EventDto) => {
    setError(null);
    setModalState({ mode: "edit", event });
  }, []);

  const closeModal = useCallback(() => {
    setModalState({ mode: "closed" });
    setError(null);
  }, []);

  const saveDraft = useCallback(
    async (draft: EventDraft) => {
      setSaving(true);
      setError(null);
      try {
        const isEdit = modalState.mode === "edit";
        const url = isEdit
          ? `/api/events/${(modalState as { event: EventDto }).event.id}`
          : "/api/events";
        const method = isEdit ? "PATCH" : "POST";
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error ?? "save failed");
        }
        const json = (await res.json()) as { event: EventDto };
        setEvents((prev) => {
          if (isEdit) {
            return prev.map((e) => (e.id === json.event.id ? json.event : e));
          }
          return [...prev, json.event];
        });
        closeModal();
      } catch (e) {
        setError(e instanceof Error ? e.message : "save failed");
      } finally {
        setSaving(false);
      }
    },
    [closeModal, modalState]
  );

  const deleteEvent = useCallback(
    async (eventId: string) => {
      if (!confirm("Delete this event?")) return;
      setSaving(true);
      setError(null);
      try {
        const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error ?? "delete failed");
        }
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
        closeModal();
      } catch (e) {
        setError(e instanceof Error ? e.message : "delete failed");
      } finally {
        setSaving(false);
      }
    },
    [closeModal]
  );

  const sortedEvents = useMemo(
    () =>
      [...events].sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
      ),
    [events]
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl md:text-2xl font-semibold">Calendar</h1>
        <button
          type="button"
          onClick={() => openCreate()}
          className="bg-gray-900 text-white text-sm rounded px-3 py-2 hover:bg-gray-800"
        >
          + New event
        </button>
      </div>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 text-red-800 text-sm px-3 py-2">
          {error}
        </div>
      )}

      <div className="hidden md:block">
        <CalendarView
          events={sortedEvents}
          onSelectDate={(dateStr, allDay) => {
            openCreate({
              startsAt: dateStr,
              endsAt: dateStr,
              allDay,
            });
          }}
          onSelectEvent={(id) => {
            const ev = sortedEvents.find((e) => e.id === id);
            if (ev) openEdit(ev);
          }}
        />
      </div>

      <div className="md:hidden">
        <AgendaView events={sortedEvents} onSelectEvent={openEdit} />
      </div>

      {modalState.mode !== "closed" && (
        <EventModal
          users={users}
          currentUser={currentUser}
          initial={
            modalState.mode === "edit"
              ? eventToDraft(modalState.event)
              : modalState.defaults
          }
          mode={modalState.mode}
          eventCreatedBy={
            modalState.mode === "edit" ? modalState.event.createdBy : null
          }
          saving={saving}
          onCancel={closeModal}
          onSave={saveDraft}
          onDelete={
            modalState.mode === "edit"
              ? () => deleteEvent(modalState.event.id)
              : undefined
          }
        />
      )}
    </div>
  );
}

function eventToDraft(e: EventDto): EventDraft {
  return {
    title: e.title,
    location: e.location ?? "",
    description: e.description ?? "",
    allDay: e.allDay,
    startsAt: e.startsAt,
    endsAt: e.endsAt,
    attendeeIds: e.attendees.map((a) => a.id),
  };
}
