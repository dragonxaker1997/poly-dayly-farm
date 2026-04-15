"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { markCheckinDone, skipCheckin, updatePortfolioUrl } from "@/app/actions";
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
  portfolioDraft?: string;
  editingPortfolio?: boolean;
};

function rowClass(status: CheckinStatus, completed: number, target: number) {
  if (status === "skipped") return "bg-slate-950/60 text-slate-500";
  if (status === "done" || (target > 0 && completed >= target)) return "bg-emerald-950/35";
  return "bg-panel";
}

export function TradesRotationTable({
  rows,
  date,
  canEditPortfolio = false,
  emptyText = "No active accounts for today."
}: {
  rows: TradesRotationRow[];
  date: string;
  canEditPortfolio?: boolean;
  emptyText?: string;
}) {
  const [localRows, setLocalRows] = useState<LocalRow[]>(
    rows.map((row) => ({ ...row, portfolioDraft: row.portfolioUrl ?? "" }))
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setLocalRows((current) =>
      current.map((row) => {
        if (row.status === "done" || row.status === "skipped") return row;

        const stored = window.localStorage.getItem(tradeStorageKey(date, row.accountId));
        if (!stored) return row;

        const storedCompleted = Number(stored);
        if (!Number.isFinite(storedCompleted)) return row;

        const tradesCompleted = Math.max(0, Math.min(row.tradesTarget, Math.trunc(storedCompleted)));

        return {
          ...row,
          tradesCompleted,
          status: tradesCompleted > 0 ? "in_progress" : "planned"
        };
      })
    );
  }, [date]);

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

    window.localStorage.setItem(tradeStorageKey(date, row.accountId), String(nextCompleted));
  }

  function complete(row: LocalRow) {
    if (row.tradesCompleted <= 0) {
      patchRow(row.accountId, { warning: "Check at least one trade first." });
      return;
    }

    patchRow(row.accountId, { warning: undefined });
    startTransition(async () => {
      const result = await markCheckinDone(row.accountId, date, row.tradesCompleted);
      if (result.ok) {
        patchRow(row.accountId, { status: "done" });
        window.localStorage.removeItem(tradeStorageKey(date, row.accountId));
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
        window.localStorage.removeItem(tradeStorageKey(date, row.accountId));
      } else {
        patchRow(row.accountId, { warning: result.error });
      }
    });
  }

  function savePortfolio(row: LocalRow) {
    patchRow(row.accountId, { warning: undefined });
    startTransition(async () => {
      const result = await updatePortfolioUrl(row.accountId, row.portfolioDraft ?? "");
      if (result.ok) {
        patchRow(row.accountId, {
          portfolioUrl: result.portfolioUrl,
          portfolioDraft: result.portfolioUrl ?? "",
          editingPortfolio: false
        });
      } else {
        patchRow(row.accountId, { warning: result.error });
      }
    });
  }

  if (!localRows.length) {
    return (
      <div className="rounded-lg border border-line bg-panel p-5 text-sm text-slate-400">
        {emptyText}
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-line bg-panel/95 shadow-sm">
      <table className="w-full table-fixed text-left text-sm">
        <thead className="border-b border-line bg-slate-950/70 text-xs uppercase text-slate-400">
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
                    <Link href={row.accountHref} className="font-semibold text-slate-100 hover:text-sky-300">
                      {row.wallet}
                    </Link>
                    {row.portfolioUrl && !row.editingPortfolio ? (
                      <a
                        href={row.portfolioUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded border border-line bg-slate-950/40 px-1.5 py-0.5 text-xs text-slate-300 hover:bg-slate-800"
                      >
                        Profile
                      </a>
                    ) : null}
                    {canEditPortfolio && row.portfolioUrl && !row.editingPortfolio ? (
                      <button
                        type="button"
                        onClick={() => patchRow(row.accountId, { editingPortfolio: true })}
                        className="rounded border border-line px-1.5 py-0.5 text-xs text-slate-400 hover:bg-slate-800"
                      >
                        Edit
                      </button>
                    ) : null}
                  </div>
                  {canEditPortfolio && (!row.portfolioUrl || row.editingPortfolio) ? (
                    <div className="mt-1 flex max-w-md items-center gap-1.5">
                      <input
                        value={row.portfolioDraft ?? ""}
                        onChange={(event) =>
                          patchRow(row.accountId, { portfolioDraft: event.target.value })
                        }
                        placeholder="https://polymarket.com/profile/..."
                        className="h-7 rounded border border-line bg-slate-950 px-2 text-xs text-slate-100 placeholder:text-slate-600"
                      />
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => savePortfolio(row)}
                        className="h-7 rounded bg-ink px-2 text-xs font-semibold text-slate-950 hover:bg-sky-300 disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
                  ) : null}
                  {row.warning ? <p className="mt-1 text-xs font-medium text-red-300">{row.warning}</p> : null}
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
                              ? "border-emerald-400 bg-emerald-500 text-slate-950"
                              : "border-slate-600 bg-slate-950 text-transparent hover:border-sky-400"
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
                        ready ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400" : "bg-ink text-slate-950 hover:bg-sky-300"
                      }`}
                    >
                      Mark Done
                    </button>
                    <button
                      type="button"
                      disabled={closed || isPending}
                      onClick={() => skip(row)}
                      className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Skip
                    </button>
                    {ready && row.status !== "done" ? (
                      <span className="text-xs font-medium text-emerald-300">Ready to complete</span>
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

function tradeStorageKey(date: string, accountId: string) {
  return `farm-trades:${date}:${accountId}`;
}
