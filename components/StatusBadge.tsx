import type { CheckinStatus } from "@/lib/types";

const styles: Record<string, string> = {
  active: "bg-emerald-500/12 text-emerald-300 border-emerald-500/30",
  resting: "bg-slate-500/12 text-slate-300 border-slate-500/30",
  archived: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
  planned: "bg-sky-500/12 text-sky-300 border-sky-500/30",
  in_progress: "bg-amber-500/12 text-amber-300 border-amber-500/30",
  done: "bg-emerald-500/12 text-emerald-300 border-emerald-500/30",
  skipped: "bg-red-500/12 text-red-300 border-red-500/30"
};

export function StatusBadge({ value }: { value: string | CheckinStatus }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[value] ?? styles.planned}`}>
      {value.replace("_", " ")}
    </span>
  );
}
