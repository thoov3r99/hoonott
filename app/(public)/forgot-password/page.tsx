export const metadata = { title: "Forgot password · HooNott Portal" };

type SearchParams = Promise<{ ok?: string; error?: string }>;

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { ok, error } = await searchParams;
  return (
    <div className="w-full max-w-sm space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Forgot password</h1>
        <p className="text-sm text-gray-600 mt-1">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      {ok && (
        <div className="rounded border border-green-300 bg-green-50 text-green-800 text-sm px-3 py-2">
          If an account exists for that email, a reset link has been sent.
        </div>
      )}
      {error && (
        <div className="rounded border border-red-300 bg-red-50 text-red-800 text-sm px-3 py-2">
          Something went wrong. Try again.
        </div>
      )}

      <form
        action="/api/password-reset/request"
        method="POST"
        className="space-y-3"
      >
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
        <button
          type="submit"
          className="w-full bg-gray-900 text-white rounded px-4 py-2 text-sm font-medium hover:bg-gray-800"
        >
          Send reset link
        </button>
      </form>
    </div>
  );
}
