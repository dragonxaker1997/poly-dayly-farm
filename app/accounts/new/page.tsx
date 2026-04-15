import { createAccount } from "@/app/actions";
import { AppShell } from "@/components/AppShell";
import { requireProfile } from "@/lib/auth";

export default async function NewAccountPage() {
  const { supabase, profile } = await requireProfile("owner");
  const { data: workers } = await supabase.from("profiles").select("*").eq("role", "worker").order("email");

  return (
    <AppShell profile={profile}>
      <h1 className="mb-6 text-2xl font-semibold">New account</h1>
      <AccountForm action={createAccount} workers={workers ?? []} />
    </AppShell>
  );
}

function AccountForm({ action, workers }: { action: (formData: FormData) => void; workers: any[] }) {
  return (
    <form action={action} className="max-w-3xl space-y-5 rounded-lg border border-line bg-panel p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium">
          Name
          <input name="name" required className="focus-ring mt-1 rounded-md border border-line px-3 py-2" />
        </label>
        <label className="block text-sm font-medium">
          Wallet label
          <input name="wallet_label" className="focus-ring mt-1 rounded-md border border-line px-3 py-2" />
        </label>
      </div>
      <label className="block text-sm font-medium">
        Wallet address / identifier
        <input name="wallet_address" className="focus-ring mt-1 rounded-md border border-line px-3 py-2" />
      </label>
      <label className="block text-sm font-medium">
        Portfolio URL
        <input name="portfolio_url" type="url" className="focus-ring mt-1 rounded-md border border-line px-3 py-2" />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium">
          Status
          <select name="status" defaultValue="active" className="focus-ring mt-1 rounded-md border border-line px-3 py-2">
            <option value="active">active</option>
            <option value="resting">resting</option>
            <option value="archived">archived</option>
          </select>
        </label>
        <label className="block text-sm font-medium">
          Assigned worker
          <select name="assigned_worker_id" className="focus-ring mt-1 rounded-md border border-line px-3 py-2">
            <option value="">unassigned</option>
            {workers.map((worker) => (
              <option key={worker.id} value={worker.id}>{worker.email}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="block text-sm font-medium">
        Base comment
        <textarea name="base_comment" rows={4} className="focus-ring mt-1 rounded-md border border-line px-3 py-2" />
      </label>
      <button className="focus-ring rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white">Create account</button>
    </form>
  );
}
