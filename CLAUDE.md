@AGENTS.md

# İNTURLAM İş Takip — proje notları

İNTURLAM'ın 17 markası için içerik & görev takip aracı. Marka → İçerik → Görev (+yorum).
İç araç, LAN'da çalışır, kimlik doğrulama yok.

## Stack

- Next.js 16 (App Router, Turbopack, Server Actions) + React 19 + Tailwind v4.
- Veritabanı: Node'un yerleşik **`node:sqlite`**'ı (harici paket/derleme yok). Tek dosya: `data/inturlam.db`.
- Tarih: `date-fns` (+ `tr` locale).

## Katmanlar

- `lib/db/client.ts` — `getDb()` singleton (globalThis, WAL + FK pragmas). Şemayı `lib/db/schema.sql`'den okur.
- `lib/repositories/*` — tüm SQL burada (senkron, prepared statements).
- `lib/actions/*` — `"use server"` mutasyonları; repo çağır + `revalidatePath("/", "layout")`.
- `lib/identity.ts` — cookie'den (`inturlam_pid`) aktif kişiyi okur. `lib/actions/identity.ts` cookie'yi yazar.
- Sayfalar `app/`, client component'ler `components/`.
- Seed: `db/seed.mts` (`npm run db:seed`) — 17 marka + kişiler. Kişileri buradan düzenle.

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

## Genişletirken

Yeni alan/özellik: `schema.sql` (CREATE TABLE IF NOT EXISTS) → `types.ts` → repo → action → sayfa.
Şema mevcut DB'ye `getDb()` her açılışta `IF NOT EXISTS` ile uygulanır; tablo ekleme güvenli,
ama sütun ekleme için manuel `ALTER TABLE` migration gerekir (henüz migration sistemi yok).
