import { LoginForm } from "@/app/login/LoginForm";

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

        <LoginForm initialError={searchParams.error} />
      </section>
    </main>
  );
}
