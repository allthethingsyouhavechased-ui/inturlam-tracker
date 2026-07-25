# İNTURLAM · İş Takip

İNTURLAM'ın 19 markası için içerik & görev takip aracı + marka araştırma paneli —
ftrack mantığında ("Marka → İçerik/Proje → Görev") ama İNTURLAM'a özel, tek dosyalık,
kurulumu basit bir iç araç.

**Ne işe yarar:**
- **Görev takibi:** Her marka için içerik/proje planla (Reel, Foto, Kampanya…), altına
  görevler düş (brief, çekim, kurgu, onay, yayın), kime atandığını ve son tarihini
  işaretle, yorum bırak.
- **Marka araştırma paneli:** Her markanın Instagram verisi (takipçi, gönderi, medyan
  Reel izlenmesi, kapak testi sonucu), öne çıkan bulgu, ilk aksiyon önerisi, diğer
  markalarla ilişkisi (rakip/tedarikçi/marka ailesi vb.) ve tam 7 katmanlı denetim
  raporu — hepsi marka sayfasında, ayrı bir dosya açmaya gerek kalmadan.
- **"Panom" sayfası:** Herkes kendi açık görevlerini, gecikmişleri ve o hafta teslim
  olacakları tek ekranda görür — durumunu da göreve girmeden, doğrudan bu listeden
  değiştirebilir.

Şifre/hesap sistemi yok — açılışta "Sen kimsin?" ile isim seçilir, cookie'de hatırlanır.
Veri tek bir yerel dosyada tutulur (`data/inturlam.db`, SQLite) — ayrı bir veritabanı
sunucusu kurmaya gerek yok.

**Ofis içinde günlük kullanım için** (kurulum bilmeden, sadece "nasıl kullanırım")
→ **[KULLANIM-KILAVUZU.md](KULLANIM-KILAVUZU.md)** dosyasına bak. Aşağıdaki bölümler
kurulum/geliştirme/dağıtım içindir.

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
  Ekipteki 10 kişi (`db/seed.mts`'teki `PEOPLE` listesi) zaten seed'lenmiş durumda.
  Yeni biri katılırsa listeye ekleyip `npm run db:seed` çalıştırman yeterli.
- **Günlük akış:** ana sayfadan marka seç → içerik/proje seç → görev panosunda
  kendi görevini bul, durumunu ilerlet (Beklemede → Devam Ediyor → İncelemede →
  Onaylandı → Yayınlandı), gerekirse yorum/not bırak. "Panom" sekmesi herkese
  kendi açık görevlerini ve o hafta teslim olacakları özetler.
- **Yeni içerik/görev eklemek** için özel bir yetki yok — marka sayfasında
  "yeni içerik", içerik sayfasında "yeni görev" formu herkese açık.

Bu ilk sürüm; yarın birlikte denerken neyin eksik/yanlış geldiğini not al,
sonraki oturumda üzerine ekleriz.

## Görev şablonları ve tekrar eden görevler

**Şablonlar** (`/templates` — nav'daki "Şablonlar"): her içerikte tekrarlayan iş
akışını bir kere tanımlarsın, her yeni içerikte elle 5 görev yazmazsın.

- Her şablon satırı bir görev: başlık + öncelik + **gün kayması** + (isteğe bağlı)
  sabit atanan.
- **Gün kayması**, içeriğin *hedef tarihine* göre hesaplanır: `-6` → teslimden
  6 gün önce, `0` → teslim günü, `+7` → teslimden bir hafta sonra. İçeriğin hedef
  tarihi yoksa görevler tarihsiz açılır.
- Bir şablonu tek bir içerik türüne bağlayabilirsin (ör. "Reel akışı" → Reel);
  yeni içerik formundaki şablon listesi seçilen türe göre filtrelenir.
- Kurulumda üç şablon hazır gelir: **Reel akışı**, **Foto çekimi**, **Kampanya**.
  Silersen geri gelmez.
- Uygulama iki yerden: marka sayfasındaki "yeni içerik" formunun **Şablon**
  alanından (içerik açılır açılmaz görevler de açılır), ya da mevcut bir içeriğin
  sayfasındaki **"Şablondan görev ekle…"** kutusundan.

**Tekrar eden görevler:** görev detayında **Tekrar** seçimi (Yok / Haftalık /
2 haftada bir / Aylık). Görevi *Yayınlandı* yaptığında bir sonraki örneği otomatik
açılır — aynı başlık, atanan, öncelik ve not; durumu *Beklemede*.

Yeni teslim tarihi **eski görevin teslim tarihine** göre kayar, bugüne göre değil:
20 Temmuz teslimli haftalık bir işi 1 Ağustos'ta kapatırsan yenisi 27 Temmuz olur,
takvim kaymaz. (Teslim tarihi hiç yoksa bugünden itibaren hesaplanır.)

## Yedekleme

Tüm veri tek dosyada: `data/inturlam.db`, dosya ekleri `public/uploads/` altında.

```bash
npm run db:backup
```

`data/backup/<YYYYAAGG-SSDDss>/` altına veritabanının tutarlı bir anlık görüntüsünü
(`VACUUM INTO`) ve dosya eklerini kopyalar. **Sunucu açıkken de güvenle çalışır** —
dosyayı elle kopyalamak `.db-wal` içindeki son yazmaları kaçırabilir, bu komut kaçırmaz.

`npm run dev` ve `npm run start` bu komutu otomatik olarak önce çalıştırır
(`predev` / `prestart`), yani sunucuyu her açtığında bir yedek alınır.
Son 14 yedek saklanır, eskisi silinir.

İsteğe bağlı ikinci hedef (ör. ofis PC ile paylaşılan Drive klasörü):

```bash
INTURLAM_BACKUP_DIR="G:\Drive'ım\INTURLAM_YEDEK" npm run db:backup
# saklanacak yedek sayısı: INTURLAM_BACKUP_KEEP (varsayılan 14)
```

### Geri yükleme

```bash
npm run db:restore                                  # yedekleri listeler
npm run db:restore -- 20260725-164325 --force       # geri yükler
```

`--force` olmadan hiçbir şey yazmaz. Yazmadan önce yedeğin `integrity_check`'ini
doğrular ve mevcut veritabanını `data/backup/restore-oncesi-*` altına alır.
**Geri yüklemeden önce sunucuyu durdur** — açık bir bağlantı dosyanın değiştiğini
görmez ve yeni yedeğin üzerine eski sayfaları yazabilir.

## Mimari notlar

Detaylı mimari kararlar ve tuzaklar için `CLAUDE.md` dosyasına bak.
