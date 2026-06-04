import { redirect } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ADMIN_EMAIL } from "@/lib/env";
import { nextFreeColor } from "@/lib/palette";

export const metadata = { title: "Admin · HooNott Portal" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/");

  const allUsers = await db
    .select()
    .from(users)
    .orderBy(asc(users.createdAt));

  const pending = allUsers.filter((u) => u.status === "pending");
  const approved = allUsers.filter((u) => u.status === "approved");
  const rejected = allUsers.filter((u) => u.status === "rejected");

  async function approveUser(formData: FormData) {
    "use server";
    const session = await auth();
    if (session?.user?.role !== "admin") return;
    const id = String(formData.get("id") ?? "");
    if (!id) return;

    const allColors = await db.select({ color: users.color }).from(users);
    const newColor = nextFreeColor(allColors.map((u) => u.color));

    await db
      .update(users)
      .set({
        status: "approved",
        color: newColor,
        approvedAt: new Date(),
        approvedBy: session.user.id,
      })
      .where(eq(users.id, id));
    revalidatePath("/admin");
  }

  async function rejectUser(formData: FormData) {
    "use server";
    const session = await auth();
    if (session?.user?.role !== "admin") return;
    const id = String(formData.get("id") ?? "");
    if (!id) return;

    const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!row || row.email.toLowerCase() === ADMIN_EMAIL) return;

    await db
      .update(users)
      .set({ status: "rejected", color: null })
      .where(eq(users.id, id));
    revalidatePath("/admin");
  }

  async function removeUser(formData: FormData) {
    "use server";
    const session = await auth();
    if (session?.user?.role !== "admin") return;
    const id = String(formData.get("id") ?? "");
    if (!id) return;

    const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!row || row.email.toLowerCase() === ADMIN_EMAIL) return;

    await db.delete(users).where(eq(users.id, id));
    revalidatePath("/admin");
  }

  async function demoteUser(formData: FormData) {
    "use server";
    const session = await auth();
    if (session?.user?.role !== "admin") return;
    const id = String(formData.get("id") ?? "");
    if (!id) return;

    const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!row || row.email.toLowerCase() === ADMIN_EMAIL) return;

    await db.update(users).set({ role: "user" }).where(eq(users.id, id));
    revalidatePath("/admin");
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      <div>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-sm text-gray-600 mt-1">
          Approve new signups, manage existing users.
        </p>
      </div>

      <section>
        <h2 className="text-lg font-medium mb-3">
          Pending requests ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-gray-500">No pending requests.</p>
        ) : (
          <ul className="divide-y border rounded">
            {pending.map((u) => (
              <li key={u.id} className="px-4 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{u.name ?? "(no name)"}</div>
                  <div className="text-sm text-gray-600">{u.email}</div>
                  {u.phone && (
                    <div className="text-sm text-gray-500">{u.phone}</div>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    Requested {u.createdAt.toISOString()}
                  </div>
                </div>
                <form action={approveUser}>
                  <input type="hidden" name="id" value={u.id} />
                  <button
                    type="submit"
                    className="bg-green-600 text-white text-sm rounded px-3 py-1.5 hover:bg-green-700"
                  >
                    Approve
                  </button>
                </form>
                <form action={rejectUser}>
                  <input type="hidden" name="id" value={u.id} />
                  <button
                    type="submit"
                    className="border border-gray-300 text-sm rounded px-3 py-1.5 hover:bg-gray-50"
                  >
                    Reject
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">
          Approved users ({approved.length})
        </h2>
        <ul className="divide-y border rounded">
          {approved.map((u) => {
            const isHardcodedAdmin = u.email.toLowerCase() === ADMIN_EMAIL;
            return (
              <li key={u.id} className="px-4 py-3 flex items-center gap-4">
                <span
                  className="inline-block w-4 h-4 rounded-full border border-gray-300 shrink-0"
                  style={{ backgroundColor: u.color ?? "#ccc" }}
                  aria-hidden
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium flex items-center gap-2">
                    {u.name ?? "(no name)"}
                    {u.role === "admin" && (
                      <span className="text-xs bg-gray-900 text-white rounded px-1.5 py-0.5">
                        admin
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 truncate">
                    {u.email}
                  </div>
                </div>
                {!isHardcodedAdmin && u.role === "admin" && (
                  <form action={demoteUser}>
                    <input type="hidden" name="id" value={u.id} />
                    <button
                      type="submit"
                      className="border border-gray-300 text-sm rounded px-3 py-1.5 hover:bg-gray-50"
                    >
                      Demote
                    </button>
                  </form>
                )}
                {!isHardcodedAdmin && (
                  <form action={removeUser}>
                    <input type="hidden" name="id" value={u.id} />
                    <button
                      type="submit"
                      className="text-red-600 text-sm rounded px-3 py-1.5 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {rejected.length > 0 && (
        <section>
          <h2 className="text-lg font-medium mb-3">
            Rejected ({rejected.length})
          </h2>
          <ul className="divide-y border rounded">
            {rejected.map((u) => (
              <li key={u.id} className="px-4 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{u.name ?? "(no name)"}</div>
                  <div className="text-sm text-gray-600">{u.email}</div>
                </div>
                <form action={approveUser}>
                  <input type="hidden" name="id" value={u.id} />
                  <button
                    type="submit"
                    className="border border-gray-300 text-sm rounded px-3 py-1.5 hover:bg-gray-50"
                  >
                    Reconsider (approve)
                  </button>
                </form>
                <form action={removeUser}>
                  <input type="hidden" name="id" value={u.id} />
                  <button
                    type="submit"
                    className="text-red-600 text-sm rounded px-3 py-1.5 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

