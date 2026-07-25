@AGENTS.md

# İNTURLAM İş Takip — proje notları

İNTURLAM'ın 19 markası için içerik & görev takip aracı + marka araştırma verisi.
Marka → İçerik → Görev (+yorum). Markalar kullanıcı tarafından yönetilen
kategorilere (`clusters` tablosu) ayrılır. Her markanın ayrıca Instagram araştırma verisi
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
- Yedekleme: `db/backup.mts` (`npm run db:backup`, `predev`/`prestart` ile otomatik) ve
  `db/restore.mts` (`npm run db:restore`). Yedek `VACUUM INTO` ile alınır — sunucu DB'yi açık
  tutarken bile tutarlı; dosyayı elle kopyalamak `.db-wal`'daki son yazmaları kaçırır. İkisi de
  `getDb()` KULLANMAZ, kendi salt-okunur bağlantısını açar (yedek alırken migration çalışmasın).
- Şablonlar: `task_templates` + `task_template_items` (`lib/repositories/templates.ts`).
  `applyTemplateToContent()` tek transaction'da her satır için görev açar; tarih `shiftDate()` ile
  içeriğin `target_date`'ine `due_offset_days` eklenerek bulunur (UTC, ay sınırı güvenli).
  Varsayılan 3 şablon `seedTaskTemplatesIfNeeded()` ile **yalnızca tablo boşken** yazılır —
  `DEFAULT_CLUSTERS`'ın `INSERT OR IGNORE` deseninden bilinçli olarak farklı: kullanıcı bir şablonu
  silince her sunucu açılışında geri gelmesin diye.
- Tekrar eden görev: `tasks.repeat_days`. `setTaskStatusAction` içinde durum `Yayinlandi` olunca
  `createNextOccurrence()` çağrılır; yeni görev `Beklemede` başladığı için dal tekrar tetiklenmez
  (sonsuz döngü yok). Yeni tarih **eski görevin `due_date`'ine** göre kayar, bugüne göre değil —
  geç kapatılan haftalık iş takvimi kaydırmasın.
- Migration'ı sunucuyu kapatmadan uygulama: `npm run db:migrate` (`db/migrate.mts`) sadece `getDb()`
  çağırır. Dev sunucusu DB'yi açık tutarken yeni tablo/sütun eklendiğinde onun eski bağlantısı
  tabloyu göremez ("no such table"); bu komut şemayı ayrı bir bağlantıdan uygular, SQLite değişikliği
  diğer bağlantılara yansıtır — sunucuyu yeniden başlatmaya gerek kalmaz.
- Demo veri: `db/seed-demo.mts` (`npm run db:seed:demo`) — uygulamayı elle gezerek test etmek için
  14 içerik + 41 görev + yorum + aktivite yazar. Tüm id'ler `demo-` ön ekli; script her çalıştığında
  önce bu kayıtları silip yeniden yazar (idempotent), `-- --clean` ile sadece siler. Gerçek veriye
  dokunmaz. Tarihler bugüne göre göreli üretilir, böylece "gecikmiş"/"bu hafta" panoları hep dolu.

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
  (`migrateBrandsTableIfNeeded`, `migrateContentItemsTableIfNeeded`). Dev sunucusu (`npm run dev`)
  aynı `data/inturlam.db` dosyasını açık tutarken seed'i çalıştırmak kilit çakışmasına yol
  açabilir — önce dev sunucusunu durdur, seed'i çalıştır, sonra tekrar başlat.
- **Kategoriler artık sabit değil:** `lib/constants.ts`'teki `CLUSTERS`/`CLUSTER_LABEL` kaldırıldı.
  Kategoriler `clusters` tablosunda; sunucu tarafında `listClusters()` / `clusterLabelMap()` /
  `groupBrandsByCluster()` (`lib/repositories/clusters.ts`) ile okunur, client component'lere prop
  olarak taşınır. `brands.cluster` ile `clusters.id` arasında **bilinçli olarak FK yok** — kategori
  silinince marka kaydı düşmesin diye. Bunun bedeli: "boş mu" kontrolü action'da elle yapılıyor
  (`deleteClusterAction`) ve gruplama fonksiyonu sahipsiz markaları "Kategorisiz" başlığında
  toplamak zorunda. Yeni bir yerde kategori etiketi gösterirken `?? UNKNOWN_CLUSTER_LABEL` yaz.
- **`migrateBrandsTableIfNeeded` artık iki taraflı korunmalı:** `brands.cluster` üzerindeki CHECK
  kısıtlaması `migrateBrandsDropClusterCheckIfNeeded` ile tamamen kaldırıldığı için, eski
  migration'ın guard'ı sadece `'emlak'` içeriyor mu diye bakamaz — CHECK hiç yoksa da erken dönmesi
  gerekir (`CLUSTER_CHECK_RE`), yoksa yalnızca 5 sütun kopyaladığı için geri kalan marka verisini
  siler. Aynı desende yeni bir brands migration'ı yazarsan bu guard zincirini gözden geçir.
- **`schema.sql`'in ilk uygulaması eski DB'de patlayabilir:** Yeni bir sütuna referans veren yeni
  bir `CREATE INDEX IF NOT EXISTS` eklersen (ör. `idx_content_items_assignee`), bu satır migration
  henüz çalışmadan, `schema.sql`'in İLK geçişinde (henüz eski yapıdaki tabloya karşı) çalışır ve
  "no such column" hatası verir — `CREATE TABLE IF NOT EXISTS` tablo zaten varsa no-op olur ama
  `CREATE INDEX IF NOT EXISTS` sadece o İSİMDE bir indeks zaten varsa no-op olur, sütunun var olup
  olmadığına bakmaz. Çözüm zaten `client.ts`'te: ilk `db.exec(schemaSql)` bir `try/catch` içinde
  (best-effort), sonra migration fonksiyonları çalışır, sonra `schemaSql` İKİNCİ kez uygulanır
  (bu sefer tablo doğru şekilde kurulmuş olduğu için hatasız geçer). Yeni bir migration eklerken
  bu deseni boz­ma — özellikle yeni sütun/CHECK içeren yeni bir index/constraint eklediğinde.

## Genişletirken

Yeni alan/özellik: `schema.sql` (CREATE TABLE IF NOT EXISTS) → `types.ts` → repo → action → sayfa.
Şema mevcut DB'ye `getDb()` her açılışta `IF NOT EXISTS` ile uygulanır; tablo ekleme güvenli.
Var olan bir tabloya sütun eklemek veya CHECK kısıtlamasını genişletmek için `client.ts`'teki
migration deseni (yukarı bak) örnek alınarak yeni bir migration fonksiyonu eklenmeli — hâlâ
genel bir migration sistemi yok, her değişiklik kendi idempotent fonksiyonunu yazıyor.
