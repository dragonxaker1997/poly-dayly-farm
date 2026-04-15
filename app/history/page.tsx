import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { requireProfile } from "@/lib/auth";

export default async function HistoryPage() {
  const { supabase, profile } = await requireProfile();
  const { data: rows } = await supabase
    .from("daily_checkins")
    .select("*, account:accounts(*), completed_by_profile:profiles(id,email,role)")
    .order("date", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(100);

  return (
    <AppShell profile={profile}>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Check-in History</h1>
        <p className="text-sm text-slate-600">Последние 100 записей, с учетом RLS-доступа.</p>
      </div>

      <section className="overflow-hidden rounded-lg border border-line bg-panel shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Account</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">By</th>
              <th className="px-5 py-3">Trades</th>
              <th className="px-5 py-3">Comment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(rows ?? []).map((row: any) => (
              <tr key={row.id}>
                <td className="px-5 py-3">{row.date}</td>
                <td className="px-5 py-3">
                  {row.account ? (
                    <Link href={`/accounts/${row.account.id}`} className="font-semibold hover:underline">
                      {row.account.name}
                    </Link>
                  ) : "hidden"}
                </td>
                <td className="px-5 py-3"><StatusBadge value={row.status} /></td>
                <td className="px-5 py-3">{row.completed_by_profile?.email ?? "none"}</td>
                <td className="px-5 py-3">{row.trades_count_manual ?? ""}</td>
                <td className="px-5 py-3 text-slate-600">{row.comment ?? row.extra_notes ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
