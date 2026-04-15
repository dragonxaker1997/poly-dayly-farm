import { AppShell } from "@/components/AppShell";
import { TradesRotationTable, type TradesRotationRow } from "@/components/TradesRotationTable";
import { requireProfile, todayISO } from "@/lib/auth";

export default async function WorkerDashboardPage() {
  const { supabase, profile } = await requireProfile("worker");
  const date = todayISO();

  const { data: rotations } = await supabase
    .from("daily_rotations")
    .select("*, account:accounts(*)")
    .eq("date", date)
    .eq("is_active", true)
    .order("created_at");

  const { data: checkins } = await supabase.from("daily_checkins").select("*").eq("date", date);
  const checkinByAccount = new Map((checkins ?? []).map((checkin) => [checkin.account_id, checkin]));
  const tradeRows: TradesRotationRow[] = (rotations ?? [])
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
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Worker Dashboard</h1>
        <p className="text-sm text-slate-600">Мои активные аккаунты на {date}</p>
      </div>

      <TradesRotationTable
        rows={tradeRows}
        date={date}
        emptyText="На сегодня нет активных назначенных аккаунтов."
      />
    </AppShell>
  );
}
