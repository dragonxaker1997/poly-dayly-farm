import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getSupabaseAuthCookieName } from "@/lib/supabase-cookie";
import { cookies } from "next/headers";

export async function GET() {
  const supabase = createServerSupabaseClient();
  await supabase.auth.signOut();
  cookies().delete(getSupabaseAuthCookieName());
  redirect("/login");
}
