import Link from "next/link";

export const metadata = { title: "Awaiting approval · HooNott Portal" };

export default function PendingPage() {
  return (
    <div className="max-w-sm text-center space-y-4">
      <h1 className="text-2xl font-semibold">Awaiting admin approval</h1>
      <p className="text-sm text-gray-600">
        Your request has been submitted. The admin will review it and you&apos;ll
        be able to sign in once approved.
      </p>
      <Link href="/login" className="text-sm underline">
        Back to sign in
      </Link>
    </div>
  );
}
