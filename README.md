# İNTURLAM · İş Takip

İNTURLAM'ın 19 markası için basit, ftrack mantığında bir içerik & görev takip aracı —
artık her markanın Instagram araştırma verisiyle (takipçi, performans, bulgular, tam
denetim raporu, diğer markalarla ilişkisi) zenginleştirilmiş marka profili de var.
Yapı: **Marka → İçerik/Proje → Görev (+ yorum)**. Şifre yok; açılışta "sen kimsin"
seçimi cookie'de tutulur. Veri tek bir yerel dosyada (`data/inturlam.db`, SQLite).

## Gereksinimler

- Node.js 20.9+ (24 önerilir — `node:sqlite` ve native TypeScript için). Kurulu.
- Ekstra bir veritabanı/servis **gerekmez**. SQLite Node'un içinde geliyor.

## İlk kurulum

```powershell
npm install
npm run db:seed   # 19 markayı, kişileri, marka ilişkilerini ve (varsa) tam denetim metinlerini yazar
```

Tam denetim metinleri (her markanın 7 katmanlı Instagram analizi) paylaşımlı Obsidian
vault'undan (`Obsidian Vault (Ofis PC)/İNTURLAM/Marka Denetimleri/`) okunur. O klasör bu
bilgisayarda bağlı değilse (ör. Drive bağlı değilse) seed yine çalışır, sadece marka
sayfalarındaki "Tam Denetim Raporu" bölümü boş kalır — takipçi/performans/bulgu gibi
temel veriler zaten `db/seed.mts`'e gömülü olduğu için etkilenmez.

### Kişileri düzenleme

Kullanacak kişileri `db/seed.mts` içindeki `PEOPLE` listesinde düzenle
(`id` sabit kalsın, `name`'i değiştir), sonra tekrar çalıştır:

```powershell
npm run db:seed
```

Seed tekrar çalıştırılabilir: marka/kişi isimlerini günceller, mevcut görev/yorumlara
dokunmaz. (Aynı şekilde marka adlarını da `BRANDS` listesinden düzeltebilirsin.)

## Ofis PC'sine taşıma (bu proje şu an başka bir bilgisayarda kuruldu)

Bu proje ev/başka bir bilgisayarda geliştirildi; ofis PC'sinde henüz yok. Kod zaten
bir git deposu (`git log` ile geçmişi görebilirsin). Ofis PC'sine taşımak için üç yol:

**A) USB / taşınabilir disk (en hızlı, hesap gerektirmez)**
1. Bu klasörü kopyala ama şunları **almadan**: `node_modules/`, `.next/`, `data/`
   (üçü de yeniden oluşur / kasıtlı olarak boş başlar).
2. Ofis PC'sinde Node.js kurulu değilse önce kur (bu makinede **v24.18.0** var,
   20.9+ herhangi bir sürüm çalışır — https://nodejs.org, LTS sürümü indir).
3. Kopyalanan klasörde: `npm install`, sonra `npm run db:seed`.

**B) GitHub (özel repo) — birden fazla makinede çalışmaya devam edeceksen önerilir**
1. github.com'da yeni bir **private** repo oluştur (ör. `inturlam-tracker`).
2. Bu makinede:
   ```powershell
   git remote add origin https://github.com/<kullanici-adin>/inturlam-tracker.git
   git push -u origin main
   ```
3. Ofis PC'sinde: `git clone <repo-url>`, sonra `npm install` ve `npm run db:seed`.
4. Bundan sonra değişiklikleri `git push` / `git pull` ile iki makine arasında taşırsın.

**C) Zaten paylaşılan bir bulut klasörün varsa (Drive/OneDrive)**
Projeyi (yine `node_modules`, `.next`, `data` hariç) sıkıştırıp o klasöre koy,
ofis PC'sinde aç, `npm install` + `npm run db:seed` çalıştır.

Hangisini seçersen seç, ofis PC'sindeki ilk kurulumdan sonra aşağıdaki
"Ofiste kullanım" adımları aynı.

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

## Ekip günlük nasıl kullanacak

- **Sunucuyu biri (muhtemelen sen) sabah bir kere başlatır** ve o bilgisayar gün
  boyu açık kalır: `npm run start`. Kapanırsa herkesin bağlantısı düşer, tekrar
  `npm run start` yeterli — veri kaybolmaz (SQLite dosyada duruyor).
- **Herkes kendi bilgisayarından/telefonundan** (aynı ofis Wi-Fi'ında) tarayıcıdan
  `http://<sunucu-IP>:3000` adresine girer. Bu adresi herkesin tarayıcısına
  yer imi (bookmark) olarak eklemesi işi kolaylaştırır.
- **İlk girişte** herkes sağ üstten "Sen kimsin?" deyip kendi adını seçer —
  bu seçim o tarayıcıda ~1 yıl hatırlanır (cookie), tekrar sormaz. Farklı bir
  cihaz/tarayıcıdan girerse tekrar seçmesi gerekir.
  **Önce `db/seed.mts`'teki placeholder isimleri ("Kişi 2", "Kişi 3") gerçek
  isimlerle değiştirip `npm run db:seed` çalıştırman gerekiyor** — yoksa
  arkadaşların kendi adını listede bulamaz.
- **Günlük akış:** ana sayfadan marka seç → içerik/proje seç → görev panosunda
  kendi görevini bul, durumunu ilerlet (Beklemede → Devam Ediyor → İncelemede →
  Onaylandı → Yayınlandı), gerekirse yorum/not bırak. "Panom" sekmesi herkese
  kendi açık görevlerini ve o hafta teslim olacakları özetler.
- **Yeni içerik/görev eklemek** için özel bir yetki yok — marka sayfasında
  "yeni içerik", içerik sayfasında "yeni görev" formu herkese açık.

Bu ilk sürüm; yarın birlikte denerken neyin eksik/yanlış geldiğini not al,
sonraki oturumda üzerine ekleriz.

## Yedekleme

Tüm veri tek dosyada: `data/inturlam.db`. Yedek almak için bu dosyayı kopyalaman
yeterli (sunucu kapalıyken `.db-wal`/`.db-shm` dosyalarıyla birlikte kopyala).

## Mimari notlar

Detaylı mimari kararlar ve tuzaklar için `CLAUDE.md` dosyasına bak.
