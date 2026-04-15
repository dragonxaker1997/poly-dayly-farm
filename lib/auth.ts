import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import type { Profile, Role } from "@/lib/types";

export async function getSessionProfile() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, profile: null };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return { supabase, user, profile: null };
  }

  return { supabase, user, profile: profile as Profile };
}

export async function requireProfile(requiredRole?: Role) {
  const session = await getSessionProfile();

  if (!session.user) {
    redirect("/login");
  }

  if (!session.profile) {
    redirect("/login?error=missing-profile");
  }

  if (requiredRole && session.profile.role !== requiredRole) {
    redirect(session.profile.role === "owner" ? "/owner" : "/worker");
  }

  return session as typeof session & { profile: Profile };
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
