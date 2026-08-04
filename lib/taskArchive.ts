// "Yayınlandı" bir görev panodan ANINDA düşmez.
//
// Eskiden pano/liste sorguları `status != 'Yayinlandi'` diyordu; bir görevi
// yanlışlıkla yayınlandı işaretlemek onu ekrandan tamamen siliyor gibi
// görünüyordu ve geri almak zordu. Artık yayınlanan iş olduğu yerde kalır,
// yalnızca tamamlanmasının üzerinden ARCHIVE_AFTER_DAYS geçince arşive düşer.
//
// Arşiv = `tasks.archived_at` damgası. Kayıt SİLİNMEZ: raporlarda, takvimde ve
// "Arşivi göster" filtresinde okunmaya devam eder, tek tıkla geri alınabilir.

/** Yayınlanan bir görevin panoda kalacağı gün sayısı. */
export const ARCHIVE_AFTER_DAYS = 7;

// SQLite `datetime('now')` damgaları 'YYYY-MM-DD HH:MM:SS' (UTC). Karşılaştırma
// için Date'e çevirirken araya 'T' + 'Z' koymak şart, yoksa yerel saat sanılır.
function parseSqliteUtc(value: string): number {
  return Date.parse(`${value.slice(0, 19).replace(" ", "T")}Z`);
}

/**
 * Tamamlanmasının üzerinden kaç TAM gün geçtiği. `completedAt` okunamıyorsa
 * (elle düzenlenmiş DB, boş string) 0 döner — bilinmeyen bir damga yüzünden
 * bir iş erkenden arşivlenmesin.
 */
export function daysSinceCompletion(
  completedAt: string | null,
  now: Date = new Date(),
): number {
  if (!completedAt) return 0;
  const completed = parseSqliteUtc(completedAt);
  if (Number.isNaN(completed)) return 0;
  return Math.max(0, Math.floor((now.getTime() - completed) / 86_400_000));
}

/** Bu görev otomatik arşivlenmeli mi? (Yalnızca yayınlanmış işler arşivlenir.) */
export function shouldAutoArchive(
  task: { status: string; completed_at: string | null; archived_at: string | null },
  now: Date = new Date(),
  days: number = ARCHIVE_AFTER_DAYS,
): boolean {
  if (task.archived_at) return false;
  if (task.status !== "Yayinlandi") return false;
  if (!task.completed_at) return false;
  return daysSinceCompletion(task.completed_at, now) >= days;
}

/**
 * Arşive düşmesine kalan gün. 0 = bir sonraki süpürmede arşivlenecek.
 * Arayüzde "N gün sonra arşivlenecek" uyarısı için.
 */
export function daysUntilArchive(
  completedAt: string | null,
  now: Date = new Date(),
  days: number = ARCHIVE_AFTER_DAYS,
): number {
  return Math.max(0, days - daysSinceCompletion(completedAt, now));
}
