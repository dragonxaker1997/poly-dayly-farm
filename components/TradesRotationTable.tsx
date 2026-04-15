"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { markCheckinDone, skipCheckin, updateTradesCompleted } from "@/app/actions";
import type { CheckinStatus } from "@/lib/types";

export type TradesRotationRow = {
  accountId: string;
  wallet: string;
  accountHref: string;
  portfolioUrl: string | null;
  status: CheckinStatus;
  tradesTarget: number;
  tradesCompleted: number;
};

type LocalRow = TradesRotationRow & {
  warning?: string;
};

function rowClass(status: CheckinStatus, completed: number, target: number) {
  if (status === "skipped") return "bg-slate-50 text-slate-400";
  if (status === "done" || (target > 0 && completed >= target)) return "bg-emerald-50";
  return "bg-white";
}

export function TradesRotationTable({
  rows,
  date,
  emptyText = "No active accounts for today."
}: {
  rows: TradesRotationRow[];
  date: string;
  emptyText?: string;
}) {
  const [localRows, setLocalRows] = useState<LocalRow[]>(rows);
  const [isPending, startTransition] = useTransition();

  function patchRow(accountId: string, patch: Partial<LocalRow>) {
    setLocalRows((current) =>
      current.map((row) => (row.accountId === accountId ? { ...row, ...patch } : row))
    );
  }

  function setCompleted(row: LocalRow, completed: number) {
    if (row.status === "done" || row.status === "skipped") return;

    const nextCompleted = Math.max(0, Math.min(row.tradesTarget, completed));
    patchRow(row.accountId, {
      tradesCompleted: nextCompleted,
      status: nextCompleted > 0 ? "in_progress" : "planned",
      warning: undefined
    });

    startTransition(async () => {
      const result = await updateTradesCompleted(row.accountId, date, nextCompleted);
      if (!result.ok) {
        patchRow(row.accountId, { warning: result.error });
      }
    });
  }

  function complete(row: LocalRow) {
    if (row.tradesCompleted <= 0) {
      patchRow(row.accountId, { warning: "Check at least one trade first." });
      return;
    }

    patchRow(row.accountId, { warning: undefined });
    startTransition(async () => {
      const result = await markCheckinDone(row.accountId, date);
      if (result.ok) {
        patchRow(row.accountId, { status: "done" });
      } else {
        patchRow(row.accountId, { warning: result.error });
      }
    });
  }

  function skip(row: LocalRow) {
    patchRow(row.accountId, { warning: undefined });
    startTransition(async () => {
      const result = await skipCheckin(row.accountId, date);
      if (result.ok) {
        patchRow(row.accountId, { status: "skipped" });
      } else {
        patchRow(row.accountId, { warning: result.error });
      }
    });
  }

  if (!localRows.length) {
    return (
      <div className="rounded-lg border border-line bg-panel p-5 text-sm text-slate-600">
        {emptyText}
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-line bg-panel shadow-sm">
      <table className="w-full table-fixed text-left text-sm">
        <thead className="border-b border-line bg-slate-100 text-xs uppercase text-slate-500">
          <tr>
            <th className="w-[28%] px-3 py-2">Wallet</th>
            <th className="w-[34%] px-3 py-2">Trades</th>
            <th className="w-[14%] px-3 py-2">Progress</th>
            <th className="w-[24%] px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {localRows.map((row) => {
            const closed = row.status === "done" || row.status === "skipped";
            const ready = row.tradesTarget > 0 && row.tradesCompleted >= row.tradesTarget;

            return (
              <tr
                key={row.accountId}
                className={`${rowClass(row.status, row.tradesCompleted, row.tradesTarget)} transition-colors`}
              >
                <td className="px-3 py-2 align-middle">
                  <div className="flex items-center gap-2">
                    <Link href={row.accountHref} className="font-semibold text-ink hover:underline">
                      {row.wallet}
                    </Link>
                    {row.portfolioUrl ? (
                      <a
                        href={row.portfolioUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded border border-line px-1.5 py-0.5 text-xs text-slate-600 hover:bg-white"
                      >
                        open
                      </a>
                    ) : null}
                  </div>
                  {row.warning ? <p className="mt-1 text-xs font-medium text-red-600">{row.warning}</p> : null}
                </td>
                <td className="px-3 py-2 align-middle">
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: row.tradesTarget }).map((_, index) => {
                      const checked = index < row.tradesCompleted;
                      return (
                        <button
                          key={index}
                          type="button"
                          disabled={closed || isPending}
                          onClick={() => setCompleted(row, checked ? index : index + 1)}
                          className={`h-5 w-5 rounded border text-xs font-bold ${
                            checked
                              ? "border-emerald-600 bg-emerald-600 text-white"
                              : "border-slate-300 bg-white text-transparent hover:border-slate-500"
                          } disabled:cursor-not-allowed disabled:opacity-60`}
                          aria-label={`Trade ${index + 1}`}
                        >
                          ✓
                        </button>
                      );
                    })}
                  </div>
                </td>
                <td className="px-3 py-2 align-middle font-semibold">
                  {row.tradesCompleted}/{row.tradesTarget}
                </td>
                <td className="px-3 py-2 align-middle">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={row.status === "done" || isPending}
                      onClick={() => complete(row)}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                        ready ? "bg-emerald-700 hover:bg-emerald-800" : "bg-ink hover:bg-slate-800"
                      }`}
                    >
                      Mark Done
                    </button>
                    <button
                      type="button"
                      disabled={closed || isPending}
                      onClick={() => skip(row)}
                      className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Skip
                    </button>
                    {ready && row.status !== "done" ? (
                      <span className="text-xs font-medium text-emerald-700">Ready to complete</span>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
