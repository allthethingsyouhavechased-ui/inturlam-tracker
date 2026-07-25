"use client";

import { useState } from "react";
import { updateBrandAction } from "@/lib/actions/brands";
import { COVER_TEST_LABEL, COVER_TEST_VERDICTS } from "@/lib/constants";
import { getActionErrorMessage } from "@/lib/errorMessage";
import type { Brand } from "@/lib/types";
import ClusterSelect from "./ClusterSelect";
import SubmitButton from "./SubmitButton";

const inputClass =
  "w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-white/15 dark:bg-zinc-900";

const labelClass = "grid gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400";

export default function EditBrandForm({
  brand,
  clusters,
}: {
  brand: Brand;
  clusters: { id: string; label: string }[];
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 dark:hover:text-brand-400"
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
      className="w-full space-y-4 rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900"
    >
      <input type="hidden" name="brandId" value={brand.id} />

      {/* Temel bilgiler */}
      <div className="grid gap-3 sm:grid-cols-3">
        <label className={labelClass}>
          Marka adı
          <input name="name" required defaultValue={brand.name} className={inputClass} />
        </label>
        <label className={labelClass}>
          Kategori
          <ClusterSelect
            clusters={clusters}
            defaultValue={
              // Markanın kategorisi silinmişse select'te karşılığı yok — o
              // durumda ilk kategoriye düşmesin, seçim boş kalmasın diye
              // listeye geçici bir seçenek eklemek yerine ilk sıradakine
              // bırakıyoruz ve kullanıcı bilinçli seçim yapıyor.
              clusters.some((c) => c.id === brand.cluster) ? brand.cluster : undefined
            }
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Instagram
          <input
            name="instagramHandle"
            defaultValue={brand.instagram_handle ?? ""}
            placeholder="kullaniciadi"
            className={inputClass}
          />
        </label>
      </div>

      {/* Araştırma / performans verileri */}
      <div className="space-y-3 border-t border-black/10 pt-3 dark:border-white/10">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Araştırma verileri
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className={labelClass}>
            Takipçi
            <input
              name="followerCount"
              type="number"
              min="0"
              inputMode="numeric"
              defaultValue={brand.follower_count ?? ""}
              placeholder="Örn. 12500"
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Gönderi
            <input
              name="postCount"
              type="number"
              min="0"
              inputMode="numeric"
              defaultValue={brand.post_count ?? ""}
              placeholder="Örn. 340"
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Medyan Reel izlenme
            <input
              name="medianReelViews"
              defaultValue={brand.median_reel_views ?? ""}
              placeholder="Örn. 8B"
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Kapak testi
            <select
              name="coverTestVerdict"
              defaultValue={brand.cover_test_verdict ?? ""}
              className={inputClass}
            >
              <option value="">— seçilmedi —</option>
              {COVER_TEST_VERDICTS.map((v) => (
                <option key={v} value={v}>
                  {COVER_TEST_LABEL[v]}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Kapak testi notu
            <input
              name="coverTestNote"
              defaultValue={brand.cover_test_note ?? ""}
              placeholder="Kısa açıklama"
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Tier
            <input
              name="tier"
              defaultValue={brand.tier ?? ""}
              placeholder="Örn. A"
              className={inputClass}
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelClass}>
            Öne çıkan bulgu
            <textarea
              name="keyFinding"
              rows={2}
              defaultValue={brand.key_finding ?? ""}
              placeholder="En önemli tespit"
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            İlk aksiyon
            <textarea
              name="firstAction"
              rows={2}
              defaultValue={brand.first_action ?? ""}
              placeholder="Önerilen ilk adım"
              className={inputClass}
            />
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton>Kaydet</SubmitButton>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          Vazgeç
        </button>
        {error && <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
      </div>
    </form>
  );
}
