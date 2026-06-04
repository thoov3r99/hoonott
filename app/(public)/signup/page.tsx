import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { AuthError } from "next-auth";

export const metadata = { title: "Request access · HooNott Portal" };

type SearchParams = Promise<{ error?: string; ok?: string }>;

const ERROR_COPY: Record<string, string> = {
  exists_active:
    "An account with this email already exists and is active. Try signing in.",
  exists_pending:
    "We already have a pending request for this email. Hang tight.",
  invalid: "Please double-check the form fields.",
  weak_password: "Password must be at least 8 characters.",
  server: "Something went wrong on our side. Try again in a moment.",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (session?.user?.status === "approved") redirect("/");

  const { error, ok } = await searchParams;
  const errorMessage = error ? ERROR_COPY[error] ?? "Signup failed." : null;

  async function signupWithGoogle() {
    "use server";
    try {
      await signIn("google", { redirectTo: "/" });
    } catch (e) {
      if (isNextRedirect(e)) throw e;
      const code = e instanceof AuthError ? e.type : "server";
      redirect(`/signup?error=${encodeURIComponent(code)}`);
    }
  }

  function isNextRedirect(e: unknown): boolean {
    return (
      typeof e === "object" &&
      e !== null &&
      "digest" in e &&
      typeof (e as { digest?: string }).digest === "string" &&
      (e as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    );
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Request access</h1>
        <p className="text-sm text-gray-600 mt-1">
          Submit your info. The admin will review and approve.
        </p>
      </div>

      {errorMessage && (
        <div className="rounded border border-red-300 bg-red-50 text-red-800 text-sm px-3 py-2">
          {errorMessage}
        </div>
      )}
      {ok && (
        <div className="rounded border border-green-300 bg-green-50 text-green-800 text-sm px-3 py-2">
          Request submitted. You&apos;ll be able to sign in once approved.
        </div>
      )}

      <form action={signupWithGoogle}>
        <button
          type="submit"
          className="w-full border border-gray-300 rounded px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Continue with Google
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs text-gray-500">
        <div className="h-px bg-gray-200 flex-1" />
        <span>or</span>
        <div className="h-px bg-gray-200 flex-1" />
      </div>

      <form action="/api/signup" method="POST" className="space-y-3">
        <div>
          <label className="block text-sm mb-1" htmlFor="name">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
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
            required
            autoComplete="tel"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">At least 8 characters.</p>
        </div>
        <button
          type="submit"
          className="w-full bg-gray-900 text-white rounded px-4 py-2 text-sm font-medium hover:bg-gray-800"
        >
          Submit request
        </button>
      </form>

      <div className="text-sm text-center text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
