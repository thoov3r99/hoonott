import Link from "next/link";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-1">
      <header className="border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-semibold text-lg">
            HooNott Portal
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/login" className="hover:underline">
              Sign in
            </Link>
            <Link href="/signup" className="hover:underline">
              Request access
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 flex items-start justify-center px-4 py-12">
        {children}
      </main>
    </div>
  );
}
