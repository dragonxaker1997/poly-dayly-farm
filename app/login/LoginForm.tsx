"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

export function LoginForm({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const [error, setError] = useState(initialError ?? "");
  const [isPending, startTransition] = useTransition();

  function submit(formData: FormData) {
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const supabase = createBrowserSupabaseClient();

    setError("");
    startTransition(async () => {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.replace("/");
      router.refresh();
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
