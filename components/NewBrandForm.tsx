"use client";

import { useRef, useState } from "react";
import { createBrandAction } from "@/lib/actions/brands";
import { CLUSTERS } from "@/lib/constants";
import { getActionErrorMessage } from "@/lib/errorMessage";
import SubmitButton from "./SubmitButton";

const inputClass =
  "w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/15 dark:bg-zinc-900";

export default function NewBrandForm() {
  const ref = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      ref={ref}
      action={async (fd) => {
        setError(null);
        try {
          await createBrandAction(fd);
          ref.current?.reset();
        } catch (e) {
          setError(getActionErrorMessage(e));
        }
      }}
      className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end"
    >
      <label className="grid gap-1 text-xs font-medium text-zinc-500">
        Marka adı
        <input
          name="name"
          required
          placeholder="Örn. Yeni Marka"
          className={inputClass}
        />
      </label>
      <label className="grid gap-1 text-xs font-medium text-zinc-500">
        Kategori
        <select name="cluster" className={inputClass} defaultValue={CLUSTERS[0].id}>
          {CLUSTERS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-xs font-medium text-zinc-500">
        Instagram (opsiyonel)
        <input
          name="instagramHandle"
          placeholder="kullaniciadi"
          className={inputClass}
        />
      </label>
      <SubmitButton>Marka ekle</SubmitButton>
      {error && <p className="text-xs text-rose-600 sm:col-span-4">{error}</p>}
    </form>
  );
}
