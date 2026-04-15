import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { CheckinActions } from "@/components/CheckinActions";
import { StatusBadge } from "@/components/StatusBadge";
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

  return (
    <AppShell profile={profile}>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Worker Dashboard</h1>
        <p className="text-sm text-slate-600">Мои активные аккаунты на {date}</p>
      </div>

      <section className="space-y-4">
        {(rotations ?? []).length ? (
          (rotations ?? []).map((rotation: any) => {
            const account = rotation.account;
            const checkin = checkinByAccount.get(rotation.account_id);
            if (!account) return null;

            return (
              <article key={rotation.id} className="grid gap-4 rounded-lg border border-line bg-panel p-5 shadow-sm lg:grid-cols-[1fr_440px]">
                <div>
                  <div className="flex items-center gap-3">
                    <Link href={`/accounts/${account.id}`} className="text-xl font-semibold hover:underline">
                      {account.name}
                    </Link>
                    <StatusBadge value={checkin?.status ?? "planned"} />
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{account.wallet_label || account.wallet_address}</p>
                  {account.base_comment ? (
                    <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-700">{account.base_comment}</p>
                  ) : null}
                  {account.portfolio_url ? (
                    <a
                      href={account.portfolio_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex rounded-md bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white"
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
              </article>
            );
          })
        ) : (
          <div className="rounded-lg border border-line bg-panel p-6 text-sm text-slate-600">
            На сегодня нет активных назначенных аккаунтов.
          </div>
        )}
      </section>
    </AppShell>
  );
}
