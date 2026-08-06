// Demo/test verisi: markalara gerçekçi içerik (proje) ve görev kayıtları açar.
// Uygulamayı elle gezerek test edebilmek için — gerçek iş verisi DEĞİL.
//
// Çalıştırma:  npm run db:seed:demo
// Temizleme:   npm run db:seed:demo -- --clean   (sadece siler, yeniden yazmaz)
//
// Tüm kayıtların id'si `demo-` ile başlar; script her çalıştığında önce bu
// kayıtları silip yeniden yazar (idempotent). Böylece gerçek verilere hiç
// dokunulmaz ve demo verisi tek komutla kaldırılabilir. Görevler/yorumlar
// content_items'a FK + ON DELETE CASCADE ile bağlı olduğu için içerikleri
// silmek alt kayıtları da düşürür.
//
// Tarihler bugüne göre GÖRELİ üretiliyor (gün ofseti) — script'i haftalar sonra
// tekrar çalıştırınca "gecikmiş" / "bu hafta teslim" panoları yine dolu olsun.

import { getDb } from "../lib/db/client.ts";

const CLEAN_ONLY = process.argv.includes("--clean");

const MS_PER_DAY = 86_400_000;

// Bugüne göre `offset` gün sonrası → 'YYYY-MM-DD'. Negatif = geçmiş (gecikmiş).
function day(offset: number): string {
  return new Date(Date.now() + offset * MS_PER_DAY).toISOString().slice(0, 10);
}

// activity_log.created_at SQLite'ın datetime('now') formatında (UTC) tutuluyor.
function ts(hoursAgo: number): string {
  return new Date(Date.now() - hoursAgo * 3_600_000)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
}

type ContentType =
  | "Reel"
  | "Post"
  | "Story"
  | "Foto"
  | "Kampanya"
  | "Video"
  | "Carousel"
  | "KurumsalKimlik"
  | "Diger";
type ContentStatus = "Planlandi" | "Uretimde" | "Tamamlandi" | "IptalEdildi";
type TaskStatus = "Beklemede" | "DevamEdiyor" | "Incelemede" | "Onaylandi" | "Yayinlandi";
type TaskPriority = "Dusuk" | "Normal" | "Yuksek" | "Acil";

interface DemoTask {
  slug: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string | null;
  due: number | null; // bugüne göre gün ofseti
  notes?: string;
}

interface DemoContent {
  slug: string;
  brandId: string;
  title: string;
  type: ContentType;
  status: ContentStatus;
  assignee: string | null;
  target: number | null;
  archived?: boolean;
  tasks: DemoTask[];
}

