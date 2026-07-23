import type {
  Cluster,
  ContentStatus,
  ContentType,
  CoverTestVerdict,
  RelationRisk,
  RelationType,
  TaskPriority,
  TaskStatus,
} from "./types";

export const CLUSTERS: { id: Cluster; label: string }[] = [
  { id: "balik-deniz", label: "Balık & Deniz" },
  { id: "kahve-gida", label: "Kahve & Gıda" },
  { id: "b2b-yapi", label: "B2B / Yapı" },
  { id: "hamam", label: "Hamam" },
  { id: "emlak", label: "Gayrimenkul" },
  { id: "tek", label: "Diğer" },
];

export const CLUSTER_LABEL: Record<Cluster, string> = Object.fromEntries(
  CLUSTERS.map((c) => [c.id, c.label]),
) as Record<Cluster, string>;

export const COVER_TEST_LABEL: Record<CoverTestVerdict, string> = {
  Gecti: "Geçti",
  Kismen: "Kısmen",
  Basarisiz: "Başarısız",
  Sinirda: "Sınırda",
};

export const COVER_TEST_BADGE: Record<CoverTestVerdict, string> = {
  Gecti: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  Kismen: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  Basarisiz: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  Sinirda: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export const RELATION_TYPE_LABEL: Record<RelationType, string> = {
  rakip: "Rakip",
  tedarikci: "Tedarikçi",
  ortaklik_muhtemel: "Muhtemel ortaklık",
  kismi_cakisma: "Kısmi çakışma",
  portfoy_ici: "Portföy içi bağlantı",
  marka_ailesi: "Marka ailesi",
  kardes_sube: "Kardeş şube",
  nuansli: "Nüanslı ilişki",
};

export const RELATION_RISK_LABEL: Record<RelationRisk, string> = {
  yuksek: "Yüksek risk",
  dusuk: "Düşük risk",
  yok: "Risk yok",
};

export const RELATION_RISK_BADGE: Record<RelationRisk, string> = {
  yuksek: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  dusuk: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  yok: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
};

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
