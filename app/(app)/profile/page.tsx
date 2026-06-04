import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and, ne } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { PALETTE, isPaletteColor } from "@/lib/palette";

export const metadata = { title: "Profile · HooNott Portal" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ ok?: string; error?: string }>;

const profileSchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(0).max(40),
  color: z.string().trim().min(1),
});

const ERROR_COPY: Record<string, string> = {
  invalid: "Please double-check the form.",
  taken: "That color is already taken.",
  bad_color: "That color isn't on the palette.",
  server: "Something went wrong. Try again.",
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [me] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!me) redirect("/login");

  const otherColors = await db
    .select({ color: users.color })
    .from(users)
    .where(
      and(eq(users.status, "approved"), ne(users.id, me.id))
    );
  const taken = new Set(
    otherColors
      .map((r) => r.color)
      .filter((c): c is string => typeof c === "string")
  );

  const { ok, error } = await searchParams;

  async function saveProfile(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user) return;
    const parsed = profileSchema.safeParse({
      name: formData.get("name"),
      phone: formData.get("phone"),
      color: formData.get("color"),
    });
    if (!parsed.success) {
      redirect("/profile?error=invalid");
    }
    const { name, phone, color } = parsed.data;
    if (!isPaletteColor(color)) {
      redirect("/profile?error=bad_color");
    }
    const conflicts = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.color, color),
          ne(users.id, session.user.id),
          eq(users.status, "approved")
        )
      );
    if (conflicts.length > 0) {
      redirect("/profile?error=taken");
    }
    await db
      .update(users)
      .set({ name, phone, color })
      .where(eq(users.id, session.user.id));
    revalidatePath("/profile");
    revalidatePath("/");
    redirect("/profile?ok=1");
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-sm text-gray-600 mt-1">
          Update your name, phone, and color.
        </p>
      </div>

      {ok && (
        <div className="rounded border border-green-300 bg-green-50 text-green-800 text-sm px-3 py-2">
          Saved.
        </div>
      )}
      {error && (
        <div className="rounded border border-red-300 bg-red-50 text-red-800 text-sm px-3 py-2">
          {ERROR_COPY[error] ?? "Something went wrong."}
        </div>
      )}

      <form action={saveProfile} className="space-y-4">
        <div>
          <label className="block text-sm mb-1" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            value={me.email}
            disabled
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 text-gray-500"
          />
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="name">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={me.name ?? ""}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="phone">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={me.phone ?? ""}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <div className="text-sm mb-2">Calendar color</div>
          <div className="grid grid-cols-6 gap-2">
            {PALETTE.map((color) => {
              const isTaken = taken.has(color);
              const isMine = me.color === color;
              return (
                <label
                  key={color}
                  className={`relative flex items-center justify-center aspect-square rounded border ${
                    isTaken && !isMine
                      ? "opacity-30 cursor-not-allowed"
                      : "cursor-pointer hover:ring-2 hover:ring-gray-300"
                  }`}
                  title={isTaken && !isMine ? "Taken" : color}
                >
                  <input
                    type="radio"
                    name="color"
                    value={color}
                    defaultChecked={isMine}
                    disabled={isTaken && !isMine}
                    className="peer sr-only"
                    required
                  />
                  <span
                    className="block w-full h-full rounded peer-checked:ring-2 peer-checked:ring-gray-900 peer-checked:ring-offset-2"
                    style={{ backgroundColor: color }}
                  />
                </label>
              );
            })}
          </div>
        </div>
        <button
          type="submit"
          className="bg-gray-900 text-white text-sm rounded px-4 py-2 hover:bg-gray-800"
        >
          Save
        </button>
      </form>
    </div>
  );
}
