import { signIn } from "@/app/login/actions";

export default function LoginPage({
  searchParams
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-wash px-6">
      <section className="w-full max-w-md rounded-lg border border-line bg-panel p-8 shadow-sm">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">MVP</p>
          <h1 className="mt-2 text-2xl font-semibold">Polymarket Farm Manager</h1>
          <p className="mt-2 text-sm text-slate-600">Ручная ротация аккаунтов и daily check-in.</p>
        </div>

        {searchParams.error ? (
          <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {searchParams.error === "missing-profile"
              ? "Для пользователя не найден profile. Проверь seed или profiles table."
              : searchParams.error}
          </div>
        ) : null}

        <form action={signIn} className="space-y-4">
          <label className="block text-sm font-medium">
            Email
            <input
              className="focus-ring mt-1 rounded-md border border-line px-3 py-2"
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input
              className="focus-ring mt-1 rounded-md border border-line px-3 py-2"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </label>
          <button className="focus-ring w-full rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white">
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
