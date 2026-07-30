// Görevleri ve operasyon geçmişini temizler; marka, kişi, içerik ve şablonları korur.
//
// Önce:
//   npm run db:clear-work
// Gerçek silme:
//   npm run db:clear-work -- --force
//
// --force olmadan yalnızca silinecek kayıt sayılarını gösterir. Gerçek silmeden
// hemen önce db/backup.mts çalışır; böylece işlem geri alınabilir.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const DB_PATH =
  process.env.INTURLAM_DB_PATH ?? path.join(process.cwd(), "data", "inturlam.db");
const UPLOADS_ROOT = path.resolve(process.cwd(), "public", "uploads");
const FORCE = process.argv.includes("--force");

type CountSnapshot = {
  brands: number;
  people: number;
  contentItems: number;
  tasks: number;
  statusEvents: number;
  comments: number;
  taskAttachments: number;
  commentAttachments: number;
  activity: number;
  notifications: number;
  templates: number;
  activeWorkSelections: number;
};

function scalar(db: DatabaseSync, sql: string): number {
  return Number((db.prepare(sql).get() as { count: number }).count);
}

function counts(db: DatabaseSync): CountSnapshot {
  return {
    brands: scalar(db, "SELECT COUNT(*) AS count FROM brands"),
    people: scalar(db, "SELECT COUNT(*) AS count FROM people"),
    contentItems: scalar(db, "SELECT COUNT(*) AS count FROM content_items"),
    tasks: scalar(db, "SELECT COUNT(*) AS count FROM tasks"),
    statusEvents: scalar(db, "SELECT COUNT(*) AS count FROM task_status_events"),
    comments: scalar(db, "SELECT COUNT(*) AS count FROM comments"),
    taskAttachments: scalar(db, "SELECT COUNT(*) AS count FROM task_attachments"),
    commentAttachments: scalar(
      db,
      "SELECT COUNT(*) AS count FROM comment_attachments",
    ),
    activity: scalar(db, "SELECT COUNT(*) AS count FROM activity_log"),
    notifications: scalar(db, "SELECT COUNT(*) AS count FROM notifications"),
    templates: scalar(db, "SELECT COUNT(*) AS count FROM task_templates"),
    activeWorkSelections: scalar(
      db,
      "SELECT COUNT(*) AS count FROM person_active_work",
    ),
  };
}

function uploadAbsolutePath(filePath: string): string {
  const normalized = filePath.replace(/^[/\\]+/, "").replaceAll("/", path.sep);
  const absolute = path.resolve(process.cwd(), "public", normalized);
  if (absolute !== UPLOADS_ROOT && !absolute.startsWith(`${UPLOADS_ROOT}${path.sep}`)) {
    throw new Error(`Güvensiz ek dosya yolu; işlem durduruldu: ${filePath}`);
  }
  return absolute;
}

function preservedDataMatches(before: CountSnapshot, after: CountSnapshot): boolean {
  return (
    before.brands === after.brands &&
    before.people === after.people &&
    before.contentItems === after.contentItems &&
    before.templates === after.templates &&
    before.activeWorkSelections === after.activeWorkSelections
  );
}

if (!fs.existsSync(DB_PATH)) {
  console.error(`Veritabanı bulunamadı: ${DB_PATH}`);
  process.exit(1);
}

const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA foreign_keys = ON");

const before = counts(db);
const attachmentPaths = (
  db
    .prepare(
      `SELECT file_path FROM task_attachments
       UNION
       SELECT ca.file_path
       FROM comment_attachments ca
       JOIN comments c ON c.id = ca.comment_id`,
    )
    .all() as { file_path: string }[]
).map((row) => row.file_path);

// Yolları veritabanına dokunmadan önce doğrula.
const attachmentFiles = attachmentPaths.map(uploadAbsolutePath);

console.log("Silinecek kayıtlar:");
console.log(`- Görev: ${before.tasks}`);
console.log(`- Durum olayı: ${before.statusEvents}`);
console.log(`- Yorum: ${before.comments}`);
console.log(`- Aktivite: ${before.activity}`);
console.log(`- Bildirim: ${before.notifications}`);
console.log(`- Görev/yorum eki: ${attachmentFiles.length}`);
console.log(
  `Korunacak: ${before.brands} marka, ${before.people} kişi, ` +
    `${before.contentItems} içerik/proje, ${before.templates} şablon.`,
);

if (!FORCE) {
  console.log("\nHenüz hiçbir şey silinmedi.");
  console.log("Onaylı temizleme: npm run db:clear-work -- --force");
  db.close();
  process.exit(0);
}

db.close();

const backup = spawnSync(process.execPath, [path.join(process.cwd(), "db", "backup.mts")], {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit",
});
if (backup.status !== 0) {
  console.error("Yedek alınamadığı için temizleme iptal edildi.");
  process.exit(1);
}

const writeDb = new DatabaseSync(DB_PATH);
writeDb.exec("PRAGMA foreign_keys = ON");
writeDb.exec("BEGIN IMMEDIATE");

let after: CountSnapshot;
try {
  writeDb.exec("DELETE FROM notifications");
  writeDb.exec("DELETE FROM activity_log");
  writeDb.exec("DELETE FROM tasks");
  after = counts(writeDb);

  const foreignKeyErrors = writeDb.prepare("PRAGMA foreign_key_check").all();
  const cleared =
    after.tasks === 0 &&
    after.statusEvents === 0 &&
    after.comments === 0 &&
    after.taskAttachments === 0 &&
    after.commentAttachments === 0 &&
    after.activity === 0 &&
    after.notifications === 0;

  if (!cleared || !preservedDataMatches(before, after) || foreignKeyErrors.length > 0) {
    throw new Error("Temizleme doğrulaması başarısız; işlem geri alındı.");
  }

  writeDb.exec("COMMIT");
} catch (error) {
  writeDb.exec("ROLLBACK");
  writeDb.close();
  throw error;
}

const integrity = (
  writeDb.prepare("PRAGMA integrity_check").get() as { integrity_check: string }
).integrity_check;
writeDb.close();

for (const file of attachmentFiles) {
  try {
    fs.unlinkSync(file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn(`! Ek dosya silinemedi: ${file}`);
    }
  }
}

console.log(
  `Temizleme tamamlandı: ${before.tasks} görev ve ${before.activity} aktivite silindi.`,
);
console.log(`Veritabanı bütünlüğü: ${integrity}`);
