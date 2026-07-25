// Şemayı çalışan sunucuya dokunmadan uygular.
//
// `getDb()` bağlantı açarken migration'ları + schema.sql'i çalıştırıyor; bu
// script sadece onu bir kez tetikler. Dev sunucusu DB'yi açık tutarken şema
// eklendiğinde (yeni tablo/sütun) sunucunun eski bağlantısı tabloyu göremez —
// SQLite şema değişikliğini diğer bağlantılara yansıttığı için bu script'i
// çalıştırmak sunucuyu yeniden başlatmadan yeterli olur.
//
// Çalıştırma: npm run db:migrate

import { getDb } from "../lib/db/client.ts";

const db = getDb();
const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
  .all()
  .map((r) => (r as { name: string }).name);

console.log(`Şema güncel. ${tables.length} tablo:`);
console.log(tables.join(", "));
