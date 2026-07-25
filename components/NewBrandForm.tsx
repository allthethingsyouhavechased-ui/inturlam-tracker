"use client";

import { useRef, useState } from "react";
import { createBrandAction } from "@/lib/actions/brands";
import { getActionErrorMessage } from "@/lib/errorMessage";
import ClusterSelect from "./ClusterSelect";
import SubmitButton from "./SubmitButton";

const inputClass =
  "w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-white/15 dark:bg-zinc-900";

export default function NewBrandForm({
  clusters,
}: {
  clusters: { id: string; label: string }[];
}) {
  const ref = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  // form.reset() kontrollü <select>'i eski haline döndürmez; ClusterSelect'i
  // yeni bir key ile remount ederek iç state'ini de sıfırlıyoruz.
  const [resetKey, setResetKey] = useState(0);

  return (
    <form
      ref={ref}
      action={async (fd) => {
        setError(null);
        try {
          await createBrandAction(fd);
          ref.current?.reset();
          setResetKey((k) => k + 1);
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
        <ClusterSelect key={resetKey} clusters={clusters} className={inputClass} />
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
