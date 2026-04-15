import { generateTodayRotation } from "@/app/actions";
import { AppShell } from "@/components/AppShell";
import { TradesRotationTable, type TradesRotationRow } from "@/components/TradesRotationTable";
import { requireProfile, todayISO } from "@/lib/auth";

export default async function RotationPage() {
  const { supabase, profile } = await requireProfile("owner");
  const date = todayISO();

  const [{ data: rotations }, { data: checkins }] = await Promise.all([
    supabase
      .from("daily_rotations")
      .select("*, account:accounts(*)")
      .eq("date", date)
      .eq("is_active", true)
      .order("created_at"),
    supabase.from("daily_checkins").select("*").eq("date", date)
  ]);

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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Today Rotation</h1>
          <p className="text-sm text-slate-600">Snapshot на {date}</p>
        </div>
        <form action={generateTodayRotation}>
          <button className="focus-ring rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white">
            Generate Today Rotation
          </button>
        </form>
      </div>

      <TradesRotationTable
        rows={tradeRows}
        date={date}
        emptyText="Rotation for today is empty. Generate it first."
      />
    </AppShell>
  );
}
