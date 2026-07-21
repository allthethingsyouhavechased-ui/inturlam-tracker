import { endOfWeek, format, parseISO, startOfWeek } from "date-fns";
import { tr } from "date-fns/locale";

function toISODate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function todayISO(): string {
  return toISODate(new Date());
}

// Pazartesi–Pazar (dahil) aralığını 'YYYY-MM-DD' string olarak döner.
export function currentWeekRange(): { start: string; end: string } {
  const now = new Date();
  return {
    start: toISODate(startOfWeek(now, { weekStartsOn: 1 })),
    end: toISODate(endOfWeek(now, { weekStartsOn: 1 })),
  };
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
