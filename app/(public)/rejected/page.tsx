import Link from "next/link";

export const metadata = { title: "Not approved · HooNott Portal" };

export default function RejectedPage() {
  return (
    <div className="max-w-sm text-center space-y-4">
      <h1 className="text-2xl font-semibold">Your account was not approved</h1>
      <p className="text-sm text-gray-600">
        If you think this is a mistake, you can request access again or reach
        out to the admin directly.
      </p>
      <div className="flex justify-center gap-4 text-sm">
        <Link href="/signup" className="underline">
          Request access again
        </Link>
        <Link href="/login" className="underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
