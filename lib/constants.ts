import type {
  ContentStatus,
  ContentType,
  TaskPriority,
  TaskStatus,
} from "./types";

// Kategoriler (küme) artık sabit değil — `clusters` tablosundan geliyor.
// Sunucu tarafında `listClusters()` / `clusterLabelMap()`
// (lib/repositories/clusters.ts), client component'lerde prop olarak taşınıyor.
// Tabloda karşılığı olmayan bir kategori id'si için başlık:
export const UNKNOWN_CLUSTER_LABEL = "Kategorisiz";

// Marka formlarındaki kategori select'inde "+ Yeni kategori" seçeneğinin
// value'su. Gerçek bir kategori id'siyle çakışmasın diye slug'da üretilemeyecek
// karakterler içeriyor (slugifyCluster yalnızca a-z0-9- üretir).
export const NEW_CLUSTER_VALUE = "__new__";

export const CONTENT_TYPES: ContentType[] = [
  "Reel",
  "Foto",
  "Kampanya",
  "Video",
  "Carousel",
  "KurumsalKimlik",
  "Diger",
];

export const CONTENT_TYPE_LABEL: Record<ContentType, string> = {
  Reel: "Reel",
  Foto: "Foto",
  Kampanya: "Kampanya",
  Video: "Video",
  Carousel: "Carousel",
  KurumsalKimlik: "Kurumsal Kimlik",
  Diger: "Diğer",
};

export const CONTENT_STATUSES: ContentStatus[] = [
  "Planlandi",
  "Uretimde",
  "Tamamlandi",
  "IptalEdildi",
];

export const CONTENT_STATUS_LABEL: Record<ContentStatus, string> = {
  Planlandi: "Planlandı",
  Uretimde: "Üretimde",
  Tamamlandi: "Tamamlandı",
  IptalEdildi: "İptal Edildi",
};

export const CONTENT_STATUS_BADGE: Record<ContentStatus, string> = {
  Planlandi: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  Uretimde: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  Tamamlandi: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  IptalEdildi: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
};

export const TASK_STATUSES: TaskStatus[] = [
  "Beklemede",
  "DevamEdiyor",
  "Incelemede",
  "Onaylandi",
  "Yayinlandi",
];

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  Beklemede: "Beklemede",
  DevamEdiyor: "Devam Ediyor",
  Incelemede: "İncelemede",
  Onaylandi: "Onaylandı",
  Yayinlandi: "Yayınlandı",
};

export const TASK_STATUS_BADGE: Record<TaskStatus, string> = {
  Beklemede: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  DevamEdiyor: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  Incelemede: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  Onaylandi: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  Yayinlandi: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
};

export const TASK_STATUS_DOT: Record<TaskStatus, string> = {
  Beklemede: "bg-slate-400",
  DevamEdiyor: "bg-amber-500",
  Incelemede: "bg-violet-500",
  Onaylandi: "bg-blue-500",
  Yayinlandi: "bg-emerald-500",
};

// Kanban kolon başlıklarının üst çizgisi — TASK_STATUS_DOT ile aynı renk
// paleti, ama Tailwind'in derleme-zamanı taraması runtime'da üretilen class
// string'lerini yakalayamadığı için (ör. .replace("bg-","border-t-")) ayrı
// bir sabit olarak literal yazılmalı.
export const TASK_STATUS_BORDER_TOP: Record<TaskStatus, string> = {
  Beklemede: "border-t-slate-400",
  DevamEdiyor: "border-t-amber-500",
  Incelemede: "border-t-violet-500",
  Onaylandi: "border-t-blue-500",
  Yayinlandi: "border-t-emerald-500",
};

// Bir görevin "açık" (tamamlanmamış) sayılması için: yayınlanmamış olması.
export const OPEN_TASK_STATUSES: TaskStatus[] = TASK_STATUSES.filter(
  (s) => s !== "Yayinlandi",
);

// Tekrar eden görevler: arayüzdeki select ve action doğrulaması aynı listeyi
// kullansın diye tek yerde. Gün cinsinden — "aylık" 30 gün kabul ediliyor
// (takvim ayı değil; iç araç için yeterli, sürpriz yok).
export const REPEAT_OPTIONS: { days: number; label: string }[] = [
  { days: 0, label: "Tekrar yok" },
  { days: 7, label: "Haftalık" },
  { days: 14, label: "2 haftada bir" },
  { days: 30, label: "Aylık" },
];

export const TASK_PRIORITIES: TaskPriority[] = ["Dusuk", "Normal", "Yuksek", "Acil"];

export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = {
  Dusuk: "Düşük",
  Normal: "Normal",
  Yuksek: "Yüksek",
  Acil: "Acil",
};

export const TASK_PRIORITY_ICON: Record<TaskPriority, string> = {
  Dusuk: "🔽",
  Normal: "▪️",
  Yuksek: "🔺",
  Acil: "🔥",
};

export const TASK_PRIORITY_BADGE: Record<TaskPriority, string> = {
  Dusuk: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  Normal: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  Yuksek: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  Acil: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
};

// Kanban kartlarında başlığın önüne sadece göz ardı edilmemesi gereken
// öncelikler için bayrak konur — Normal/Düşük görsel gürültü yaratmasın diye.
export const TASK_PRIORITY_FLAG_THRESHOLD: TaskPriority[] = ["Yuksek", "Acil"];

// Görev kartlarının/satırlarının sol kenarındaki öncelik rengi (border-l-4 ile).
export const TASK_PRIORITY_BORDER: Record<TaskPriority, string> = {
  Dusuk: "border-l-slate-300 dark:border-l-slate-600",
  Normal: "border-l-sky-400 dark:border-l-sky-600",
  Yuksek: "border-l-amber-500",
  Acil: "border-l-rose-500",
};

// Takvim ızgarasının dar ekran görünümünde (metin pill'i sığmadığında) öncelik
// göstergesi — TASK_PRIORITY_BORDER ile aynı renk ailesi, TASK_STATUS_DOT ile
// aynı düz-nokta deseni. Tailwind'in derleme-zamanı taraması runtime'da
// üretilen sınıf adlarını yakalayamadığı için (bkz. TASK_STATUS_BORDER_TOP
// yorumu) burada da literal bir sözlük olarak yazılmalı.
export const TASK_PRIORITY_DOT: Record<TaskPriority, string> = {
  Dusuk: "bg-slate-300 dark:bg-slate-600",
  Normal: "bg-sky-400 dark:bg-sky-600",
  Yuksek: "bg-amber-500",
  Acil: "bg-rose-500",
};