// Ekipten gerçek kişi id'leri (db/seed.mts'teki PEOPLE listesi).
const CONTENT: DemoContent[] = [
  // ---- Balık & Deniz ----
  {
    slug: "sihirliolta-agustos-reel",
    brandId: "sihirliolta",
    title: "Ağustos Reel Serisi — Olta Teknikleri",
    type: "Reel",
    status: "Uretimde",
    assignee: "ekin",
    target: 6,
    tasks: [
      {
        slug: "brief",
        title: "Seri konseptini ve 6 bölümün başlıklarını çıkar",
        status: "Yayinlandi",
        priority: "Normal",
        assignee: "ekin",
        due: -9,
      },
      {
        slug: "cekim",
        title: "1–3. bölüm çekimi (tekne, sabah kuşağı)",
        status: "Incelemede",
        priority: "Yuksek",
        assignee: "murat",
        due: -2,
        notes: "Ham kayıtlar Drive'da: /Sihirli Olta/Ağustos/RAW",
      },
      {
        slug: "kurgu",
        title: "1. bölüm kurgu + altyazı",
        status: "DevamEdiyor",
        priority: "Yuksek",
        assignee: "arman",
        due: 0,
      },
      {
        slug: "kapak",
        title: "Kapak görselleri (kapak testi başarısızdı, yeniden)",
        status: "Beklemede",
        priority: "Acil",
        assignee: "defne",
        due: 1,
        notes: "Denetimde kapak testi 'Başarısız' çıktı — yüz + büyük tipografi şart.",
      },
      {
        slug: "takvim",
        title: "Yayın takvimini onaya sun",
        status: "Beklemede",
        priority: "Dusuk",
        assignee: "yunus",
        due: 4,
      },
    ],
  },
  {
    slug: "blackhole-tekne-tanitim",
    brandId: "ns.blackhole",
    title: "Tekne Turu Tanıtım Videosu",
    type: "Video",
    status: "Planlandi",
    assignee: "murat",
    target: 18,
    tasks: [
      {
        slug: "senaryo",
        title: "60 sn'lik senaryo taslağı",
        status: "DevamEdiyor",
        priority: "Normal",
        assignee: "sila",
        due: 3,
      },
      {
        slug: "lokasyon",
        title: "Çekim için tekne ve gün ayarla",
        status: "Beklemede",
        priority: "Yuksek",
        assignee: "murat",
        due: 7,
      },
      {
        slug: "muzik",
        title: "Telifsiz müzik seçenekleri hazırla",
        status: "Beklemede",
        priority: "Dusuk",
        assignee: null,
        due: null,
      },
    ],
  },
  {
    slug: "cengiz-tezgah-foto",
    brandId: "cengizbalikcilik",
    title: "Günlük Tezgah Fotoğraf Seti",
    type: "Foto",
    status: "Uretimde",
    assignee: "defne",
    target: 2,
    tasks: [
      {
        slug: "cekim",
        title: "Sabah tezgah çekimi (haftalık tekrar)",
        status: "Onaylandi",
        priority: "Normal",
        assignee: "defne",
        due: -1,
      },
      {
        slug: "retus",
        title: "Renk düzeltme + 12 kare seçimi",
        status: "DevamEdiyor",
        priority: "Normal",
        assignee: "cansu",
        due: 1,
      },
      {
        slug: "metin",
        title: "Günlük fiyat/stok metin şablonu yaz",
        status: "Beklemede",
        priority: "Dusuk",
        assignee: "sila",
        due: 5,
      },
    ],
  },
  {
    slug: "tersan-fuar-kimlik",
    brandId: "tersanmarine",
    title: "Fuar Kataloğu & Kurumsal Kimlik Revizyonu",
    type: "KurumsalKimlik",
    status: "Planlandi",
    assignee: "ozgun",
    target: 25,
    tasks: [
      {
        slug: "envanter",
        title: "Mevcut kimlik dosyalarını topla (logo, font, renk)",
        status: "Yayinlandi",
        priority: "Normal",
        assignee: "ozgun",
        due: -12,
      },
      {
        slug: "moodboard",
        title: "Moodboard ve 3 yön sun",
        status: "Incelemede",
        priority: "Yuksek",
        assignee: "ozgun",
        due: -3,
        notes: "Müşteri 2. yönü beğendi ama 'daha teknik' istedi.",
      },
      {
        slug: "katalog",
        title: "16 sayfalık katalog şablonu",
        status: "Beklemede",
        priority: "Normal",
        assignee: "cansu",
        due: 12,
      },
    ],
  },

  // ---- Kahve & Gıda ----
  {
    slug: "hacibaba-soguk-kahve",
    brandId: "hacibabacoffee",
    title: "Soğuk Kahve Kampanyası",
    type: "Kampanya",
    status: "Uretimde",
    assignee: "cansu",
    target: 8,
    tasks: [
      {
        slug: "konsept",
        title: "Kampanya konsepti ve slogan",
        status: "Yayinlandi",
        priority: "Yuksek",
        assignee: "sila",
        due: -14,
      },
      {
        slug: "urun-cekim",
        title: "Ürün çekimi — 4 içecek, stüdyo",
        status: "Onaylandi",
        priority: "Yuksek",
        assignee: "defne",
        due: -4,
      },
      {
        slug: "reels",
        title: "3 adet Reel kurgusu",
        status: "DevamEdiyor",
        priority: "Acil",
        assignee: "arman",
        due: 0,
        notes: "Kampanya pazartesi başlıyor, kurgu bugün bitmeli.",
      },
      {
        slug: "story",
        title: "Story şablonları (indirim kodu)",
        status: "Beklemede",
        priority: "Normal",
        assignee: "cansu",
        due: 1,
      },
      {
        slug: "raporlama",
        title: "İlk hafta performans raporu",
        status: "Beklemede",
        priority: "Dusuk",
        assignee: "yunus",
        due: 15,
      },
    ],
  },
  {
    slug: "kahvecihb-menu-cekim",
    brandId: "kahvecihb",
    title: "Menü Çekimi Yenileme",
    type: "Foto",
    status: "Tamamlandi",
    assignee: "defne",
    target: -6,
    tasks: [
      {
        slug: "cekim",
        title: "Menü çekimi (28 ürün)",
        status: "Yayinlandi",
        priority: "Normal",
        assignee: "defne",
        due: -8,
      },
      {
        slug: "teslim",
        title: "Retuşlu dosyaları müşteriye teslim et",
        status: "Yayinlandi",
        priority: "Normal",
        assignee: "cansu",
        due: -6,
      },
    ],
  },
  {
    slug: "pellegro-kahve-rehberi",
    brandId: "pellegrocaffe",
    title: "Carousel: Espresso Rehberi",
    type: "Carousel",
    status: "Planlandi",
    assignee: "sila",
    target: 10,
    tasks: [
      {
        slug: "metin",
        title: "5 kare için metin akışı",
        status: "DevamEdiyor",
        priority: "Normal",
        assignee: "sila",
        due: 2,
      },
      {
        slug: "tasarim",
        title: "Kare tasarımları (marka renkleri)",
        status: "Beklemede",
        priority: "Normal",
        assignee: "ozgun",
        due: 6,
      },
    ],
  },
  {
    slug: "hbkuruyemis-bayram-kutu",
    brandId: "hbkuruyemis",
    title: "Bayram Kutu Tasarımı",
    type: "Foto",
    status: "IptalEdildi",
    assignee: "ozgun",
    target: -20,
    tasks: [
      {
        slug: "brief",
        title: "Kutu ölçüleri ve baskı brief'i",
        status: "Yayinlandi",
        priority: "Normal",
        assignee: "ozgun",
        due: -22,
        notes: "Müşteri bu sezon kutu basmaktan vazgeçti — iş iptal.",
      },
    ],
  },

  // ---- B2B / Yapı ----
  {
    slug: "ateknik-referans-vitrin",
    brandId: "ateknikyalitim",
    title: "B2B Referans Projeler Vitrini",
    type: "Carousel",
    status: "Uretimde",
    assignee: "yunus",
    target: 9,
    tasks: [
      {
        slug: "veri",
        title: "Son 12 ayın referans projelerini listele",
        status: "Onaylandi",
        priority: "Normal",
        assignee: "yunus",
        due: -5,
      },
      {
        slug: "foto",
        title: "Şantiye fotoğraflarını müşteriden iste",
        status: "DevamEdiyor",
        priority: "Yuksek",
        assignee: "erhan",
        due: -1,
        notes: "3 projeden foto geldi, 5 proje eksik.",
      },
      {
        slug: "tasarim",
        title: "Carousel tasarımı — proje kartı şablonu",
        status: "Beklemede",
        priority: "Normal",
        assignee: "ozgun",
        due: 5,
      },
      {
        slug: "linkedin",
        title: "LinkedIn uyarlaması (B2B kitle)",
        status: "Beklemede",
        priority: "Dusuk",
        assignee: null,
        due: 11,
      },
    ],
  },
  {
    slug: "ozanparke-oncesi-sonrasi",
    brandId: "ozanparke",
    title: "Öncesi/Sonrası Reels Serisi",
    type: "Reel",
    status: "Planlandi",
    assignee: "arman",
    target: 14,
    tasks: [
      {
        slug: "arsiv",
        title: "Arşivdeki uygulama videolarını tara",
        status: "DevamEdiyor",
        priority: "Normal",
        assignee: "arman",
        due: 1,
      },
      {
        slug: "format",
        title: "Split-screen şablonu hazırla",
        status: "Beklemede",
        priority: "Normal",
        assignee: "emrullah",
        due: 8,
      },
    ],
  },
  {
    slug: "antek-fuar-arsiv",
    brandId: "antek_makina",
    title: "Bahar Fuarı Paylaşımları (arşiv)",
    type: "Diger",
    status: "Tamamlandi",
    assignee: "erhan",
    target: -45,
    archived: true,
    tasks: [
      {
        slug: "ozet",
        title: "Fuar sonrası özet paylaşımı",
        status: "Yayinlandi",
        priority: "Dusuk",
        assignee: "erhan",
        due: -44,
      },
    ],
  },

  // ---- Hamam ----
  {
    slug: "alaaddin-tanitim-filmi",
    brandId: "alaaddinhammam",
    title: "Turist Odaklı Tanıtım Filmi",
    type: "Video",
    status: "Uretimde",
    assignee: "murat",
    target: 4,
    tasks: [
      {
        slug: "senaryo",
        title: "İngilizce alt yazılı senaryo",
        status: "Onaylandi",
        priority: "Normal",
        assignee: "sila",
        due: -7,
      },
      {
        slug: "cekim",
        title: "Hamam içi çekim (buhar/ışık testi dahil)",
        status: "Incelemede",
        priority: "Yuksek",
        assignee: "murat",
        due: -2,
      },
      {
        slug: "kurgu",
        title: "Kurgu ve renk",
        status: "DevamEdiyor",
        priority: "Yuksek",
        assignee: "arman",
        due: 2,
      },
      {
        slug: "ceviri",
        title: "EN/DE altyazı çevirisi",
        status: "Beklemede",
        priority: "Normal",
        assignee: "emrullah",
        due: 3,
      },
    ],
  },

  // ---- Gayrimenkul ----
  {
    slug: "prive-villa-lansman",
    brandId: "theprivefethiye",
    title: "Villa Lansman Kampanyası",
    type: "Kampanya",
    status: "Planlandi",
    assignee: "yunus",
    target: 21,
    tasks: [
      {
        slug: "hedef",
        title: "Hedef kitle ve bütçe planı",
        status: "DevamEdiyor",
        priority: "Yuksek",
        assignee: "yunus",
        due: 1,
      },
      {
        slug: "drone",
        title: "Drone çekimi izni ve randevu",
        status: "Beklemede",
        priority: "Acil",
        assignee: "murat",
        due: -1,
        notes: "İzin başvurusu gecikti — lansman tarihini riske atıyor.",
      },
      {
        slug: "landing",
        title: "Lansman açılış sayfası metni",
        status: "Beklemede",
        priority: "Normal",
        assignee: "sila",
        due: 9,
      },
    ],
  },

  // ---- Diğer ----
  {
    slug: "famedans-kayit-duyuru",
    brandId: "famedans",
    title: "Yeni Dönem Kayıt Duyurusu",
    type: "Kampanya",
    status: "Tamamlandi",
    assignee: "cansu",
    target: -3,
    tasks: [
      {
        slug: "afis",
        title: "Kayıt afişi tasarımı",
        status: "Yayinlandi",
        priority: "Normal",
        assignee: "ozgun",
        due: -10,
      },
      {
        slug: "reels",
        title: "Ders kayıtlarından tanıtım Reel'i",
        status: "Yayinlandi",
        priority: "Normal",
        assignee: "arman",
        due: -5,
      },
      {
        slug: "sonuc",
        title: "Kayıt sayısını raporla",
        status: "Incelemede",
        priority: "Dusuk",
        assignee: "yunus",
        due: 2,
      },
    ],
  },
];

