import { getDb, plainList } from "@/lib/db/client";
import type { PersonActiveWork } from "@/lib/types";

export function listActiveWorkSelections(): PersonActiveWork[] {
  return plainList<PersonActiveWork>(
    getDb()
      .prepare(
        `SELECT paw.person_id, paw.brand_id, b.name AS brand_name, paw.updated_at
           FROM person_active_work paw
           JOIN people p ON p.id = paw.person_id AND p.active = 1
           JOIN brands b ON b.id = paw.brand_id AND b.archived = 0
          ORDER BY p.name`,
      )
      .all(),
  );
}

export function setPersonActiveBrand(
  personId: string,
  brandId: string | null,
): void {
  const db = getDb();

  if (!brandId) {
    db.prepare("DELETE FROM person_active_work WHERE person_id = ?").run(personId);
    return;
  }

  const brand = db
    .prepare("SELECT 1 FROM brands WHERE id = ? AND archived = 0")
    .get(brandId);
  if (!brand) throw new Error("Seçilen marka bulunamadı veya arşivlenmiş.");

  db.prepare(
    `INSERT INTO person_active_work (person_id, brand_id, updated_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(person_id) DO UPDATE SET
       brand_id = excluded.brand_id,
       updated_at = excluded.updated_at`,
  ).run(personId, brandId);
}
