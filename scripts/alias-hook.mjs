// Node için `@/...` import'larını çözen resolve hook'u.
//
// Neden gerekli: `lib/*` dosyaları birbirini `@/lib/...` diye import ediyor.
// Bu alias yalnızca bundler'ın (Next/Turbopack) ve tsconfig'in bildiği bir şey;
// dosyaları doğrudan Node ile çalıştıran testler ve CLI script'leri
// (db/sync-instagram.mts gibi) `ERR_MODULE_NOT_FOUND` alır.
// Bağımlılık eklemek (tsx, ts-node…) yerine Node'un kendi loader API'siyle
// çözüyoruz — proje "harici paket yok" çizgisini koruyor.
//
// Uzantı denemesi de burada: tsconfig `moduleResolution: bundler` olduğu için
// import'lar uzantısız yazılıyor, Node ise uzantı eklemez.

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const CANDIDATE_SUFFIXES = ["", ".ts", ".tsx", ".mts", ".js", ".mjs", "/index.ts"];

export async function resolve(specifier, context, nextResolve) {
  if (!specifier.startsWith("@/")) return nextResolve(specifier, context);

  const base = path.join(ROOT, specifier.slice(2));
  for (const suffix of CANDIDATE_SUFFIXES) {
    const candidate = base + suffix;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return nextResolve(pathToFileURL(candidate).href, context);
    }
  }
  // Bulunamadıysa varsayılan çözücüye bırak — hatayı o üretsin, biz yutmayalım.
  return nextResolve(specifier, context);
}
