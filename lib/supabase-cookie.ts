import type { Session } from "@supabase/supabase-js";

const BASE64_PREFIX = "base64-";

export function getSupabaseAuthCookieName() {
  const host = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname;
  const projectRef = host.split(".")[0];

  return `sb-${projectRef}-auth-token`;
}

export function encodeSupabaseSession(session: Session) {
  const value = JSON.stringify(session);
  return `${BASE64_PREFIX}${Buffer.from(value, "utf8").toString("base64url")}`;
}
