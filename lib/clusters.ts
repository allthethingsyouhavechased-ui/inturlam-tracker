import { recordActivity } from "@/lib/activity";
import { NEW_CLUSTER_VALUE } from "@/lib/constants";
import { createCluster, getCluster, listClusters } from "@/lib/repositories/clusters";

// Etiketiyle bir kategoriyi garanti eder: aynı isimde varsa onun id'sini döner,
// yoksa oluşturur. Karşılaştırma Türkçe locale ile küçük harfe indirgenerek
// yapılıyor ("Kahve" ile "kahve" iki ayrı kategori olmasın diye).
export async function ensureCluster(label: string): Promise<string> {
  const key = label.toLocaleLowerCase("tr");
  const existing = listClusters().find(
    (c) => c.label.toLocaleLowerCase("tr") === key,
  );
  if (existing) return existing.id;

  const id = createCluster(label);
  await recordActivity({
    action: "cluster.create",
    entityType: "cluster",
    entityId: id,
    summary: `“${label}” kategorisini oluşturdu`,
  });
  return id;
}

// Marka formundaki kategori seçimini çözer. Kullanıcı "+ Yeni kategori" seçtiyse
// yanındaki metin kutusuna yazdığı etiketle kategoriyi açar; aksi halde seçilen
// id'nin gerçekten var olduğunu doğrular. Marka ekleme ve düzenleme action'ları
// aynı yolu kullansın diye ortak.
export async function resolveClusterFromForm(formData: FormData): Promise<string> {
  const raw = String(formData.get("cluster") ?? "").trim();

  if (raw === NEW_CLUSTER_VALUE) {
    const label = String(formData.get("newClusterLabel") ?? "").trim();
    if (!label) throw new Error("Yeni kategori adı zorunlu.");
    return ensureCluster(label);
  }

  if (!raw) throw new Error("Kategori seçilmeli.");
  if (!getCluster(raw)) throw new Error("Geçersiz kategori.");
  return raw;
}
