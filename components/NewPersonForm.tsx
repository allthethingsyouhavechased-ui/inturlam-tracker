"use client";

import { useRef } from "react";
import { createPersonAction } from "@/lib/actions/people";
import SubmitButton from "./SubmitButton";

const inputClass =
  "w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/15 dark:bg-zinc-900";

export default function NewPersonForm() {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={ref}
      action={async (fd) => {
        await createPersonAction(fd);
        ref.current?.reset();
      }}
      className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"
    >
      <label className="grid gap-1 text-xs font-medium text-zinc-500">
        İsim
        <input name="name" required placeholder="Örn. Ada Yılmaz" className={inputClass} />
      </label>
      <SubmitButton>Ekip üyesi ekle</SubmitButton>
    </form>
  );
}
