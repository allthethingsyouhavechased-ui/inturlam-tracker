import { createApifyProvider } from "@/lib/social/apify";
import { createMockProvider } from "@/lib/social/mock";
import type { SocialProvider } from "@/lib/social/types";

export type { FetchedPost, FetchResult, SocialProvider } from "@/lib/social/types";

// Kaç gün paylaşım olmayınca "sessiz" sayılır. Marka bazında ayrıştırmak
// gerekirse (haftada bir paylaşan marka ile günlük paylaşan aynı eşiği
// paylaşmasın) brands tablosuna nullable bir sütun eklenip burası varsayılan
// olarak bırakılabilir.
export const SOCIAL_SILENCE_DAYS = Number(process.env.SOCIAL_SILENCE_DAYS ?? 3);

/** Hesap başına kaç gönderi çekilsin — son paylaşım tarihi için 3 fazlasıyla yeter. */
export const SOCIAL_POSTS_PER_ACCOUNT = Number(process.env.SOCIAL_POSTS_PER_ACCOUNT ?? 3);

/** Bir taramanın toplam üst sınırı. */
export const SOCIAL_FETCH_TIMEOUT_MS = Number(process.env.SOCIAL_TIMEOUT_MS ?? 10 * 60_000);

export function resolveSocialProvider(): SocialProvider {
  const name = process.env.SOCIAL_PROVIDER?.trim().toLowerCase() || "apify";
  if (name === "mock") return createMockProvider();
  if (name === "apify") return createApifyProvider();
  throw new Error(`Bilinmeyen SOCIAL_PROVIDER: ${name} (beklenen: apify | mock)`);
}
