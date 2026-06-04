import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn, auth } from "@/auth";

function errorCode(e: unknown): string {
  if (e instanceof AuthError) {
    const cause = (e as AuthError & { cause?: { err?: { code?: string } } })
      .cause;
    return cause?.err?.code ?? e.type ?? "Unknown";
  }
  return "Unknown";
}

export const metadata = { title: "Sign in · HooNott Portal" };

type SearchParams = Promise<{ error?: string }>;

const ERROR_COPY: Record<string, string> = {
  "invalid-credentials": "Email or password is incorrect.",
  pending: "Your account is awaiting admin approval.",
  rejected: "Your account was not approved.",
  CredentialsSignin: "Email or password is incorrect.",
  Configuration: "Sign-in is misconfigured. Contact the admin.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (session?.user?.status === "approved") redirect("/");

  const { error } = await searchParams;
  const errorMessage = error ? ERROR_COPY[error] ?? "Sign-in failed." : null;

  async function signInWithGoogle() {
    "use server";
    try {
      await signIn("google", { redirectTo: "/" });
    } catch (e) {
      if (isNextRedirect(e)) throw e;
      redirect(`/login?error=${encodeURIComponent(errorCode(e))}`);
    }
  }

  async function signInWithCredentials(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    try {
      await signIn("credentials", {
        email,
        password,
        redirectTo: "/",
      });
    } catch (e) {
      if (isNextRedirect(e)) throw e;
      const code = errorCode(e);
      if (code === "pending") redirect("/pending");
      if (code === "rejected") redirect("/rejected");
      redirect(`/login?error=${encodeURIComponent(code)}`);
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
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="text-sm text-gray-600 mt-1">
          Welcome back to the family.
        </p>
      </div>

      {errorMessage && (
        <div className="rounded border border-red-300 bg-red-50 text-red-800 text-sm px-3 py-2">
          {errorMessage}
        </div>
      )}

      <form action={signInWithGoogle}>
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

      <Suspense>
        <form action={signInWithCredentials} className="space-y-3">
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
            <label className="block text-sm mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gray-900 text-white rounded px-4 py-2 text-sm font-medium hover:bg-gray-800"
          >
            Sign in
          </button>
        </form>
      </Suspense>

      <div className="flex justify-between text-sm">
        <Link href="/forgot-password" className="text-gray-600 hover:underline">
          Forgot password?
        </Link>
        <Link href="/signup" className="text-gray-600 hover:underline">
          Request access
        </Link>
      </div>
    </div>
  );
}
