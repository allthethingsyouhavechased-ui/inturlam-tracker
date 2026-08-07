// Sosyal medya veri kaynağının uygulamaya bakan yüzü. Sağlayıcı (Apify, resmi
// Meta API, elle içe aktarma…) buradaki sözleşmeyi karşıladığı sürece
// uygulamanın geri kalanı değişmez — sağlayıcılar kısa ömürlü olduğu için
// bu soyutlama isteğe bağlı değil, taşıyıcı unsur.

export interface FetchedPost {
  /** Sağlayıcının gönderi kimliği. Aynı gönderi tekrar geldiğinde yok sayılır. */
  externalId: string;
  /** Gönderinin sahibi (küçük harfe indirgenmiş kullanıcı adı). */
  handle: string;
  /** ISO 8601 UTC. */
  postedAt: string;
  permalink: string | null;
  mediaType: string | null;
  caption: string | null;
}

export interface FetchResult {
  posts: FetchedPost[];
  /**
   * Hesap bazında hata (özel hesap, silinmiş kullanıcı, sağlayıcı bloğu…).
   * Anahtar: küçük harfli handle. Boş dönmek ile hata almak arayüzde AYRI
   * gösterildiği için bu ayrım korunmalı.
   */
  errorsByHandle: Record<string, string>;
}

export interface FetchOptions {
  /** Hesap başına kaç gönderi çekilsin (son paylaşım tarihini bulmak için 2-3 yeter). */
  perAccount: number;
  /** Sağlayıcı çağrısı için toplam üst sınır (ms). */
  timeoutMs: number;
}

export interface SocialProvider {
  readonly name: string;
  fetchRecentPosts(handles: string[], options: FetchOptions): Promise<FetchResult>;
}
