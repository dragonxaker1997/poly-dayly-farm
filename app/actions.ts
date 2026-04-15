"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile, todayISO } from "@/lib/auth";
import { generateDailyRotation } from "@/lib/rotation";
import type { AccountStatus, CheckinStatus } from "@/lib/types";

function stringOrNull(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text.length ? text : null;
}

function numberOrNull(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function randomTradesTarget() {
  return Math.floor(Math.random() * 4) + 2;
}

function randomTradeTargets(count: number) {
  const values = Array.from({ length: count }, (_, index) => 2 + (index % 4));

  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
  }

  return values;
}

export async function generateTodayRotation() {
  const { supabase, user } = await requireProfile("owner");
  const date = todayISO();

  const { data: accounts, error } = await supabase
    .from("accounts")
    .select("id")
    .eq("status", "active");

  if (error) throw new Error(error.message);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data: recentRows, error: recentError } = await supabase
    .from("daily_rotations")
    .select("account_id")
    .gte("date", sevenDaysAgo)
    .lt("date", date)
    .eq("is_active", true);

  if (recentError) throw new Error(recentError.message);

  const recentCounts = new Map<string, number>();
  for (const row of recentRows ?? []) {
    recentCounts.set(row.account_id, (recentCounts.get(row.account_id) ?? 0) + 1);
  }

  const rotation = generateDailyRotation(
    (accounts ?? []).map((account) => ({
      id: account.id,
      recent_active_days: recentCounts.get(account.id) ?? 0
    })),
    `${date}-${Date.now()}-${Math.random()}`
  );

  const { error: upsertError } = await supabase.from("daily_rotations").upsert(
    rotation.map((row) => ({
      ...row,
      date,
      generated_by: user.id
    })),
    { onConflict: "date,account_id" }
  );

  if (upsertError) throw new Error(upsertError.message);

  const activeRotation = rotation.filter((row) => row.is_active);
  const tradeTargets = randomTradeTargets(activeRotation.length);
  const targetByAccount = new Map(
    activeRotation.map((row, index) => [row.account_id, tradeTargets[index]])
  );

  const existingCheckinsResult = activeRotation.length
    ? await supabase
        .from("daily_checkins")
        .select("account_id,status,trades_completed")
        .eq("date", date)
        .in(
          "account_id",
          activeRotation.map((row) => row.account_id)
        )
    : { data: [], error: null };

  if (existingCheckinsResult.error) throw new Error(existingCheckinsResult.error.message);

  const existingByAccount = new Map(
    (existingCheckinsResult.data ?? []).map((checkin: any) => [checkin.account_id, checkin])
  );

  const activeCheckins = activeRotation
    .filter((row) => !existingByAccount.has(row.account_id))
    .map((row) => ({
      date,
      account_id: row.account_id,
      status: "planned" as CheckinStatus,
      completed_by: null,
      completed_at: null,
      comment: null,
      trades_count_manual: null,
      trades_target: targetByAccount.get(row.account_id) ?? randomTradesTarget(),
      trades_completed: 0,
      extra_notes: null
    }));

  if (activeCheckins.length) {
    const { error: checkinError } = await supabase
      .from("daily_checkins")
      .upsert(activeCheckins, { onConflict: "date,account_id", ignoreDuplicates: true });

    if (checkinError) throw new Error(checkinError.message);
  }

  await Promise.all(
    activeRotation.map(async (row, index) => {
      const existing = existingByAccount.get(row.account_id);

      if (!existing || existing.status === "done" || existing.status === "skipped") {
        return;
      }

      const { error: updateError } = await supabase
        .from("daily_checkins")
        .update({
          status: "planned",
          completed_by: null,
          completed_at: null,
          trades_target: tradeTargets[index],
          trades_completed: 0
        })
        .eq("date", date)
        .eq("account_id", row.account_id)
        .neq("status", "done")
        .neq("status", "skipped");

      if (updateError) throw new Error(updateError.message);
    })
  );

  revalidatePath("/");
  revalidatePath("/owner");
  revalidatePath("/worker");
  revalidatePath("/rotation");
}

export async function setRotationStatus(formData: FormData) {
  const { supabase, user } = await requireProfile("owner");
  const date = String(formData.get("date") || todayISO());
  const accountId = String(formData.get("account_id") || "");
  const isActive = String(formData.get("is_active")) === "true";

  const { error } = await supabase.from("daily_rotations").upsert(
    {
      date,
      account_id: accountId,
      is_active: isActive,
      generated_by: user.id
    },
    { onConflict: "date,account_id" }
  );

  if (error) throw new Error(error.message);

  if (isActive) {
    await supabase.from("daily_checkins").upsert(
      {
        date,
        account_id: accountId,
        status: "planned",
        completed_by: null,
        completed_at: null,
        comment: null,
        trades_count_manual: null,
        trades_target: randomTradesTarget(),
        trades_completed: 0,
        extra_notes: null
      },
      { onConflict: "date,account_id", ignoreDuplicates: true }
    );
  }

  revalidatePath("/rotation");
  revalidatePath("/owner");
}

