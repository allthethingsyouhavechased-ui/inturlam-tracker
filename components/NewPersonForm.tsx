"use client";

import { useRef, useState } from "react";
import { createPersonAction } from "@/lib/actions/people";
import { getActionErrorMessage } from "@/lib/errorMessage";
import SubmitButton from "./SubmitButton";

const inputClass =
  "min-h-11 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-white/15 dark:bg-zinc-900";

export default function NewPersonForm() {
  const ref = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      ref={ref}
      action={async (fd) => {
        setError(null);
        try {
          await createPersonAction(fd);
          ref.current?.reset();
        } catch (e) {
          setError(getActionErrorMessage(e));
        }
      }}
      className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"
    >
      <label className="grid gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
        İsim
        <input name="name" required placeholder="Örn. Ada Yılmaz" className={inputClass} />
      </label>
      <SubmitButton>Ekip üyesi ekle</SubmitButton>
      {error && <p role="alert" className="text-xs text-rose-600 dark:text-rose-400 sm:col-span-2">{error}</p>}
    </form>
  );
}
