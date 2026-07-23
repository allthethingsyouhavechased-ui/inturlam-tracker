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
  const schemaSql = fs.readFileSync(SCHEMA_PATH, "utf-8");
  try {
    db.exec(schemaSql);
  } catch {
    // schema.sql, henüz migrate edilmemiş eski bir tabloya yeni bir sütun/indeks
    // varsayıyor olabilir (ör. yeni eklenen bir sütun üzerinde CREATE INDEX).
    // Migration'lar tabloyu düzeltir, aşağıda şema ikinci kez uygulanır — o
    // geçişte artık hata vermez. Önceki CREATE TABLE/INDEX ifadeleri bu satıra
    // kadar zaten no-op ya da başarılı şekilde uygulanmış olur.
  }
  migrateBrandsTableIfNeeded(db);
  migrateContentItemsTableIfNeeded(db);
  migrateTasksTableIfNeeded(db);
  db.exec(schemaSql);
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

// content_items tablosu Carousel/Kurumsal Kimlik türleri ve assignee_id'den önce
// kurulmuş olabilir — aynı "yeni tabloyu geçici isimle kur, veriyi kopyala, eskiyi
// sil, yeniyi doğru isme çevir" deseni (bkz. migrateBrandsTableIfNeeded). tasks
// tablosunun content_item_id FK'si etkilenmez çünkü content_items adı hiç
// değişmeden kalıyor.
function migrateContentItemsTableIfNeeded(db: DatabaseSync): void {
  const row = db
    .prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='content_items'`)
    .get() as { sql: string } | undefined;
  if (!row || row.sql.includes("'Carousel'")) return;

  db.exec("PRAGMA foreign_keys = OFF");
  try {
    db.exec("BEGIN");
    db.exec(`
      CREATE TABLE content_items_new_migration (
        id          TEXT PRIMARY KEY,
        brand_id    TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
        title       TEXT NOT NULL,
        type        TEXT NOT NULL CHECK (type IN ('Reel','Foto','Kampanya','Video','Carousel','KurumsalKimlik','Diger')),
        target_date TEXT,
        status      TEXT NOT NULL DEFAULT 'Planlandi' CHECK (status IN ('Planlandi','Uretimde','Tamamlandi','IptalEdildi')),
        assignee_id TEXT REFERENCES people(id) ON DELETE SET NULL,
        created_at  TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    db.exec(`
      INSERT INTO content_items_new_migration
        (id, brand_id, title, type, target_date, status, created_at, updated_at)
      SELECT id, brand_id, title, type, target_date, status, created_at, updated_at
      FROM content_items
    `);
    db.exec(`DROP TABLE content_items`);
    db.exec(`ALTER TABLE content_items_new_migration RENAME TO content_items`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_content_items_brand ON content_items(brand_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_content_items_assignee ON content_items(assignee_id)`);
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  } finally {
    db.exec("PRAGMA foreign_keys = ON");
  }
}

// tasks tablosu priority sütunundan önce kurulmuş olabilir — aynı "yeni tabloyu
// geçici isimle kur, veriyi kopyala (priority='Normal' ile), eskiyi sil, yeniyi
// doğru isme çevir" deseni (bkz. migrateBrandsTableIfNeeded). comments tablosunun
// task_id FK'si etkilenmez çünkü tasks adı hiç değişmeden kalıyor.
function migrateTasksTableIfNeeded(db: DatabaseSync): void {
  const row = db
    .prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='tasks'`)
    .get() as { sql: string } | undefined;
  if (!row || row.sql.includes("'Acil'")) return;

  db.exec("PRAGMA foreign_keys = OFF");
  try {
    db.exec("BEGIN");
    db.exec(`
      CREATE TABLE tasks_new_migration (
        id              TEXT PRIMARY KEY,
        content_item_id TEXT NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
        title           TEXT NOT NULL,
        status          TEXT NOT NULL DEFAULT 'Beklemede' CHECK (status IN ('Beklemede','DevamEdiyor','Incelemede','Onaylandi','Yayinlandi')),
        priority        TEXT NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Dusuk','Normal','Yuksek','Acil')),
        assignee_id     TEXT REFERENCES people(id) ON DELETE SET NULL,
        due_date        TEXT,
        notes           TEXT,
        created_at      TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    db.exec(`
      INSERT INTO tasks_new_migration
        (id, content_item_id, title, status, priority, assignee_id, due_date, notes, created_at, updated_at)
      SELECT id, content_item_id, title, status, 'Normal', assignee_id, due_date, notes, created_at, updated_at
      FROM tasks
    `);
    db.exec(`DROP TABLE tasks`);
    db.exec(`ALTER TABLE tasks_new_migration RENAME TO tasks`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_content_item ON tasks(content_item_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)`);
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
