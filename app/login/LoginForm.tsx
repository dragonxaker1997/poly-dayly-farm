"use client";

import { createClient } from "@supabase/supabase-js";
import { useState, useTransition } from "react";

function setCookie(name: string, value: string, maxAge: number) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

export function LoginForm({ initialError }: { initialError?: string }) {
  const [error, setError] = useState(initialError ?? "");
  const [isPending, startTransition] = useTransition();

  function submit(formData: FormData) {
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );

    setError("");

    startTransition(async () => {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError || !data.session) {
        setError(signInError?.message ?? "No session returned");
        return;
      }

      setCookie("fm-access-token", data.session.access_token, data.session.expires_in);
      setCookie("fm-refresh-token", data.session.refresh_token, 60 * 60 * 24 * 30);

      window.location.assign("/");
    });
  }

  return (
    <>
      {error ? (
        <div className="mb-5 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error === "missing-profile"
            ? "Для пользователя не найден profile. Проверь profiles table."
            : error}
        </div>
      ) : null}

      <form action={submit} className="space-y-4">
        <label className="block text-sm font-medium">
          Email
          <input
            className="focus-ring mt-1 rounded-md border border-line px-3 py-2"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input
            className="focus-ring mt-1 rounded-md border border-line px-3 py-2"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </label>
        <button
          disabled={isPending}
          className="focus-ring w-full rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60"
        >
          {isPending ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </>
  );
}
