import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export function getServerAccessToken() {
  return cookies().get("fm-access-token")?.value ?? null;
}

export function createServerSupabaseClient() {
  const accessToken = getServerAccessToken();

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: accessToken
          ? {
              Authorization: `Bearer ${accessToken}`
            }
          : {}
      }
    }
  );
}
