// Tüm `date-fns` (+ `tr` locale) kullanımı bilinçli olarak bu dosyada
// toplanıyor — sayfalar/component'ler ham `format`/`parseISO` yerine buradaki
// hazır yardımcıları çağırır. Tek yerden Türkçe biçimlendirme/hafta başlangıcı
// (Pazartesi) tutarlılığı sağlanır.
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
} from "date-fns";
import { tr } from "date-fns/locale";

function toISODate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function todayISO(): string {
  return toISODate(new Date());
}

// N gün öncesinin tarihi. "Bu veri bayatladı mı?" kontrolleri için:
// `kayit.tarih < daysAgoISO(7)` → bir haftadan eski.
export function daysAgoISO(days: number): string {
  return toISODate(subDays(new Date(), days));
}

// Pazartesi–Pazar (dahil) aralığını 'YYYY-MM-DD' string olarak döner.
export function currentWeekRange(): { start: string; end: string } {
  const now = new Date();
  return {
    start: toISODate(startOfWeek(now, { weekStartsOn: 1 })),
    end: toISODate(endOfWeek(now, { weekStartsOn: 1 })),
  };
}

// Ayın 1'i–son günü (dahil) aralığını 'YYYY-MM-DD' string olarak döner.
export function currentMonthRange(): { start: string; end: string } {
  const now = new Date();
  return { start: toISODate(startOfMonth(now)), end: toISODate(endOfMonth(now)) };
}

// "/calendar" sayfasının ?month=YYYY-MM parametresini ayın 1'ine çevirir.
// Eksik/bozuk değerde (ör. elle düzenlenmiş URL, geçersiz ay 2026-13) sessizce
// `fallback`a (varsayılan bugün) düşer — geçersiz bir query string sayfayı
// 500'letmesin. `parseISO` ay/gün sınırlarını doğruluyor (Invalid Date → NaN).
export function monthParamToDate(month: string | undefined, fallback: Date = new Date()): Date {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const parsed = parseISO(`${month}-01`);
    if (!Number.isNaN(parsed.getTime())) return startOfMonth(parsed);
  }
  return startOfMonth(fallback);
}

// Bir Date'i ?month= query string değerine çevirir (monthParamToDate'in tersi).
export function monthParamISO(date: Date): string {
  return format(date, "yyyy-MM");
}

// Takvim sayfasındaki önceki/sonraki ay linkleri için ?month= değerini
// `delta` ay kaydırır (-1 önceki, 1 sonraki ay).
export function shiftMonthParam(month: string, delta: number): string {
  return monthParamISO(addMonths(monthParamToDate(month), delta));
}

// Takvim başlığı için "Temmuz 2026" gibi tam ay/yıl etiketi.
export function formatMonthLabel(date: Date): string {
  return format(date, "MMMM yyyy", { locale: tr });
}

// Takvim ızgarası başlığı için Pazartesi–Pazar kısa gün adları (tr locale).
// Hangi haftanın Pazartesi'sinden başlarsak başlayalım gün adları aynı
// döngüde olduğu için `new Date()` yalnızca bir çapa — sonuç her zaman aynı
// 7 etikettir; modül yüklenirken bir kez hesaplanır. date-fns kullanımı bu
// dosyada toplansın diye burada (bkz. dosyanın başındaki genel not).
export const WEEKDAY_LABELS: string[] = Array.from({ length: 7 }, (_, i) =>
  format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i), "EEE", { locale: tr }),
);

export interface CalendarGridDay {
  date: string;
  // Ay ızgarasının başında/sonunda önceki/sonraki aydan taşan dolgu günleri
  // için false — arayüz bunları soluk gösterir ama boş bırakmaz.
  inMonth: boolean;
}

// Takvim ızgarası: ayın 1'i–son günü, başta/sonda dolgu günleriyle tam
// haftalara (Pazartesi–Pazar, currentWeekRange ile aynı hafta başlangıcı)
// tamamlanmış hâlde düz bir liste. 7 sütunlu CSS grid zaten satır satır
// sardığı için burada ayrıca haftalara bölünmüyor.
export function calendarGridDays(monthDate: Date): CalendarGridDay[] {
  const monthIndex = startOfMonth(monthDate).getMonth();
  const gridStart = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
  const days: CalendarGridDay[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) {
    days.push({ date: toISODate(d), inMonth: d.getMonth() === monthIndex });
  }
  return days;
}

export function formatDateShort(iso: string | null): string {
  if (!iso) return "—";
  return format(parseISO(iso), "d MMM", { locale: tr });
}

export function formatDateLong(iso: string | null): string {
  if (!iso) return "Tarih yok";
  return format(parseISO(iso), "d MMMM yyyy", { locale: tr });
}

export function isOverdue(iso: string | null): boolean {
  if (!iso) return false;
  return iso < todayISO();
}

export function isDueToday(iso: string | null): boolean {
  if (!iso) return false;
  return iso === todayISO();
}

// SQLite datetime('now') UTC string ('YYYY-MM-DD HH:MM:SS') → yerel saat.
export function formatDateTime(sqliteUtc: string): string {
  const d = new Date(sqliteUtc.replace(" ", "T") + "Z");
  return format(d, "d MMM HH:mm", { locale: tr });
}
