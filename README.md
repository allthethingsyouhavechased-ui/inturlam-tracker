# İNTURLAM · İş Takip

İNTURLAM'ın 17 markası için basit, ftrack mantığında bir içerik & görev takip aracı.
Yapı: **Marka → İçerik/Proje → Görev (+ yorum)**. Şifre yok; açılışta "sen kimsin"
seçimi cookie'de tutulur. Veri tek bir yerel dosyada (`data/inturlam.db`, SQLite).

## Gereksinimler

- Node.js 20.9+ (24 önerilir — `node:sqlite` ve native TypeScript için). Kurulu.
- Ekstra bir veritabanı/servis **gerekmez**. SQLite Node'un içinde geliyor.

## İlk kurulum

```powershell
npm install
npm run db:seed   # 17 markayı ve kişileri veritabanına yazar
```

### Kişileri düzenleme

Kullanacak kişileri `db/seed.mts` içindeki `PEOPLE` listesinde düzenle
(`id` sabit kalsın, `name`'i değiştir), sonra tekrar çalıştır:

```powershell
npm run db:seed
```

Seed tekrar çalıştırılabilir: marka/kişi isimlerini günceller, mevcut görev/yorumlara
dokunmaz. (Aynı şekilde marka adlarını da `BRANDS` listesinden düzeltebilirsin.)

## Geliştirme (tek makinede)

```powershell
npm run dev
```

→ http://localhost:3000

## Ofiste kullanım (LAN'da paylaşma)

```powershell
npm run build
npm run start     # 0.0.0.0:3000 — ağdaki diğer bilgisayarlar erişebilir
```

1. Uygulamayı çalıştıran bilgisayarın IP'sini bul:

   ```powershell
   ipconfig    # "IPv4 Address" satırı, örn. 192.168.1.20
   ```

2. Meslektaşların tarayıcıdan `http://<O_IP>:3000` adresine girsin.

### Windows Firewall (bir kez)

- `npm run start` ilk çalıştığında Windows "izin ver" penceresi açarsa
  **Özel ağlar**'ı işaretleyip izin ver.
- Pencere çıkmazsa, yönetici PowerShell'de:

  ```powershell
  New-NetFirewallRule -DisplayName "Inturlam Tracker 3000" -Direction Inbound `
    -Protocol TCP -LocalPort 3000 -Action Allow -Profile Private
  ```

- Ofis ağın **Public** görünüyorsa Windows gelen bağlantıları engeller. Kontrol:

  ```powershell
  Get-NetConnectionProfile | Select-Object Name, NetworkCategory
  ```

  Güvenilir ofis ağıysa profili **Ayarlar → Ağ ve Internet → (ağ) → Özel**'e çevir,
  ya da yukarıdaki kurala `-Profile Private,Public` ekle.

## Yedekleme

Tüm veri tek dosyada: `data/inturlam.db`. Yedek almak için bu dosyayı kopyalaman
yeterli (sunucu kapalıyken `.db-wal`/`.db-shm` dosyalarıyla birlikte kopyala).

## Mimari notlar

Detaylı mimari kararlar ve tuzaklar için `CLAUDE.md` dosyasına bak.
