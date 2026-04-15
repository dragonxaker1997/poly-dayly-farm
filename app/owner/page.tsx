import Link from "next/link";
import { generateTodayRotation } from "@/app/actions";
import { AppShell } from "@/components/AppShell";
import { CheckinActions } from "@/components/CheckinActions";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
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

      <section className="mt-8 rounded-lg border border-line bg-panel shadow-sm">
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-semibold">Active accounts today</h2>
        </div>
        <div className="divide-y divide-line">
          {activeRotations.length ? (
            activeRotations.map((rotation) => {
              const account = rotation.account;
              const checkin = checkinByAccount.get(rotation.account_id);
              if (!account) return null;

              return (
                <div key={rotation.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_440px]">
                  <div>
                    <div className="flex items-center gap-3">
                      <Link href={`/accounts/${account.id}`} className="text-lg font-semibold hover:underline">
                        {account.name}
                      </Link>
                      <StatusBadge value={checkin?.status ?? "planned"} />
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{account.wallet_label || account.wallet_address}</p>
                    {account.portfolio_url ? (
                      <a
                        href={account.portfolio_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex rounded-md border border-line px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                      >
                        Open portfolio
                      </a>
                    ) : null}
                  </div>
                  <CheckinActions
                    accountId={account.id}
                    date={date}
                    comment={checkin?.comment}
                    extraNotes={checkin?.extra_notes}
                    tradesCountManual={checkin?.trades_count_manual}
                  />
                </div>
              );
            })
          ) : (
            <p className="p-5 text-sm text-slate-600">Rotation for today is empty. Generate it first.</p>
          )}
        </div>
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
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Worker</th>
                <th className="px-5 py-3">Portfolio</th>
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
        </div>
      </section>
    </AppShell>
  );
}
