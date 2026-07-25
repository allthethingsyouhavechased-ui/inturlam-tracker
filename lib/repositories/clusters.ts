import { UNKNOWN_CLUSTER_LABEL } from "@/lib/constants";
import { getDb, plainList, plainOne } from "@/lib/db/client";
import type { ClusterRow } from "@/lib/types";

// Markaları kategori sırasına göre gruplar. Kategorisi `clusters` tablosunda
// bulunmayan markalar (kategori silinmiş, DB elle düzenlenmiş) kaybolmasın diye
// sonda tek bir "Kategorisiz" grubunda toplanır. Boş kategoriler atlanmaz —
// çağıran taraf gösterip göstermemeye kendi karar verir.
export function groupBrandsByCluster<T extends { cluster: string }>(
  items: T[],
  clusters: ClusterRow[],
): { id: string; label: string; items: T[] }[] {
  const known = new Set(clusters.map((c) => c.id));
  const groups = clusters.map((c) => ({
    id: c.id,
    label: c.label,
    items: items.filter((b) => b.cluster === c.id),
  }));
  const orphans = items.filter((b) => !known.has(b.cluster));
  if (orphans.length > 0) {
    groups.push({ id: "__unknown", label: UNKNOWN_CLUSTER_LABEL, items: orphans });
  }
  return groups;
}

export function listClusters(): ClusterRow[] {
  return plainList<ClusterRow>(
    getDb().prepare("SELECT * FROM clusters ORDER BY sort_order, label").all(),
  );
}

export function getCluster(id: string): ClusterRow | undefined {
  return plainOne<ClusterRow>(
    getDb().prepare("SELECT * FROM clusters WHERE id = ?").get(id),
  );
}

// Etiketten URL/DB dostu bir id üretir. Türkçe karakterler ASCII karşılıklarına
// çevrilir (slugify kütüphanesi yerine elle: bağımlılık eklememek için).
export function slugifyCluster(label: string): string {
  const map: Record<string, string> = {
    ç: "c", ğ: "g", ı: "i", i: "i", ö: "o", ş: "s", ü: "u",
    Ç: "c", Ğ: "g", İ: "i", I: "i", Ö: "o", Ş: "s", Ü: "u",
  };
  return label
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

// Aynı slug zaten varsa sonuna -2, -3 … ekler.
function uniqueClusterId(base: string): string {
  const seed = base || "kategori";
  let candidate = seed;
  let n = 2;
  while (getCluster(candidate)) {
    candidate = `${seed}-${n}`;
    n += 1;
  }
  return candidate;
}

export function createCluster(label: string): string {
  const id = uniqueClusterId(slugifyCluster(label));
  const { maxOrder } = plainOne<{ maxOrder: number | null }>(
    getDb().prepare("SELECT MAX(sort_order) AS maxOrder FROM clusters").get(),
  )!;
  getDb()
    .prepare("INSERT INTO clusters (id, label, sort_order) VALUES (?, ?, ?)")
    .run(id, label, (maxOrder ?? 0) + 10);
  return id;
}

export function renameCluster(id: string, label: string): void {
  getDb().prepare("UPDATE clusters SET label = ? WHERE id = ?").run(label, id);
}

export function deleteCluster(id: string): void {
  getDb().prepare("DELETE FROM clusters WHERE id = ?").run(id);
}

export function countBrandsInCluster(id: string): number {
  const { n } = plainOne<{ n: number }>(
    getDb().prepare("SELECT COUNT(*) AS n FROM brands WHERE cluster = ?").get(id),
  )!;
  return n;
}

// Kategori id → etiket sözlüğü. Tabloda olmayan bir id ile karşılaşılırsa
// (kategori silinmiş, DB elle düzenlenmiş) id'nin kendisi etiket olarak
// kullanılabilsin diye çağıran taraf `?? id` yapmalı.
export function clusterLabelMap(): Record<string, string> {
  return Object.fromEntries(listClusters().map((c) => [c.id, c.label]));
}
