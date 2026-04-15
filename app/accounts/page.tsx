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
              <th className="px-5 py-3">Wallet</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Worker</th>
              <th className="px-5 py-3">Portfolio</th>
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
                <td className="px-5 py-3 text-slate-600">{account.wallet_label || account.wallet_address || "none"}</td>
                <td className="px-5 py-3"><StatusBadge value={account.status} /></td>
                <td className="px-5 py-3">{account.assigned_worker?.email ?? "unassigned"}</td>
                <td className="px-5 py-3">
                  {account.portfolio_url ? (
                    <a href={account.portfolio_url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">
                      open
                    </a>
                  ) : "none"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
