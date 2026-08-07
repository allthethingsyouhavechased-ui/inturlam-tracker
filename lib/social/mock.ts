import fs from "node:fs";
import type { FetchOptions, FetchResult, FetchedPost, SocialProvider } from "@/lib/social/types";

// Ağa çıkmadan tüm zinciri (çekme → kaydetme → sessizlik → bildirim → ekran)
// denemek için. `SOCIAL_PROVIDER=mock` + `SOCIAL_MOCK_FILE=...json` ile devreye
// girer; dosya beklenen biçimi tutar:
//
// { "posts": [{ "handle": "x", "postedAt": "2026-08-05T10:00:00Z", "externalId": "1" }],
//   "errorsByHandle": { "y": "Hesap özel" } }
//
// Gerçek sağlayıcıyı taklit ettiği için üretimde ASLA varsayılan olmamalı —
// bu yüzden dosya yoksa sessizce boş dönmek yerine hata veriyor.
export function createMockProvider(): SocialProvider {
  const filePath = process.env.SOCIAL_MOCK_FILE?.trim();

  return {
    name: "mock",
    async fetchRecentPosts(handles: string[], _options: FetchOptions): Promise<FetchResult> {
      void _options;
      if (!filePath) throw new Error("SOCIAL_MOCK_FILE tanımlı değil.");
      if (!fs.existsSync(filePath)) throw new Error(`Sahte veri dosyası yok: ${filePath}`);

      const raw = JSON.parse(fs.readFileSync(filePath, "utf-8")) as {
        posts?: Partial<FetchedPost>[];
        errorsByHandle?: Record<string, string>;
      };
      const wanted = new Set(handles.map((h) => h.toLowerCase()));

      const posts: FetchedPost[] = (raw.posts ?? [])
        .filter((post) => post.handle && wanted.has(post.handle.toLowerCase()))
        .map((post) => ({
          externalId: String(post.externalId),
          handle: String(post.handle).toLowerCase(),
          postedAt: new Date(String(post.postedAt)).toISOString(),
          permalink: post.permalink ?? null,
          mediaType: post.mediaType ?? null,
          caption: post.caption ?? null,
        }));

      return { posts, errorsByHandle: raw.errorsByHandle ?? {} };
    },
  };
}
