import { fromZonedTime, toZonedTime, format as formatTz } from "date-fns-tz";

export const APP_TIMEZONE = "America/New_York";

/** Convert a wall-clock NY datetime string ("2026-06-04T15:00") to a UTC Date. */
export function nyWallClockToUtc(wallClock: string): Date {
  return fromZonedTime(wallClock, APP_TIMEZONE);
}

/** Render a UTC Date as a NY wall-clock formatted string. */
export function formatInNy(date: Date, pattern: string): string {
  return formatTz(toZonedTime(date, APP_TIMEZONE), pattern, {
    timeZone: APP_TIMEZONE,
  });
}

/** Midnight in NY on the given YYYY-MM-DD date string, returned as UTC Date. */
export function nyMidnight(dateStr: string): Date {
  return nyWallClockToUtc(`${dateStr}T00:00:00`);
}

/** Add days to a UTC date (calendar-aware in NY tz). */
export function nyAddDays(date: Date, days: number): Date {
  const ny = toZonedTime(date, APP_TIMEZONE);
  ny.setDate(ny.getDate() + days);
  return fromZonedTime(ny, APP_TIMEZONE);
}