// Görev yorumları: [içerik slug, görev slug, yazar id, gövde, kaç saat önce]
const COMMENTS: [string, string, string, string, number][] = [
  ["sihirliolta-agustos-reel", "kapak", "yunus", "Denetim raporundaki kapak testi notunu ekledim, tipografi en az 90pt olsun.", 30],
  ["sihirliolta-agustos-reel", "kapak", "defne", "Anladım, iki alternatif hazırlayıp buraya bırakacağım.", 26],
  ["sihirliolta-agustos-reel", "kurgu", "arman", "İlk kaba kurgu çıktı, ses seviyeleri düzeltilecek.", 8],
  ["hacibaba-soguk-kahve", "reels", "cansu", "Müşteri 2. Reel'de logo süresini uzatmamızı istedi.", 20],
  ["hacibaba-soguk-kahve", "reels", "arman", "Logoyu 1.5 sn'ye çıkardım, revize yükleniyor.", 5],
  ["prive-villa-lansman", "drone", "murat", "Belediyeden dönüş bekliyoruz, çarşambaya kadar cevap gelmezse plan B: yer çekimi.", 12],
  ["ateknik-referans-vitrin", "foto", "erhan", "Eksik 5 proje için müşteriye hatırlatma gönderildi.", 3],
  ["tersan-fuar-kimlik", "moodboard", "ozgun", "2. yönü teknik çizim dokusuyla revize ediyorum.", 40],
];

