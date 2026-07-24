import { getDb, plainList, plainOne } from "@/lib/db/client";
import type { Brand, BrandAudit, BrandRelationView, BrandWithCount, Cluster } from "@/lib/types";

export function listBrands(): Brand[] {
  return plainList<Brand>(
    getDb()
      .prepare("SELECT * FROM brands WHERE archived = 0 ORDER BY sort_order, name")
      .all(),
  );
}

export function listArchivedBrands(): Brand[] {
  return plainList<Brand>(
    getDb()
      .prepare("SELECT * FROM brands WHERE archived = 1 ORDER BY name")
      .all(),
  );
}

export function createBrand(input: {
  name: string;
  cluster: Cluster;
  instagramHandle: string | null;
}): string {
  const id = crypto.randomUUID();
  const { maxOrder } = plainOne<{ maxOrder: number | null }>(
    getDb().prepare("SELECT MAX(sort_order) AS maxOrder FROM brands").get(),
  )!;
  getDb()
    .prepare(
      "INSERT INTO brands (id, name, cluster, sort_order, instagram_handle) VALUES (?, ?, ?, ?, ?)",
    )
    .run(id, input.name, input.cluster, (maxOrder ?? 0) + 10, input.instagramHandle);
  return id;
}

export function updateBrand(input: {
  id: string;
  name: string;
  cluster: Cluster;
  instagramHandle: string | null;
}): void {
  getDb()
    .prepare("UPDATE brands SET name = ?, cluster = ?, instagram_handle = ? WHERE id = ?")
    .run(input.name, input.cluster, input.instagramHandle, input.id);
}

export function setBrandArchived(id: string, archived: boolean): void {
  getDb()
    .prepare("UPDATE brands SET archived = ? WHERE id = ?")
    .run(archived ? 1 : 0, id);
}

export function listBrandsWithOpenCounts(): BrandWithCount[] {
  return plainList<BrandWithCount>(
    getDb()
      .prepare(
        `SELECT b.*, COUNT(t.id) AS open_count
         FROM brands b
         LEFT JOIN content_items ci ON ci.brand_id = b.id
         LEFT JOIN tasks t ON t.content_item_id = ci.id AND t.status != 'Yayinlandi'
         WHERE b.archived = 0
         GROUP BY b.id
         ORDER BY b.sort_order, b.name`,
      )
      .all(),
  );
}

export function getBrand(id: string): Brand | undefined {
  return plainOne<Brand>(
    getDb().prepare("SELECT * FROM brands WHERE id = ?").get(id),
  );
}

// Hangi taraf eşleşirse eşleşsin, sonuç hep "karşı marka"nın bilgisini taşır —
// bir ilişki her iki markanın sayfasında da doğru yönde görünsün diye.
export function listBrandRelations(brandId: string): BrandRelationView[] {
  return plainList<BrandRelationView>(
    getDb()
      .prepare(
        `SELECT
           r.id,
           r.relation_type,
           r.risk_level,
           r.note,
           CASE WHEN r.brand_id = ? THEN r.related_brand_id ELSE r.brand_id END AS related_brand_id,
           ob.name AS related_brand_name,
           ob.cluster AS related_brand_cluster,
           ob.logo_path AS related_brand_logo_path
         FROM brand_relations r
         JOIN brands ob ON ob.id = CASE WHEN r.brand_id = ? THEN r.related_brand_id ELSE r.brand_id END
         WHERE r.brand_id = ? OR r.related_brand_id = ?
         ORDER BY ob.name`,
      )
      .all(brandId, brandId, brandId, brandId),
  );
}

export function getBrandAudit(brandId: string): BrandAudit | undefined {
  return plainOne<BrandAudit>(
    getDb().prepare("SELECT * FROM brand_audits WHERE brand_id = ?").get(brandId),
  );
}
