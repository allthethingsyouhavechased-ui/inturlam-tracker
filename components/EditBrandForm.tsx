"use client";

import { useState } from "react";
import { updateBrandAction } from "@/lib/actions/brands";
import { CLUSTERS } from "@/lib/constants";
import { getActionErrorMessage } from "@/lib/errorMessage";
import type { Brand } from "@/lib/types";
import SubmitButton from "./SubmitButton";

const inputClass =
  "w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/15 dark:bg-zinc-900";

export default function EditBrandForm({
  brand,
}: {
  brand: Pick<Brand, "id" | "name" | "cluster" | "instagram_handle">;
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-xs font-medium text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400"
      >
        Düzenle
      </button>
    );
  }

  return (
    <form
      action={async (fd) => {
        setError(null);
        try {
          await updateBrandAction(fd);
          setEditing(false);
        } catch (e) {
          setError(getActionErrorMessage(e));
        }
      }}
      className="grid w-full gap-3 rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900 sm:grid-cols-[1fr_auto_auto_auto]"
    >
      <input type="hidden" name="brandId" value={brand.id} />
      <label className="grid gap-1 text-xs font-medium text-zinc-500">
        Marka adı
        <input name="name" required defaultValue={brand.name} className={inputClass} />
      </label>
      <label className="grid gap-1 text-xs font-medium text-zinc-500">
        Kategori
        <select name="cluster" defaultValue={brand.cluster} className={inputClass}>
          {CLUSTERS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-xs font-medium text-zinc-500">
        Instagram
        <input
          name="instagramHandle"
          defaultValue={brand.instagram_handle ?? ""}
          placeholder="kullaniciadi"
          className={inputClass}
        />
      </label>
      <div className="flex items-center gap-3 sm:col-span-4">
        <SubmitButton>Kaydet</SubmitButton>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          Vazgeç
        </button>
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>
    </form>
  );
}
