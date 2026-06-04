import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const status = session.user.status;
  if (status === "pending") redirect("/pending");
  if (status === "rejected") redirect("/rejected");

  const isAdmin = session.user.role === "admin";

  async function doSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="flex flex-col flex-1">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-semibold">
              HooNott Portal
            </Link>
            <nav className="flex gap-4 text-sm text-gray-700">
              <Link href="/" className="hover:underline">
                Calendar
              </Link>
              <Link href="/profile" className="hover:underline">
                Profile
              </Link>
              {isAdmin && (
                <Link href="/admin" className="hover:underline">
                  Admin
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              {session.user.color && (
                <span
                  className="inline-block w-3 h-3 rounded-full border border-gray-300"
                  style={{ backgroundColor: session.user.color }}
                  aria-hidden
                />
              )}
              <span className="text-gray-700 max-w-[16ch] truncate">
                {session.user.name ?? session.user.email}
              </span>
            </div>
            <form action={doSignOut}>
              <button
                type="submit"
                className="text-gray-600 hover:underline"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
