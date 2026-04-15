import { updateCheckin } from "@/app/actions";
import type { CheckinStatus } from "@/lib/types";

export function CheckinActions({
  accountId,
  date,
  comment,
  extraNotes,
  tradesCountManual
}: {
  accountId: string;
  date: string;
  comment?: string | null;
  extraNotes?: string | null;
  tradesCountManual?: number | null;
}) {
  return (
    <form action={updateCheckin} className="space-y-3">
      <input type="hidden" name="account_id" value={accountId} />
      <input type="hidden" name="date" value={date} />
      <label className="block text-sm font-medium">
        Comment
        <textarea
          name="comment"
          rows={3}
          defaultValue={comment ?? ""}
          className="focus-ring mt-1 rounded-md border border-line px-3 py-2"
          placeholder="Что сделано, что проверить завтра..."
        />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-sm font-medium">
          Trades count
          <input
            name="trades_count_manual"
            type="number"
            min="0"
            defaultValue={tradesCountManual ?? ""}
            className="focus-ring mt-1 rounded-md border border-line px-3 py-2"
          />
        </label>
        <label className="block text-sm font-medium">
          Extra notes
          <input
            name="extra_notes"
            defaultValue={extraNotes ?? ""}
            className="focus-ring mt-1 rounded-md border border-line px-3 py-2"
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        {(["in_progress", "done", "skipped"] satisfies CheckinStatus[]).map((status) => (
          <button
            key={status}
            name="status"
            value={status}
            className="focus-ring rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            {status === "in_progress" ? "Start" : status === "done" ? "Mark Done" : "Skip"}
          </button>
        ))}
        <button
          name="status"
          value="planned"
          className="focus-ring rounded-md border border-line px-3 py-2 text-sm font-semibold hover:bg-slate-50"
        >
          Save Comment
        </button>
      </div>
    </form>
  );
}
