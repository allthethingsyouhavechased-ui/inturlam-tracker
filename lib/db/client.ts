import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

const DB_PATH = path.join(process.cwd(), "data", "inturlam.db");
const SCHEMA_PATH = path.join(process.cwd(), "lib", "db", "schema.sql");

declare global {
  // eslint-disable-next-line no-var
  var __inturlamDb: DatabaseSync | undefined;
}

function createConnection(): DatabaseSync {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(fs.readFileSync(SCHEMA_PATH, "utf-8"));
  migrateBrandsTableIfNeeded(db);
  return db;
}

// brands tablosu 19-marka/6-küme genişlemesinden önce kurulmuş olabilir — CHECK
// kısıtlaması SQLite'ta doğrudan ALTER edilemediği için tabloyu yeniden kurmak
// gerekiyor. ÖNEMLİ: SQLite `ALTER TABLE brands RENAME TO x` yaptığında diğer
// tabloların (content_items, brand_relations, brand_audits) FK referans metnini
// otomatik olarak "x"e günceller — bu yüzden ESKİ tabloyu yeniden adlandırmak
// yerine YENİ tabloyu geçici isimle kurup veriyi kopyalıyoruz, eskiyi siliyoruz,
// sonra yeniyi "brands"e çeviriyoruz. Böylece diğer tabloların FK metni hep
// "brands" olarak kalır, hiç bozulmaz. Idempotent: yeni şemayla kurulmuş bir
// DB'de no-op.
function migrateBrandsTableIfNeeded(db: DatabaseSync): void {
  const row = db
    .prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='brands'`)
    .get() as { sql: string } | undefined;
  if (!row || row.sql.includes("'emlak'")) return;

  db.exec("PRAGMA foreign_keys = OFF");
  try {
    db.exec("BEGIN");
    db.exec(`
      CREATE TABLE brands_new_migration (
        id         TEXT PRIMARY KEY,
        name       TEXT NOT NULL,
        cluster    TEXT NOT NULL CHECK (cluster IN ('balik-deniz','kahve-gida','b2b-yapi','hamam','emlak','tek')),
        sort_order INTEGER NOT NULL DEFAULT 0,
        archived   INTEGER NOT NULL DEFAULT 0,
        logo_path          TEXT,
        instagram_handle   TEXT,
        follower_count     INTEGER,
        post_count         INTEGER,
        median_reel_views  TEXT,
        cover_test_verdict TEXT CHECK (cover_test_verdict IN ('Gecti','Kismen','Basarisiz','Sinirda')),
        cover_test_note    TEXT,
        key_finding        TEXT,
        first_action       TEXT,
        tier               TEXT
      )
    `);
    db.exec(`
      INSERT INTO brands_new_migration (id, name, cluster, sort_order, archived)
      SELECT id, name, cluster, sort_order, archived FROM brands
    `);
    db.exec(`DROP TABLE brands`);
    db.exec(`ALTER TABLE brands_new_migration RENAME TO brands`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_brands_cluster ON brands(cluster)`);
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  } finally {
    db.exec("PRAGMA foreign_keys = ON");
  }
}

export function getDb(): DatabaseSync {
  if (!globalThis.__inturlamDb) {
    globalThis.__inturlamDb = createConnection();
  }
  return globalThis.__inturlamDb;
}

// node:sqlite satırları null-prototype obje döner; React bunları Client
// Component'lere geçiremiyor. Düz objeye çevirerek her yerde güvenli kılıyoruz.
export function plainList<T>(rows: unknown[]): T[] {
  return rows.map((r) => ({ ...(r as Record<string, unknown>) }) as T);
}

export function plainOne<T>(row: unknown): T | undefined {
  return row == null
    ? undefined
    : ({ ...(row as Record<string, unknown>) } as T);
}
