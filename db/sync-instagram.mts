// Markaların Instagram hesaplarını tarar, yeni paylaşımları kaydeder ve uzun
// süredir sessiz kalan hesaplar için yöneticilere bildirim üretir.
//
// Çalıştırma:  npm run social:sync
// Zamanlama :  Windows Görev Zamanlayıcı (kurulum README'de) — günde 2-3 kez.
//
// Sunucudan BAĞIMSIZ bir süreçtir: `next start` çalışırken de çalışabilir,
// aynı SQLite dosyasını WAL modunda paylaşırlar. Uzun süren ağ işini sunucu
// sürecine sokmamak bilinçli — bir sağlayıcı takıldığında uygulama yavaşlamaz.
//
// Ayarlar (.env.local):
//   APIFY_TOKEN=...              (zorunlu, SOCIAL_PROVIDER=apify iken)
//   SOCIAL_PROVIDER=apify|mock   (varsayılan: apify)
//   SOCIAL_SILENCE_DAYS=7        kaç günden sonra "sessiz" sayılsın
//   SOCIAL_REALERT_DAYS=3        aynı marka için bildirim tekrarı aralığı
//   SOCIAL_POSTS_PER_ACCOUNT=3   hesap başına çekilecek gönderi sayısı

// NOT: bu script `@/...` alias'ı kullanan lib modüllerini çekiyor, o yüzden
// düz `node db/sync-instagram.mts` ile ÇALIŞMAZ — npm script'i alias çözücüyü
// yüklüyor (`node --import ./scripts/register.mjs ...`). Görev Zamanlayıcı'ya
// da komutu `npm run social:sync` olarak vermek gerekir.
import { runInstagramSync } from "@/lib/social/sync";

// Script Next.js dışında çalıştığı için .env.local kendiliğinden yüklenmez.
// Node 24'ün yerleşik yükleyicisi kullanılıyor; dosya yoksa sessizce geçilir
// (ortam değişkenleri Görev Zamanlayıcı üzerinden de verilebilir).
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // yok / okunamıyor — sorun değil
  }
}

const startedAt = Date.now();
const summary = await runInstagramSync((message) => console.log(message));
const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);

console.log(
  `\nÖzet (${seconds} sn): ${summary.accounts} hesap · ${summary.fetchedPosts} gönderi görüldü · ` +
    `${summary.newPosts} yeni · ${summary.accountErrors} hesap hatası · ` +
    `${summary.silent.length} sessiz · ${summary.notified} bildirim`,
);

// Görev Zamanlayıcı "son çalıştırma sonucu" sütununda başarısızlığı görebilsin
// diye çıkış kodu anlamlı: sessiz hesap olması hata DEĞİL, taramanın kendisinin
// başarısız olması hatadır.
if (summary.failed) {
  console.error(`Hata: ${summary.error}`);
  process.exit(1);
}
