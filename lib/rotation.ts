import type { Account } from "@/lib/types";

type RotationInput = Pick<Account, "id"> & {
  recent_active_days?: number | null;
};

function daySeed(date: string) {
  return date.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function score(account: RotationInput, date: string) {
  const seed = daySeed(date);
  const hash = account.id.split("").reduce((sum, char, index) => {
    return sum + char.charCodeAt(0) * (index + 17);
  }, seed);
  const recentPenalty = (account.recent_active_days ?? 0) * 0.18;
  const pseudoRandom = Math.sin(hash) * 10000;

  return pseudoRandom - Math.floor(pseudoRandom) - recentPenalty;
}

export function generateDailyRotation(accounts: RotationInput[], date: string) {
  const activeAccounts = accounts.filter(Boolean);
  const targetActive = Math.min(
    activeAccounts.length,
    Math.max(1, Math.round(activeAccounts.length * 0.65))
  );

  const selected = new Set(
    [...activeAccounts]
      .sort((a, b) => score(b, date) - score(a, date))
      .slice(0, targetActive)
      .map((account) => account.id)
  );

  return activeAccounts.map((account) => ({
    account_id: account.id,
    is_active: selected.has(account.id)
  }));
}
