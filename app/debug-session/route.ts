import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

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
    supabaseUrlHost: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
      : null
  });
}
