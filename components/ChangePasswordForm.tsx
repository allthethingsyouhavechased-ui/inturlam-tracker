"use client";

import { useActionState } from "react";
import { changePassword } from "@/lib/actions/identity";
import SubmitButton from "@/components/SubmitButton";

const inputClass =
  "min-h-11 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-white/15 dark:bg-zinc-950";

export default function ChangePasswordForm() {
  const [state, action] = useActionState(changePassword, {});

  return (
    <form
      action={action}
      className="space-y-4 rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-zinc-900 sm:p-6"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-200">
          Mevcut şifre
          <input name="currentPassword" type="password" required maxLength={128} autoComplete="current-password" className={inputClass} />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-200">
          Yeni şifre
          <input name="newPassword" type="password" required minLength={6} maxLength={128} autoComplete="new-password" className={inputClass} />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-200">
          Yeni şifre tekrar
          <input name="confirmPassword" type="password" required minLength={6} maxLength={128} autoComplete="new-password" className={inputClass} />
        </label>
      </div>
      {state.error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
          {state.error}
        </p>
      )}
      <div className="flex justify-end border-t border-black/5 pt-4 dark:border-white/5">
        <SubmitButton>Şifreyi değiştir</SubmitButton>
      </div>
    </form>
  );
}
