import Link from "next/link";
import { generateTodayRotation, setRotationStatus } from "@/app/actions";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { requireProfile, todayISO } from "@/lib/auth";

export default async function RotationPage() {
  const { supabase, profile } = await requireProfile("owner");
  const date = todayISO();

  const [{ data: accounts }, { data: rotations }, { data: checkins }] = await Promise.all([
    supabase.from("accounts").select("*, assigned_worker:profiles(id,email,role)").neq("status", "archived").order("name"),
    supabase.from("daily_rotations").select("*").eq("date", date),
    supabase.from("daily_checkins").select("*").eq("date", date)
  ]);

  const rotationByAccount = new Map((rotations ?? []).map((rotation) => [rotation.account_id, rotation]));
  const checkinByAccount = new Map((checkins ?? []).map((checkin) => [checkin.account_id, checkin]));

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

      <section className="overflow-hidden rounded-lg border border-line bg-panel shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-5 py-3">Account</th>
              <th className="px-5 py-3">Worker</th>
              <th className="px-5 py-3">Today</th>
              <th className="px-5 py-3">Check-in</th>
              <th className="px-5 py-3">Manual status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(accounts ?? []).map((account: any) => {
              const rotation = rotationByAccount.get(account.id);
              const isActive = Boolean(rotation?.is_active);
              const checkin = checkinByAccount.get(account.id);

              return (
                <tr key={account.id}>
                  <td className="px-5 py-3">
                    <Link href={`/accounts/${account.id}`} className="font-semibold hover:underline">
                      {account.name}
                    </Link>
                    <p className="text-xs text-slate-500">{account.wallet_label || account.wallet_address}</p>
                  </td>
                  <td className="px-5 py-3">{account.assigned_worker?.email ?? "unassigned"}</td>
                  <td className="px-5 py-3"><StatusBadge value={isActive ? "active" : "resting"} /></td>
                  <td className="px-5 py-3"><StatusBadge value={checkin?.status ?? "planned"} /></td>
                  <td className="px-5 py-3">
                    <form action={setRotationStatus} className="flex gap-2">
                      <input type="hidden" name="date" value={date} />
                      <input type="hidden" name="account_id" value={account.id} />
                      <button
                        name="is_active"
                        value="true"
                        className="focus-ring rounded-md border border-line px-3 py-2 text-xs font-semibold hover:bg-slate-50"
                      >
                        Set active
                      </button>
                      <button
                        name="is_active"
                        value="false"
                        className="focus-ring rounded-md border border-line px-3 py-2 text-xs font-semibold hover:bg-slate-50"
                      >
                        Set resting
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