// Aktivite akışını da doldur — /activity sayfası boş görünmesin.
// [kişi id, action, entityType, içerik slug, özet, kaç saat önce]
const ACTIVITY: [string, string, "content" | "task", string, string, number][] = [
  ["yunus", "content.create", "content", "prive-villa-lansman", "\"Villa Lansman Kampanyası\" içeriğini oluşturdu", 72],
  ["cansu", "content.status", "content", "hacibaba-soguk-kahve", "\"Soğuk Kahve Kampanyası\" durumunu Üretimde yaptı", 48],
  ["defne", "task.status", "task", "cengiz-tezgah-foto", "\"Sabah tezgah çekimi\" görevini Onaylandı yaptı", 26],
  ["arman", "task.status", "task", "hacibaba-soguk-kahve", "\"3 adet Reel kurgusu\" görevini Devam Ediyor yaptı", 21],
  ["ozgun", "task.create", "task", "tersan-fuar-kimlik", "\"16 sayfalık katalog şablonu\" görevini ekledi", 18],
  ["murat", "comment.create", "task", "prive-villa-lansman", "\"Drone çekimi izni\" görevine yorum yaptı", 12],
  ["erhan", "task.assign", "task", "ateknik-referans-vitrin", "\"Şantiye fotoğraflarını iste\" görevini Erhan'a atadı", 6],
  ["arman", "comment.create", "task", "sihirliolta-agustos-reel", "\"1. bölüm kurgu\" görevine yorum yaptı", 4],
];

