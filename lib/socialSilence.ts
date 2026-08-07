import type { BrandSocialRow } from "@/lib/types";

// Sessizlik kararının SAF tarafı: DB'ye ve ağa dokunmaz, bu yüzden test
// edilebilir. Karar tek bir yerde durmalı — senkron script'i (bildirim üretimi)
// ve ekranlar (rozet rengi) aynı sınıflandırmayı kullanır, yoksa panoda "yeşil"
// görünen bir hesap için bildirim düşer.

export type SocialHealth =
  | "ok" // eşiğin içinde paylaşım var
  | "silent" // eşik aşıldı, paylaşım yok
  | "unknown" // hiç gönderi görülmedi (hesap yeni eklendi ya da veri gelmiyor)
  | "error" // son taramada bu hesap için hata alındı
  | "never-checked"; // hiç taranmadı

export const SOCIAL_HEALTH_LABEL: Record<SocialHealth, string> = {
  ok: "Aktif",
  silent: "Sessiz",
  unknown: "Veri yok",
  error: "Hata",
  "never-checked": "Taranmadı",
};

/** İki ISO tarih arasındaki tam gün farkı. Saat/dakika yok sayılır. */
export function daysBetween(fromIso: string, toIso: string): number {
  const from = Date.parse(fromIso.slice(0, 10));
  const to = Date.parse(toIso.slice(0, 10));
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.round((to - from) / 86_400_000);
}

/**
 * Bir markanın sosyal durumu. Sıra önemli: son tarama HATA verdiyse elimizdeki
 * "son paylaşım" bilgisi bayat olabilir, o yüzden hata her şeyin önüne geçer —
 * "3 gündür sessiz" demek yerine "veriyi çekemiyoruz" demek dürüst olan.
 */
export function classifySocial(
  row: Pick<BrandSocialRow, "last_post_at" | "last_checked_at" | "last_status">,
  thresholdDays: number,
  todayIso: string,
): SocialHealth {
  if (!row.last_checked_at) return "never-checked";
  if (row.last_status === "error") return "error";
  if (!row.last_post_at) return "unknown";
  return daysBetween(row.last_post_at, todayIso) > thresholdDays ? "silent" : "ok";
}

/**
 * Bildirim üretilsin mi? Yalnızca gerçekten "sessiz" hesaplar için — veri
 * gelmeyen hesap için sessizlik bildirimi göndermek yanlış alarmdır (hesabın
 * paylaşım yapmadığını değil, bizim göremediğimizi bilir haldeyiz).
 *
 * `reAlertDays`: aynı marka için bildirim tekrarı arasındaki en az gün.
 * Sıfır/negatif verilirse her taramada tekrar bildirir.
 */
export function shouldAlertSilence(input: {
  health: SocialHealth;
  alertedAt: string | null;
  todayIso: string;
  reAlertDays: number;
}): boolean {
  if (input.health !== "silent") return false;
  if (!input.alertedAt) return true;
  return daysBetween(input.alertedAt, input.todayIso) >= input.reAlertDays;
}

/** Bildirim metni. Tek yerde dursun ki bildirim ile ekran aynı dili konuşsun. */
export function silenceSummary(brandName: string, days: number): string {
  return `${brandName} hesabında ${days} gündür yeni paylaşım yok.`;
}
