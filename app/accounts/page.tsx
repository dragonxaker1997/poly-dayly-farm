import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { requireProfile } from "@/lib/auth";

export default async function AccountsPage() {
  const { supabase, profile } = await requireProfile();
  const { data: accounts } = await supabase
    .from("accounts")
    .select("*, assigned_worker:profiles(id,email,role)")
    .order("name");

  return (
    <AppShell profile={profile}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Accounts</h1>
          <p className="text-sm text-slate-600">
            {profile.role === "owner" ? "Все аккаунты фермы" : "Только назначенные аккаунты"}
          </p>
        </div>
        {profile.role === "owner" ? (
          <Link href="/accounts/new" className="rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white">
            New account
          </Link>
        ) : null}
      </div>

      <section className="overflow-hidden rounded-lg border border-line bg-panel shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Days</th>
              <th className="px-5 py-3">Trades</th>
              <th className="px-5 py-3">Worker</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(accounts ?? []).map((account: any) => (
              <tr key={account.id}>
                <td className="px-5 py-3">
                  <Link href={`/accounts/${account.id}`} className="font-semibold hover:underline">
                    {account.name}
                  </Link>
                </td>
                <td className="px-5 py-3 font-semibold">{account.total_trading_days ?? 0}</td>
                <td className="px-5 py-3 font-semibold">{account.total_trades_count ?? 0}</td>
                <td className="px-5 py-3">{account.assigned_worker?.email ?? "unassigned"}</td>
                <td className="px-5 py-3"><StatusBadge value={account.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
