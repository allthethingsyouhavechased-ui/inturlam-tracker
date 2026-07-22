@AGENTS.md

# İNTURLAM İş Takip — proje notları

İNTURLAM'ın 19 markası için içerik & görev takip aracı + marka araştırma verisi.
Marka → İçerik → Görev (+yorum). Her markanın ayrıca Instagram araştırma verisi
(takipçi, performans, bulgular, tam denetim metni, diğer markalarla ilişkisi) var.
İç araç, LAN'da çalışır, kimlik doğrulama yok.

## Stack

- Next.js 16 (App Router, Turbopack, Server Actions) + React 19 + Tailwind v4.
- Veritabanı: Node'un yerleşik **`node:sqlite`**'ı (harici paket/derleme yok). Tek dosya: `data/inturlam.db`.
- Tarih: `date-fns` (+ `tr` locale).

## Katmanlar

- `lib/db/client.ts` — `getDb()` singleton (globalThis, WAL + FK pragmas). Şemayı `lib/db/schema.sql`'den okur,
  ardından `migrateBrandsTableIfNeeded()` çalışır (aşağıya bak).
- `lib/repositories/*` — tüm SQL burada (senkron, prepared statements). `brands.ts`'te
  `listBrandRelations()` (karşı markanın bilgisini normalize eder) ve `getBrandAudit()` da var.
- `lib/actions/*` — `"use server"` mutasyonları; repo çağır + `revalidatePath("/", "layout")`.
- `lib/identity.ts` — cookie'den (`inturlam_pid`) aktif kişiyi okur. `lib/actions/identity.ts` cookie'yi yazar.
- Sayfalar `app/`, client component'ler `components/`.
- Seed: `db/seed.mts` (`npm run db:seed`) — 19 marka + kişiler + `brand_relations` + vault'taki
  tam denetim metinleri (`brand_audits`). Kişileri/marka adlarını buradan düzenle. `getDb()`'yi
  `lib/db/client.ts`'den import ediyor (bkz. "Node native TS import" tuzağı aşağıda) — kendi
  bağlantısını açmıyor, tek bootstrap noktası.

## Kritik tuzaklar (bunlara dikkat)

- **null-prototype satırlar:** `node:sqlite` sorgu sonuçları null-proto obje döner; React bunları
  Server→Client component'e **geçiremez** (500 hatası). Repository'lerde her okuma
  `plainList<T>()` / `plainOne<T>()` (client.ts) ile düz objeye çevrilmeli. Yeni repo fonksiyonu
  yazarken bunu unutma.
- **force-dynamic:** DB okuyan her sayfada `export const dynamic = "force-dynamic"` var — yoksa
  build sırasında statik snapshot alınıp bayat veri servis edilir. (Layout `cookies()` okuduğu
  için zaten dinamik ama açıkça belirtiliyor.) `cacheComponents` KAPALI, bilinçli.
- **async params:** Next 16'da `params` bir Promise → `const { x } = await params`.
- **LAN:** `npm run start` → `next start -H 0.0.0.0 -p 3000`. Firewall notu README'de.
- **`ALTER TABLE ... RENAME` FK'leri kırar:** SQLite bir tabloyu yeniden adlandırınca, ona referans
  veren diğer tabloların FK metnini otomatik yeni isme günceller. Bir tabloyu CHECK kısıtlaması
  gibi bir nedenle yeniden kurman gerekirse ESKİ tabloyu asla rename etme — YENİ tabloyu geçici
  isimle kur, veriyi kopyala, eskiyi sil, yeniyi doğru isme çevir (bkz. `migrateBrandsTableIfNeeded`
  içindeki `brands_new_migration` deseni). Tersi (önce eskiyi rename) diğer tabloların FK'lerini
  var olmayan bir tabloya işaret eder hale getirir — sessizce, ta ki o tabloya dokunulana kadar.
- **Node native TS import + tsc:** `db/seed.mts` artık `lib/db/client.ts`'i relative path + açık
  `.ts` uzantısıyla import ediyor (`../lib/db/client.ts`) — Node'un native TypeScript
  çalıştırıcısı bunu gerektiriyor. Ama `tsc` bu uzantıyı varsayılan olarak reddeder; bu yüzden
  `tsconfig.json`'da `allowImportingTsExtensions: true` var (yalnızca `noEmit: true` ile
  birlikte kullanılabilir, bizde zaten öyle).
- **Migration DDL + dev sunucusu:** `npm run db:seed` şema değiştiren bir migration tetikleyebilir
  (`migrateBrandsTableIfNeeded`). Dev sunucusu (`npm run dev`) aynı `data/inturlam.db` dosyasını
  açık tutarken seed'i çalıştırmak kilit çakışmasına yol açabilir — önce dev sunucusunu durdur,
  seed'i çalıştır, sonra tekrar başlat.

## Genişletirken

Yeni alan/özellik: `schema.sql` (CREATE TABLE IF NOT EXISTS) → `types.ts` → repo → action → sayfa.
Şema mevcut DB'ye `getDb()` her açılışta `IF NOT EXISTS` ile uygulanır; tablo ekleme güvenli.
Var olan bir tabloya sütun eklemek veya CHECK kısıtlamasını genişletmek için `client.ts`'teki
migration deseni (yukarı bak) örnek alınarak yeni bir migration fonksiyonu eklenmeli — hâlâ
genel bir migration sistemi yok, her değişiklik kendi idempotent fonksiyonunu yazıyor.
