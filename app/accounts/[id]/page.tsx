import { notFound } from "next/navigation";
import { updateAccount } from "@/app/actions";
import { AppShell } from "@/components/AppShell";
import { CheckinActions } from "@/components/CheckinActions";
import { StatusBadge } from "@/components/StatusBadge";
import { requireProfile, todayISO } from "@/lib/auth";

export default async function AccountDetailsPage({ params }: { params: { id: string } }) {
  const { supabase, profile } = await requireProfile();
  const date = todayISO();

  const [
    { data: accountData },
    { data: workersData },
    { data: todayCheckinData },
    { data: historyData },
    { data: rotationData }
  ] = await Promise.all([
    supabase.from("accounts").select("*, assigned_worker:profiles(id,email,role)").eq("id", params.id).single(),
    supabase.from("profiles").select("*").eq("role", "worker").order("email"),
    supabase.from("daily_checkins").select("*").eq("date", date).eq("account_id", params.id).maybeSingle(),
    supabase
      .from("daily_checkins")
      .select("*, completed_by_profile:profiles(id,email,role)")
      .eq("account_id", params.id)
      .order("date", { ascending: false })
      .limit(30),
    supabase.from("daily_rotations").select("*").eq("date", date).eq("account_id", params.id).maybeSingle()
  ]);

  if (!accountData) notFound();

  const account = accountData as any;
  const workers = (workersData ?? []) as any[];
  const todayCheckin = todayCheckinData as any;
  const history = (historyData ?? []) as any[];
  const rotation = rotationData as any;

  return (
    <AppShell profile={profile}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{account.name}</h1>
            <StatusBadge value={rotation?.is_active ? "active" : "resting"} />
            <StatusBadge value={todayCheckin?.status ?? "planned"} />
          </div>
          <p className="mt-1 text-sm text-slate-600">{account.wallet_label || account.wallet_address || "No wallet identifier"}</p>
        </div>
        {account.portfolio_url ? (
          <a href={account.portfolio_url} target="_blank" rel="noreferrer" className="rounded-md bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white">
            Open portfolio
          </a>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <section className="space-y-6">
          <div className="rounded-lg border border-line bg-panel p-5 shadow-sm">
            <h2 className="mb-4 font-semibold">Account info</h2>
            {profile.role === "owner" ? (
              <form action={updateAccount} className="space-y-4">
                <input type="hidden" name="id" value={account.id} />
                <div className="grid gap-4 md:grid-cols-2">
                  <Field name="name" label="Name" defaultValue={account.name} required />
                  <Field name="wallet_label" label="Wallet label" defaultValue={account.wallet_label ?? ""} />
                </div>
                <Field name="wallet_address" label="Wallet address / identifier" defaultValue={account.wallet_address ?? ""} />
                <Field name="portfolio_url" label="Portfolio URL" defaultValue={account.portfolio_url ?? ""} />
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm font-medium">
                    Status
                    <select name="status" defaultValue={account.status} className="focus-ring mt-1 rounded-md border border-line px-3 py-2">
                      <option value="active">active</option>
                      <option value="resting">resting</option>
                      <option value="archived">archived</option>
                    </select>
                  </label>
                  <label className="block text-sm font-medium">
                    Assigned worker
                    <select name="assigned_worker_id" defaultValue={account.assigned_worker_id ?? ""} className="focus-ring mt-1 rounded-md border border-line px-3 py-2">
                      <option value="">unassigned</option>
                      {workers.map((worker) => (
                        <option key={worker.id} value={worker.id}>{worker.email}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="block text-sm font-medium">
                  Base comment
                  <textarea name="base_comment" rows={4} defaultValue={account.base_comment ?? ""} className="focus-ring mt-1 rounded-md border border-line px-3 py-2" />
                </label>
                <button className="focus-ring rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white">Save account</button>
              </form>
            ) : (
              <div className="space-y-3 text-sm">
                <p><span className="font-semibold">Assigned worker:</span> {(account as any).assigned_worker?.email ?? "unassigned"}</p>
                <p><span className="font-semibold">Base comment:</span> {account.base_comment || "none"}</p>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-line bg-panel shadow-sm">
            <div className="border-b border-line px-5 py-4">
              <h2 className="font-semibold">Check-in history</h2>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">By</th>
                  <th className="px-5 py-3">Comment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {history.map((row: any) => (
                  <tr key={row.id}>
                    <td className="px-5 py-3">{row.date}</td>
                    <td className="px-5 py-3"><StatusBadge value={row.status} /></td>
                    <td className="px-5 py-3">{row.completed_by_profile?.email ?? "none"}</td>
                    <td className="px-5 py-3 text-slate-600">{row.comment ?? row.extra_notes ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="rounded-lg border border-line bg-panel p-5 shadow-sm">
          <h2 className="mb-4 font-semibold">Today check-in</h2>
          <CheckinActions
            accountId={account.id}
            date={date}
            comment={todayCheckin?.comment}
            extraNotes={todayCheckin?.extra_notes}
            tradesCountManual={todayCheckin?.trades_count_manual}
          />
        </aside>
      </div>
    </AppShell>
  );
}

function Field({
  name,
  label,
  defaultValue,
  required = false
}: {
  name: string;
  label: string;
  defaultValue: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input name={name} defaultValue={defaultValue} required={required} className="focus-ring mt-1 rounded-md border border-line px-3 py-2" />
    </label>
  );
}