export async function updateCheckin(formData: FormData) {
  const { supabase, user } = await requireProfile();
  const date = String(formData.get("date") || todayISO());
  const accountId = String(formData.get("account_id") || "");
  const status = String(formData.get("status") || "planned") as CheckinStatus;
  const isCompletion = status === "done" || status === "skipped";

  const { error } = await supabase.from("daily_checkins").upsert(
    {
      date,
      account_id: accountId,
      status,
      completed_by: status === "planned" ? null : user.id,
      completed_at: isCompletion ? new Date().toISOString() : null,
      comment: stringOrNull(formData.get("comment")),
      trades_count_manual: numberOrNull(formData.get("trades_count_manual")),
      extra_notes: stringOrNull(formData.get("extra_notes"))
    },
    { onConflict: "date,account_id" }
  );

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/owner");
  revalidatePath("/worker");
  revalidatePath("/rotation");
  revalidatePath(`/accounts/${accountId}`);
}

export async function updatePortfolioUrl(accountId: string, portfolioUrl: string) {
  const { supabase } = await requireProfile("owner");
  const url = portfolioUrl.trim();

  if (url && !/^https?:\/\//i.test(url)) {
    return { ok: false, error: "Use a full http/https URL." };
  }

  const { error } = await supabase
    .from("accounts")
    .update({ portfolio_url: url || null })
    .eq("id", accountId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/owner");
  revalidatePath("/worker");
  revalidatePath("/rotation");
  revalidatePath("/accounts");
  revalidatePath(`/accounts/${accountId}`);

  return { ok: true, portfolioUrl: url || null };
}

export async function updateTradesCompleted(accountId: string, date: string, tradesCompleted: number) {
  const { supabase } = await requireProfile();
  const completed = Math.max(0, Math.min(5, Math.trunc(tradesCompleted)));

  const { data: checkin, error: readError } = await supabase
    .from("daily_checkins")
    .select("status,trades_target")
    .eq("account_id", accountId)
    .eq("date", date)
    .single();

  if (readError) {
    return { ok: false, error: readError.message };
  }

  if (checkin.status === "done" || checkin.status === "skipped") {
    return { ok: false, error: "This check-in is already closed." };
  }

  const nextCompleted = Math.min(completed, checkin.trades_target ?? 0);
  const nextStatus: CheckinStatus = nextCompleted > 0 ? "in_progress" : "planned";

  const { error } = await supabase
    .from("daily_checkins")
    .update({
      trades_completed: nextCompleted,
      status: nextStatus
    })
    .eq("account_id", accountId)
    .eq("date", date);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function markCheckinDone(accountId: string, date: string) {
  const { supabase } = await requireProfile();
  const { error } = await supabase.rpc("mark_daily_checkin_done", {
    p_account_id: accountId,
    p_date: date
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/owner");
  revalidatePath("/worker");
  revalidatePath("/rotation");
  revalidatePath("/accounts");
  revalidatePath(`/accounts/${accountId}`);

  return { ok: true };
}

export async function skipCheckin(accountId: string, date: string) {
  const { supabase } = await requireProfile();
  const { error } = await supabase.rpc("skip_daily_checkin", {
    p_account_id: accountId,
    p_date: date
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/owner");
  revalidatePath("/worker");
  revalidatePath("/rotation");
  revalidatePath(`/accounts/${accountId}`);

  return { ok: true };
}

export async function createAccount(formData: FormData) {
  const { supabase } = await requireProfile("owner");

  const { error } = await supabase.from("accounts").insert({
    name: String(formData.get("name") || "").trim(),
    wallet_label: stringOrNull(formData.get("wallet_label")),
    wallet_address: stringOrNull(formData.get("wallet_address")),
    portfolio_url: stringOrNull(formData.get("portfolio_url")),
    base_comment: stringOrNull(formData.get("base_comment")),
    status: String(formData.get("status") || "active") as AccountStatus,
    assigned_worker_id: stringOrNull(formData.get("assigned_worker_id"))
  });

  if (error) throw new Error(error.message);

  revalidatePath("/accounts");
  redirect("/accounts");
}

export async function updateAccount(formData: FormData) {
  const { supabase } = await requireProfile("owner");
  const id = String(formData.get("id") || "");

  const { error } = await supabase
    .from("accounts")
    .update({
      name: String(formData.get("name") || "").trim(),
      wallet_label: stringOrNull(formData.get("wallet_label")),
      wallet_address: stringOrNull(formData.get("wallet_address")),
      portfolio_url: stringOrNull(formData.get("portfolio_url")),
      base_comment: stringOrNull(formData.get("base_comment")),
      status: String(formData.get("status") || "active") as AccountStatus,
      assigned_worker_id: stringOrNull(formData.get("assigned_worker_id"))
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/accounts");
  revalidatePath(`/accounts/${id}`);
}
