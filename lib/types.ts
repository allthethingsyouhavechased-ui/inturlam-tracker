// Kategoriler artık `clusters` tablosunda tutuluyor (kullanıcı arayüzden yeni
// kategori ekleyebiliyor), bu yüzden sabit union değil serbest id.
export type Cluster = string;

export interface ClusterRow {
  id: string;
  label: string;
  sort_order: number;
  created_at: string;
}

export type ContentType =
  | "Reel"
  | "Foto"
  | "Kampanya"
  | "Video"
  | "Carousel"
  | "KurumsalKimlik"
  | "Diger";
export type ContentStatus = "Planlandi" | "Uretimde" | "Tamamlandi" | "IptalEdildi";
export type TaskStatus =
  | "Beklemede"
  | "DevamEdiyor"
  | "Incelemede"
  | "Onaylandi"
  | "Yayinlandi";

export type TaskPriority = "Dusuk" | "Normal" | "Yuksek" | "Acil";

export interface Brand {
  id: string;
  name: string;
  cluster: Cluster;
  sort_order: number;
  archived: number;
  logo_path: string | null;
  instagram_handle: string | null;
  follower_count: number | null;
  post_count: number | null;
  // Marka sayfasında gösterilen kısa bilgilendirme metni.
  key_finding: string | null;
  tier: string | null;
  // Takipçi/gönderi sayılarının son güncellendiği gün (YYYY-MM-DD).
  stats_updated_at: string | null;
  // NOT: `brands` tablosunda ayrıca `median_reel_views`, `cover_test_verdict`,
  // `cover_test_note` ve `first_action` sütunları da var. Eski marka denetimi
  // verisi; arayüzden kaldırıldılar ve artık okunmuyorlar, bu yüzden bilerek
  // tipe dahil edilmediler. `SELECT *` bu alanları yine de getirir — tipe
  // eklemek isteyen önce neden gösterileceğine karar versin.
}

export interface Person {
  id: string;
  name: string;
  active: number;
}

export interface ContentItem {
  id: string;
  brand_id: string;
  title: string;
  type: ContentType;
  target_date: string | null;
  status: ContentStatus;
  assignee_id: string | null;
  archived: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  content_item_id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  due_date: string | null;
  notes: string | null;
  // Kaç günde bir tekrarlayacağı. null/0 = tekrar yok.
  repeat_days: number | null;
  created_at: string;
  updated_at: string;
}

// Görev şablonu: bir içerik türü için standart iş akışı.
export interface TaskTemplate {
  id: string;
  name: string;
  content_type: ContentType | null;
  sort_order: number;
  created_at: string;
}

export interface TaskTemplateItem {
  id: string;
  template_id: string;
  title: string;
  priority: TaskPriority;
  assignee_id: string | null;
  // İçeriğin target_date'ine göre gün kayması (-3 = teslimden 3 gün önce).
  due_offset_days: number | null;
  sort_order: number;
}

export interface TaskTemplateWithItems extends TaskTemplate {
  items: TaskTemplateItem[];
}

export interface CommentAttachment {
  id: string;
  comment_id: string;
  file_path: string;
  original_name: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  task_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

// Görevin "Notlar" alanına eklenen görseller — CommentAttachment ile aynı
// şekilde, ama doğrudan bir task_id'ye bağlı.
export interface TaskAttachment {
  id: string;
  task_id: string;
  file_path: string;
  original_name: string | null;
  created_at: string;
}

export type ActivityEntityType =
  | "task"
  | "content"
  | "brand"
  | "cluster"
  | "template";

export interface ActivityEntry {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  action: string;
  entity_type: ActivityEntityType;
  entity_id: string | null;
  brand_id: string | null;
  summary: string;
  created_at: string;
}

// @mention bildirimi. recipient/actor/task/brand alanları activity_log ile
// aynı gerekçeyle anlık (snapshot) tutulur — FK yok, bkz. schema.sql.
export interface Notification {
  id: string;
  recipient_id: string;
  recipient_name: string | null;
  actor_id: string | null;
  actor_name: string | null;
  task_id: string | null;
  brand_id: string | null;
  summary: string;
  read: number;
  created_at: string;
}

export interface TaskCardBadge {
  label: string;
  className: string;
}

export interface TaskWithContext extends Task {
  assignee_name: string | null;
  content_title: string;
  brand_id: string;
  brand_name: string;
  // Yorum özeti: kartın altında ve liste görünümünün "Yorum" sütununda,
  // görevi açmadan "burada bir konuşma var mı" sorusunu cevaplar.
  comment_count: number;
  last_comment_body: string | null;
  last_comment_author: string | null;
  // Panom'un birleşik board'unda bir görevin "neden burada" olduğunu gösteren
  // rozetler (Benim/Gecikmiş/Bu hafta gibi) — sunucuda hesaplanıp düz veri
  // olarak taşınır (Server→Client Component sınırında fonksiyon geçirilemez).
  badges?: TaskCardBadge[];
}

export interface BrandWithCount extends Brand {
  open_count: number;
}
