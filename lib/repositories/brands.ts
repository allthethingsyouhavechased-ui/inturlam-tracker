import { getDb, plainList, plainOne } from "@/lib/db/client";
import type { Brand, BrandWithCount } from "@/lib/types";

export function listBrands(): Brand[] {
  return plainList<Brand>(
    getDb()
      .prepare("SELECT * FROM brands WHERE archived = 0 ORDER BY sort_order, name")
      .all(),
  );
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
