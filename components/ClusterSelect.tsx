"use client";

import { useState } from "react";
import { NEW_CLUSTER_VALUE } from "@/lib/constants";

// Marka formlarındaki kategori seçici. Listenin sonundaki "+ Yeni kategori…"
// seçilince altında bir ad kutusu açılır ve kategori marka kaydedilirken
// oluşturulur (bkz. resolveClusterFromForm) — ayrı bir "kategori ekle" adımı
// gerekmesin diye.
export default function ClusterSelect({
  clusters,
  defaultValue,
  className,
}: {
  clusters: { id: string; label: string }[];
  defaultValue?: string;
  className?: string;
}) {
  const initial =
    defaultValue ?? clusters[0]?.id ?? NEW_CLUSTER_VALUE;
  const [value, setValue] = useState(initial);
  const creating = value === NEW_CLUSTER_VALUE;

  return (
    <>
      <select
        name="cluster"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={className}
      >
        {clusters.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
        <option value={NEW_CLUSTER_VALUE}>+ Yeni kategori…</option>
      </select>
      {creating && (
        <input
          name="newClusterLabel"
          required
          autoFocus
          placeholder="Yeni kategori adı"
          aria-label="Yeni kategori adı"
          className={`mt-1.5 ${className ?? ""}`}
        />
      )}
    </>
  );
}
