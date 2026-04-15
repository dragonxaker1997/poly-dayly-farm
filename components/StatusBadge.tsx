import type { CheckinStatus } from "@/lib/types";

const styles: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  resting: "bg-slate-50 text-slate-700 border-slate-200",
  archived: "bg-zinc-100 text-zinc-500 border-zinc-200",
  planned: "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  done: "bg-emerald-50 text-emerald-700 border-emerald-200",
  skipped: "bg-red-50 text-red-700 border-red-200"
};

export function StatusBadge({ value }: { value: string | CheckinStatus }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[value] ?? styles.planned}`}>
      {value.replace("_", " ")}
    </span>
  );
}
