export const metadata = { title: "Reset password · HooNott Portal" };

type SearchParams = Promise<{
  token?: string;
  email?: string;
  ok?: string;
  error?: string;
}>;

const ERROR_COPY: Record<string, string> = {
  invalid_token: "This reset link is invalid or has expired. Request a new one.",
  weak_password: "Password must be at least 8 characters.",
  server: "Something went wrong. Try again.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { token, email, ok, error } = await searchParams;

  if (ok) {
    return (
      <div className="max-w-sm text-center space-y-4">
        <h1 className="text-2xl font-semibold">Password reset</h1>
        <p className="text-sm text-gray-600">
          You can now sign in with your new password.
        </p>
        <a href="/login" className="text-sm underline">
          Go to sign in
        </a>
      </div>
    );
  }

  if (!token || !email) {
    return (
      <div className="max-w-sm text-center space-y-4">
        <h1 className="text-2xl font-semibold">Invalid reset link</h1>
        <p className="text-sm text-gray-600">
          This link is missing parameters. Request a new reset email.
        </p>
        <a href="/forgot-password" className="text-sm underline">
          Forgot password
        </a>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Set a new password</h1>
      </div>
      {error && (
        <div className="rounded border border-red-300 bg-red-50 text-red-800 text-sm px-3 py-2">
          {ERROR_COPY[error] ?? "Something went wrong."}
        </div>
      )}
      <form
        action="/api/password-reset/confirm"
        method="POST"
        className="space-y-3"
      >
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="email" value={email} />
        <div>
          <label className="block text-sm mb-1" htmlFor="password">
            New password
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
        </div>
        <button
          type="submit"
          className="w-full bg-gray-900 text-white rounded px-4 py-2 text-sm font-medium hover:bg-gray-800"
        >
          Reset password
        </button>
      </form>
    </div>
  );
}
