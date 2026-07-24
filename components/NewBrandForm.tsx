"use client";

import { useRef } from "react";
import { createBrandAction } from "@/lib/actions/brands";
import { CLUSTERS } from "@/lib/constants";
import SubmitButton from "./SubmitButton";

const inputClass =
  "w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/15 dark:bg-zinc-900";

export default function NewBrandForm() {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={ref}
      action={async (fd) => {
        await createBrandAction(fd);
        ref.current?.reset();
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
    </form>
  );
}
