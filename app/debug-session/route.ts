import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient, getServerAccessToken } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const accessToken = getServerAccessToken();
  const {
    data: { user },
    error: userError
  } = accessToken
    ? await supabase.auth.getUser(accessToken)
    : { data: { user: null }, error: { message: "No fm-access-token cookie" } };

  const { data: profile, error: profileError } = user
    ? await supabase.from("profiles").select("id,email,role").eq("id", user.id).maybeSingle()
    : { data: null, error: null };

  return NextResponse.json({
    hasUser: Boolean(user),
    userEmail: user?.email ?? null,
    userError: userError?.message ?? null,
    hasProfile: Boolean(profile),
    profile,
    profileError: profileError?.message ?? null,
    cookieNames: request.cookies.getAll().map((cookie) => cookie.name),
    hasFarmAccessCookie: Boolean(request.cookies.get("fm-access-token")),
    hasFarmRefreshCookie: Boolean(request.cookies.get("fm-refresh-token")),
    supabaseUrlHost: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
      : null
  });
}