const db = getDb();

// ---- Temizlik (idempotent yeniden çalıştırma) ----
// Sıra önemli değil (CASCADE var) ama activity_log'un FK'si yok, elle silinmeli.
const deletedActivity = db
  .prepare("DELETE FROM activity_log WHERE id LIKE 'demo-%'")
  .run().changes;
const deletedContent = db
  .prepare("DELETE FROM content_items WHERE id LIKE 'demo-%'")
  .run().changes;

console.log(`Temizlendi: ${deletedContent} içerik (+ bağlı görev/yorumlar), ${deletedActivity} aktivite kaydı.`);

if (CLEAN_ONLY) {
  console.log("--clean verildi, yeni kayıt yazılmadı.");
  process.exit(0);
}

// ---- Yazma ----
const brandExists = db.prepare("SELECT 1 FROM brands WHERE id = ?");
const insertContent = db.prepare(
  `INSERT INTO content_items (id, brand_id, title, type, target_date, status, assignee_id, archived)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
);
const insertTask = db.prepare(
  `INSERT INTO tasks (id, content_item_id, title, status, priority, assignee_id, due_date, notes)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
);
const insertComment = db.prepare(
  "INSERT INTO comments (id, task_id, author_id, body, created_at) VALUES (?, ?, ?, ?, ?)",
);
const insertActivity = db.prepare(
  `INSERT INTO activity_log (id, actor_id, actor_name, action, entity_type, entity_id, brand_id, summary, created_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);
const personName = db.prepare("SELECT name FROM people WHERE id = ?");

let contentCount = 0;
let taskCount = 0;

db.exec("BEGIN");
try {
  for (const c of CONTENT) {
    if (!brandExists.get(c.brandId)) {
      console.warn(`! Marka yok, atlandı: ${c.brandId}`);
      continue;
    }
    const contentId = `demo-${c.slug}`;
    insertContent.run(
      contentId,
      c.brandId,
      c.title,
      c.type,
      c.target === null ? null : day(c.target),
      c.status,
      c.assignee,
      c.archived ? 1 : 0,
    );
    contentCount++;

    for (const t of c.tasks) {
      insertTask.run(
        `demo-${c.slug}-${t.slug}`,
        contentId,
        t.title,
        t.status,
        t.priority,
        t.assignee,
        t.due === null ? null : day(t.due),
        t.notes ?? null,
      );
      taskCount++;
    }
  }

  let i = 0;
  for (const [contentSlug, taskSlug, author, body, hoursAgo] of COMMENTS) {
    insertComment.run(
      `demo-comment-${i++}`,
      `demo-${contentSlug}-${taskSlug}`,
      author,
      body,
      ts(hoursAgo),
    );
  }

  let j = 0;
  for (const [actor, action, entityType, contentSlug, summary, hoursAgo] of ACTIVITY) {
    const brandId = CONTENT.find((c) => c.slug === contentSlug)?.brandId ?? null;
    const actorRow = personName.get(actor) as { name: string } | undefined;
    insertActivity.run(
      `demo-activity-${j++}`,
      actor,
      actorRow?.name ?? actor,
      action,
      entityType,
      `demo-${contentSlug}`,
      brandId,
      summary,
      ts(hoursAgo),
    );
  }

  db.exec("COMMIT");
} catch (err) {
  db.exec("ROLLBACK");
  throw err;
}

console.log(
  `Eklendi: ${contentCount} içerik, ${taskCount} görev, ${COMMENTS.length} yorum, ${ACTIVITY.length} aktivite.`,
);
console.log("Geri almak için: npm run db:seed:demo -- --clean");
