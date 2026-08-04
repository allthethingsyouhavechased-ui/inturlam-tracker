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
- Görev arşivi: `tasks.archived_at` + `lib/taskArchive.ts`. "Yayınlandı" bir görev panodan
  ANINDA düşmez — `ARCHIVE_AFTER_DAYS` (7) gün sonra `sweepArchivablePublishedTasks()`
  damgalar. Süpürme cron değil: görev listeleyen `force-dynamic` sayfalar (`/`, `/tasks`,
  `/panom`, içerik detayı, rapor export'u) okumadan ÖNCE çağırır. Damga SİLME değil —
  rapor/takvim okumaya devam eder, `setTaskArchived(id, false)` geri alır. Yeni bir
  "yayınlananları da gösteren" sorgu yazarken `archived_at IS NULL` koşulunu EKLE
  (`NOT_ARCHIVED` sabiti); "açık iş" sorgularının buna ihtiyacı yok çünkü arşiv yalnızca
  yayınlanmış işlere konur. `applyTaskStatusChanges` HER durum değişikliğinde
  `archived_at`'i NULL'lar: arşivdeki iş yeniden açılınca görünmez kalmasın, yeniden
  yayınlanınca da hemen arşive düşmesin.
- Tekrar eden görev: `tasks.repeat_days`. `setTaskStatusAction` içinde durum `Yayinlandi` olunca
  `createNextOccurrence()` çağrılır; yeni görev `Beklemede` başladığı için dal tekrar tetiklenmez
  (sonsuz döngü yok). Yeni tarih **eski görevin `due_date`'ine** göre kayar, bugüne göre değil —
  geç kapatılan haftalık iş takvimi kaydırmasın.
- Migration'ı sunucuyu kapatmadan uygulama: `npm run db:migrate` (`db/migrate.mts`) sadece `getDb()`
  çağırır. Dev sunucusu DB'yi açık tutarken yeni tablo/sütun eklendiğinde onun eski bağlantısı
  tabloyu göremez ("no such table"); bu komut şemayı ayrı bir bağlantıdan uygular, SQLite değişikliği
  diğer bağlantılara yansıtır — sunucuyu yeniden başlatmaya gerek kalmaz.
- Departman: `people.department` (düz, nullable TEXT — CHECK/FK yok). Geçerli değerler
  `lib/departments.ts`'teki `DEPARTMENTS` id'leri; tanınmayan/boş değer arayüzde "Diğer"
  sayılır (`departmentKey()` / `departmentLabel()`). Kişileri gruplamak için
  `groupPeopleByDepartment()`. Departman GÖREVİN değil KİŞİNİN alanı: görev/rapor
  ekranlarındaki departman filtresi atanan üzerinden dolaylı çalışır, bu yüzden bir
  departman seçiliyken **atanmamış görevler listeden düşer**.
- Excel dökümü: `/reports/export` route handler → `lib/reportWorkbook.ts` (veri → sayfa) →
  `lib/xlsx.ts` (bağımlılıksız XLSX yazıcı, `node:zlib` ile elle ZIP). Rapor EKRANLARI
  yalnızca sayı gösteriyor; döküm ayrıca `listTaskDetailReport()` ile satır satır işleri
  taşır (ad, marka, KATEGORİ, içerik, sorumlu, tarihler). `lib/xlsx.ts` Server Action'dan
  değil route handler'dan çağrılır — `node:zlib` istemci paketine girmesin diye.
  Sayfa/hücre yapısı `tests/xlsx.test.ts`'te ZIP'i merkezi dizinden okuyarak (Excel'in
  izlediği yol) doğrulanıyor; offset hesabını değiştirirsen o test tutar.
- Raporlar iki kapsamda çalışır: `lib/repositories/reports.ts`'teki sayaç fonksiyonlarının
  hepsi isteğe bağlı bir `scope: PersonScope` (kişi id'si) parametresi alır. `null` →
  portföy geneli (`/reports`), id → tek kişi (`/reports/kisi/[personId]`). Aynı SQL'i
  ikinci kez yazma; yeni bir rapor sorgusu eklerken `scopeCondition()`/`scopeParams()`
  desenini kullan, yoksa kişi raporu sessizce tüm ekibin sayılarını gösterir.
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
- **Takvim (`/calendar`) ay değil, IZGARA aralığı çeker:** `listTasksDueInRange`'e verilen aralık
  görüntülenen ayın 1'i–sonu değil, `calendarGridDays()`'in ürettiği dolgu günleri dahil TAM ızgara
  (önceki/sonraki aydan taşan Pazartesi–Pazar) aralığıdır — yoksa ay başında/sonunda soluk gösterilen
  komşu ay günleri her zaman boş görünür, oysa o günlerde gerçek görev olabilir. "Bu ay boş mu"
  kontrolü (`hasTasksThisMonth`) ayrıca ayın kendisiyle sınırlanır, ızgara dolgusuyla değil — ikisini
  karıştırma. Aynı fonksiyon, haftalık panoyu besleyen `listTasksDueThisWeek`'in aksine
  `'Yayinlandi'` durumunu FİLTRELEMİYOR (bilinçli: geçmiş bir ay tamamlanmış işi de göstermeli) —
  "tutarlı olsun" diye o filtreyi buraya kopyalama.
- **`CalendarGrid`'de hücrenin tamamı değil yalnızca tarih numarası link'tir:** Her öncelik pill'i
  kendi görevine (`/tasks/[id]`) ayrıca linkli; hücrenin tamamını da (gün detayına gitmek için)
  tıklanabilir yapmak iç içe `<a>` üretir (geçersiz HTML). Gün detayına gitmenin tek yolu tarih
  numarası (`touch-target` ile büyütülmüş) ve taşma metni ("+N daha") — hücrenin geri kalanı `<div>`.
- **@mention eşleştirmede en uzun isim önce kazanır:** `lib/mentions.ts` aktif kişileri isim
  uzunluğuna göre AZALAN sırada dener ve her eşleşen `[start,end)` aralığını `claimed` listesine
  ekler; daha kısa bir isim (`Yunus`) aynı aralıkta tekrar eşleşmeye çalışırsa (`Yunus Emre`'nin
  içindeki "Yunus" öneki gibi) bu, `claimed` ile çakıştığı için sayılmaz. Sırayı isim uzunluğuna
  göre değil de kişi listesi sırasına göre denersen kısa isim uzun ismi böler, yanlış kişiye
  bildirim gider. Bildirim üretimi (`extractMentionedPeople`) ve yorum metnindeki vurgulama
  (`CommentItem`) AYNI `findMentionMatches`'ı çağırır — biri güncellenip diğeri unutulamaz.
- **SVG `<title>` içine TEK bir metin çocuğu koy:** `<title>{a}: {b} görev</title>` biçimi
  birden çok text node üretiyor; React bunları SSR çıktısında ayırıcı yorumlarla yazıp
  hydration'da eşleştiremiyor ve tüm ağaç istemcide baştan çiziliyor ("Hydration failed",
  `ReportVisuals.tsx`'teki `TrendChart`'ta bir süre sessizce yaşadı). Doğrusu tek bir
  template literal: `<title>{`${a}: ${b} görev`}</title>`. Grafik tooltip'i yazarken dikkat.
- **Departman geri doldurması bir kereliktir:** `migratePeopleDepartmentIfNeeded`
  (`lib/db/client.ts`) sütunu eklerken eski ilk-isim eşlemesinden (DONMUŞ
  `LEGACY_DEPARTMENT_FIRST_NAMES` listesi) departmanları yazar, ama guard "sütun var mı"
  diye baktığı için **ikinci açılışta hiç çalışmaz** — kullanıcı birinin departmanını
  arayüzden boşaltırsa geri gelmez, olması gereken de bu. Aynı sebeple `db/seed.mts`
  departmanı `COALESCE(people.department, excluded.department)` ile yazıyor: seed, elle
  yapılan departman değişikliğini ezmez. Bu iki yerden birini değiştirirken diğerini de gör.
- **Sunucu props'unu optimistic client state'e `useEffect` OLMADAN yansıt:** `NotificationBell`
  gelen `notifications`/`unreadCount` prop'larını yerel state'e kopyalayıp bir `useEffect` içinde
  senkronlamıyor (bu `react-hooks/set-state-in-effect`'e takılırdı, bkz. yukarıdaki Sidebar notu —
  aynı kural burada da geçerli). Bunun yerine yalnızca "bu oturumda okundu işaretlenen id'ler"
  kümesini tutuyor; ekrana çizilen liste ve rozet sayısı her render'da `props` ile bu küçük
  override kümesinden TÜRETİLİYOR. Sunucu verisi + iyimser tıklama gerektiren yeni bir bileşende
  bu deseni tercih et — prop'u state'e kopyalamak neredeyse hep bir senkronizasyon efekti gerektirir.

## Marka sayfası: kaldırılan araştırma verileri

Marka detayında eskiden "İlgili markalar" kartları, tam denetim raporunun markdown'ı, medyan
Reel izlenmesi ve kapak testi rozeti vardı — günlük iş takibinde kullanılmadıkları için arayüzden
kaldırıldı (2026-07-25). Kalan: takipçi + gönderi sayısı ve `key_finding` üzerinden gösterilen
kısa bilgilendirme metni.

**Veri silinmedi, sadece gösterilmiyor:** `brand_relations` / `brand_audits` tabloları ve
`brands.median_reel_views` / `cover_test_verdict` / `cover_test_note` / `first_action` sütunları
duruyor, `db/seed.mts` hâlâ vault'tan dolduruyor. `listBrandRelations()` ve `getBrandAudit()`
okuma yolu da yerinde ama artık ÇAĞRILMIYOR — geri istenirse birkaç satırlık iş. Buna bağlı
`react-markdown` ve `@tailwindcss/typography` şu an boşta; kaldırmadan önce raporun geri
gelmeyeceğinden emin ol. `updateBrand()` bu sütunları artık YAZMIYOR.

`brands.stats_updated_at`: takipçi/gönderi haftalık elle giriliyor; damga yalnızca sayılardan
biri gerçekten değiştiğinde bugüne çekilir (yalnızca adı düzeltip kaydetmek tazelemez, yoksa
"tazelenmeli" uyarısı yalan söyler). 7 günden eskiyse marka sayfasında uyarı çıkar.

## Tasarım kuralları (yeni ekran/bileşen yazarken)

- **Aksan rengi `brand-*`**, asla `indigo-*` değil. Skala `globals.css`'teki `@theme inline`'da;
  marka rengini değiştirmek 11 satır.
- **Metin kontrastı iki temada da ≥ 4.5:1 olmalı.** Pratikte ikili kural:
  soluk metin `text-zinc-500 dark:text-zinc-400`, kırmızı `text-rose-600 dark:text-rose-400`,
  aksan `text-brand-600 dark:text-brand-400`. Tek başına `text-zinc-500` koyu temada 3.67,
  tek başına `text-zinc-400` açık temada 2.8 — ikisi de kalır. `text-zinc-300` hiç kullanma.
  Rozetin kendi zemini varsa (`bg-black/5`) bir ton koyulaştır (`text-zinc-600`).
- **Odak halkası merkezi.** `globals.css`'te `:focus-visible` kuralı `@layer` dışında yazıldığı
  için Tailwind'in `focus:outline-none` utility'sini ezer — bileşene ayrıca `focus:ring-*`
  eklemeye gerek yok, `outline-none` yazmak da zararsız.
- **Grid çocuklarına `min-w-0`.** Grid hücrelerinin varsayılan `min-width: auto` değeri,
  `truncate`lı (nowrap) metnin ya da bir `<select>`'in en uzun seçeneğinin TAM genişliğini alt
  sınır kabul eder; hücre taşar ve telefonda sayfa yatay kayar. Kart/panel bir grid çocuğuysa
  `min-w-0` ekle (bkz. `app/page.tsx` TaskPanel, `components/TaskGridCard.tsx`).
- **Sidebar daraltması CSS'ten, React'ten değil.** Tercih `<html data-sidebar>` özniteliğinde ve
  layout'taki no-FOUC script'i onu ilk boyamadan önce yazıyor; genişliği `globals.css`'teki
  `.sidebar-panel` kuralı veriyor. React state'i olsaydı sayfa bir kare açık sidebar'la çizilirdi.
  `SidebarContext` bu yüzden `useSyncExternalStore` ile özniteliği okuyor (`useEffect` + `setState`
  fazladan render turu demek ve `react-hooks/set-state-in-effect` kuralına takılıyor).
- **Üst menü `md`nin altında gizli.** 7 bölüm linki dar ekrana sığmıyor; liste tek yerde
  (`lib/nav.ts`), masaüstünde `NavLinks`, mobilde off-canvas panelde `SidebarNavLinks`.
  Yeni sayfa eklerken `MAIN_NAV`'a yaz, iki yer birden güncellenir.
- **Küçük ikon butonlarına `touch-target`.** Görünümü değiştirmeden tıklama alanını mobilde
  44×44'e çıkarır (`globals.css`); `min-h-11` vermek satır yüksekliğini şişirirdi.
- **Hata mesajlarına `role="alert"`**, ikon-only butonlara `aria-label`, form gönderim
  butonları için `SubmitButton` (useFormStatus ile çift gönderimi engeller).
- Yarıçap hiyerarşisi: dış panel `rounded-xl`, iç kart `rounded-lg`, form/buton `rounded-md`,
  rozet/avatar `rounded-full`.

## Genişletirken

Yeni alan/özellik: `schema.sql` (CREATE TABLE IF NOT EXISTS) → `types.ts` → repo → action → sayfa.
Şema mevcut DB'ye `getDb()` her açılışta `IF NOT EXISTS` ile uygulanır; tablo ekleme güvenli.
Var olan bir tabloya sütun eklemek veya CHECK kısıtlamasını genişletmek için `client.ts`'teki
migration deseni (yukarı bak) örnek alınarak yeni bir migration fonksiyonu eklenmeli — hâlâ
genel bir migration sistemi yok, her değişiklik kendi idempotent fonksiyonunu yazıyor.
