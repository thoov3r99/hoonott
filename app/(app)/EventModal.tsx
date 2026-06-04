"use client";

import { useEffect, useMemo, useState } from "react";
import type { AppUser, CurrentUser } from "./CalendarHome";
import { formatInNy, nyWallClockToUtc } from "@/lib/tz";

export type EventDraft = {
  title: string;
  location: string;
  description: string;
  allDay: boolean;
  startsAt: string; // ISO UTC OR date-only "YYYY-MM-DD" if all-day
  endsAt: string;
  attendeeIds: string[];
};

type Props = {
  mode: "create" | "edit";
  users: AppUser[];
  currentUser: CurrentUser;
  initial: Partial<EventDraft>;
  eventCreatedBy: string | null;
  saving: boolean;
  onCancel: () => void;
  onSave: (draft: EventDraft) => void;
  onDelete?: () => void;
};

export default function EventModal({
  mode,
  users,
  currentUser,
  initial,
  eventCreatedBy,
  saving,
  onCancel,
  onSave,
  onDelete,
}: Props) {
  const canEdit =
    mode === "create" ||
    currentUser.role === "admin" ||
    eventCreatedBy === currentUser.id;

  const [allDay, setAllDay] = useState<boolean>(initial.allDay ?? false);
  const [title, setTitle] = useState<string>(initial.title ?? "");
  const [location, setLocation] = useState<string>(initial.location ?? "");
  const [description, setDescription] = useState<string>(
    initial.description ?? ""
  );
  const [attendeeIds, setAttendeeIds] = useState<string[]>(
    initial.attendeeIds ?? [currentUser.id]
  );

  const initialRange = useMemo(
    () => makeInitialDateInputs(initial),
    [initial]
  );

  const [startDate, setStartDate] = useState<string>(initialRange.startDate);
  const [startTime, setStartTime] = useState<string>(initialRange.startTime);
  const [endDate, setEndDate] = useState<string>(initialRange.endDate);
  const [endTime, setEndTime] = useState<string>(initialRange.endTime);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  function toggleAttendee(id: string) {
    setAttendeeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit) return;
    if (!title.trim()) return;
    if (attendeeIds.length === 0) return;

    let startsAt: string;
    let endsAt: string;
    if (allDay) {
      startsAt = nyWallClockToUtc(`${startDate}T00:00:00`).toISOString();
      endsAt = nyWallClockToUtc(`${endDate}T23:59:59`).toISOString();
    } else {
      startsAt = nyWallClockToUtc(`${startDate}T${startTime}:00`).toISOString();
      endsAt = nyWallClockToUtc(`${endDate}T${endTime}:00`).toISOString();
    }

    onSave({
      title: title.trim(),
      location: location.trim(),
      description: description.trim(),
      allDay,
      startsAt,
      endsAt,
      attendeeIds,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-6"
      role="dialog"
      aria-modal
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-t-lg md:rounded-lg w-full max-w-lg max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {mode === "create" ? "New event" : "Edit event"}
            </h2>
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Close
            </button>
          </div>

          {!canEdit && (
            <div className="rounded border border-yellow-300 bg-yellow-50 text-yellow-800 text-xs px-3 py-2">
              You can&apos;t edit this event because it was created by someone
              else.
            </div>
          )}

          <div>
            <label className="block text-sm mb-1">Title</label>
            <input
              type="text"
              required
              disabled={!canEdit}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm disabled:bg-gray-50"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="all-day"
              type="checkbox"
              disabled={!canEdit}
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
            />
            <label htmlFor="all-day" className="text-sm">
              All day
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">
                {allDay ? "Start date" : "Starts"}
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  required
                  disabled={!canEdit}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1.5 text-sm flex-1 disabled:bg-gray-50"
                />
                {!allDay && (
                  <input
                    type="time"
                    required
                    disabled={!canEdit}
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1.5 text-sm w-28 disabled:bg-gray-50"
                  />
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1">
                {allDay ? "End date" : "Ends"}
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  required
                  disabled={!canEdit}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1.5 text-sm flex-1 disabled:bg-gray-50"
                />
                {!allDay && (
                  <input
                    type="time"
                    required
                    disabled={!canEdit}
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1.5 text-sm w-28 disabled:bg-gray-50"
                  />
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Location</label>
            <input
              type="text"
              disabled={!canEdit}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm disabled:bg-gray-50"
              placeholder="Where will you be?"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Notes</label>
            <textarea
              disabled={!canEdit}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm disabled:bg-gray-50"
            />
          </div>

          <div>
            <div className="text-sm mb-2">Who&apos;s there?</div>
            <div className="flex flex-wrap gap-2">
              {users.map((u) => {
                const selected = attendeeIds.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => toggleAttendee(u.id)}
                    className={`flex items-center gap-1.5 text-xs rounded-full border px-2.5 py-1 ${
                      selected
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-300 bg-white text-gray-700"
                    } disabled:opacity-60`}
                  >
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full border border-white/70"
                      style={{ backgroundColor: u.color ?? "#9ca3af" }}
                    />
                    {u.name ?? u.email}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              {onDelete && canEdit && (
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={saving}
                  className="text-sm text-red-600 hover:underline disabled:opacity-50"
                >
                  Delete
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="border border-gray-300 text-sm rounded px-3 py-1.5 hover:bg-gray-50"
              >
                Cancel
              </button>
              {canEdit && (
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-gray-900 text-white text-sm rounded px-3 py-1.5 hover:bg-gray-800 disabled:opacity-50"
                >
                  {saving ? "Saving…" : mode === "create" ? "Create" : "Save"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function makeInitialDateInputs(
  initial: Partial<EventDraft>
): { startDate: string; startTime: string; endDate: string; endTime: string } {
  const allDay = initial.allDay ?? false;
  const startInput = initial.startsAt
    ? parseInitial(initial.startsAt, allDay)
    : nowDefaults();
  const endInput = initial.endsAt
    ? parseInitial(initial.endsAt, allDay)
    : addHour(startInput);
  return {
    startDate: startInput.date,
    startTime: startInput.time,
    endDate: endInput.date,
    endTime: endInput.time,
  };
}

function nowDefaults() {
  const now = new Date();
  const date = formatInNy(now, "yyyy-MM-dd");
  const time = formatInNy(now, "HH:mm");
  return { date, time };
}

function addHour(d: { date: string; time: string }) {
  const utc = nyWallClockToUtc(`${d.date}T${d.time}:00`);
  const plus = new Date(utc.getTime() + 60 * 60 * 1000);
  return {
    date: formatInNy(plus, "yyyy-MM-dd"),
    time: formatInNy(plus, "HH:mm"),
  };
}

function parseInitial(s: string, allDay: boolean) {
  // s may be ISO with timezone, or a date-only string from FullCalendar click
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return { date: s, time: allDay ? "00:00" : "09:00" };
  }
  const d = new Date(s);
  return {
    date: formatInNy(d, "yyyy-MM-dd"),
    time: formatInNy(d, "HH:mm"),
  };
}
