import Link from "next/link";
import { generateTodayRotation } from "@/app/actions";
import { AppShell } from "@/components/AppShell";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { TradesRotationTable, type TradesRotationRow } from "@/components/TradesRotationTable";
import { requireProfile, todayISO } from "@/lib/auth";

export default async function OwnerDashboardPage() {
  const { supabase, profile } = await requireProfile("owner");
  const date = todayISO();

  const [{ data: accounts }, { data: rotations }, { data: checkins }] = await Promise.all([
    supabase.from("accounts").select("*, assigned_worker:profiles(id,email,role)").order("name"),
    supabase
      .from("daily_rotations")
      .select("*, account:accounts(*)")
      .eq("date", date)
      .order("is_active", { ascending: false }),
    supabase.from("daily_checkins").select("*").eq("date", date)
  ]);

  const activeRotations = (rotations ?? []).filter((rotation) => rotation.is_active);
  const restingRotations = (rotations ?? []).filter((rotation) => !rotation.is_active);
  const doneToday = (checkins ?? []).filter((checkin) => checkin.status === "done").length;
  const pendingToday = activeRotations.length - doneToday;
  const checkinByAccount = new Map((checkins ?? []).map((checkin) => [checkin.account_id, checkin]));
  const tradeRows: TradesRotationRow[] = activeRotations
    .map((rotation: any) => {
      const account = rotation.account;
      const checkin = checkinByAccount.get(rotation.account_id) as any;
      if (!account || !checkin) return null;

      return {
        accountId: account.id,
        wallet: account.wallet_label || account.name,
        accountHref: `/accounts/${account.id}`,
        portfolioUrl: account.portfolio_url,
        status: checkin.status ?? "planned",
        tradesTarget: checkin.trades_target ?? 0,
        tradesCompleted: checkin.trades_completed ?? 0
      };
    })
    .filter(Boolean) as TradesRotationRow[];

  return (
    <AppShell profile={profile}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Owner Dashboard</h1>
          <p className="text-sm text-slate-600">Сегодня: {date}</p>
        </div>
        <form action={generateTodayRotation}>
          <button className="focus-ring rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white">
            Generate Today Rotation
          </button>
        </form>
      </div>

      <section className="grid gap-4 md:grid-cols-5">
        <MetricCard label="Total accounts" value={accounts?.length ?? 0} />
        <MetricCard label="Active today" value={activeRotations.length} />
        <MetricCard label="Resting today" value={restingRotations.length} />
        <MetricCard label="Done today" value={doneToday} />
        <MetricCard label="Pending today" value={Math.max(0, pendingToday)} />
      </section>

      <section className="mt-8">
        <div className="mb-3">
          <h2 className="font-semibold">Active accounts today</h2>
        </div>
        <TradesRotationTable
          rows={tradeRows}
          date={date}
          emptyText="Rotation for today is empty. Generate it first."
        />
      </section>

      <section className="mt-8 rounded-lg border border-line bg-panel shadow-sm">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-semibold">Accounts quick table</h2>
          <Link href="/accounts/new" className="rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white">
            New account
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-5 py-3">Wallet</th>
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
                    <Link className="font-semibold hover:underline" href={`/accounts/${account.id}`}>
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
        </div>
      </section>
    </AppShell>
  );
}
