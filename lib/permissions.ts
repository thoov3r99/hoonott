import type { Event, User } from "@/db/schema";

export function isAdmin(user: { role: User["role"] } | null | undefined): boolean {
  return user?.role === "admin";
}

export function isApproved(
  user: { status: User["status"] } | null | undefined
): boolean {
  return user?.status === "approved";
}

export function canEditEvent(
  event: Pick<Event, "createdBy">,
  user: { id: string; role: User["role"] } | null | undefined
): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  return event.createdBy === user.id;
}
