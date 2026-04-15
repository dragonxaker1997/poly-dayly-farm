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
    date
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

  const activeCheckins = rotation
    .filter((row) => row.is_active)
    .map((row) => ({
      date,
      account_id: row.account_id,
      status: "planned" as CheckinStatus,
      completed_by: null,
      completed_at: null,
      comment: null,
      trades_count_manual: null,
      extra_notes: null
    }));

  if (activeCheckins.length) {
    const { error: checkinError } = await supabase
      .from("daily_checkins")
      .upsert(activeCheckins, { onConflict: "date,account_id", ignoreDuplicates: true });

    if (checkinError) throw new Error(checkinError.message);
  }

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
