export type Cluster =
  | "balik-deniz"
  | "kahve-gida"
  | "b2b-yapi"
  | "hamam"
  | "emlak"
  | "tek";
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

export type CoverTestVerdict = "Gecti" | "Kismen" | "Basarisiz" | "Sinirda";

export type RelationType =
  | "rakip"
  | "tedarikci"
  | "ortaklik_muhtemel"
  | "kismi_cakisma"
  | "portfoy_ici"
  | "marka_ailesi"
  | "kardes_sube"
  | "nuansli";

export type RelationRisk = "yuksek" | "dusuk" | "yok";

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
  median_reel_views: string | null;
  cover_test_verdict: CoverTestVerdict | null;
  cover_test_note: string | null;
  key_finding: string | null;
  first_action: string | null;
  tier: string | null;
}

export interface BrandAudit {
  brand_id: string;
  body_markdown: string;
  source_file: string | null;
  audit_date: string | null;
  updated_at: string;
}

// listBrandRelations() satırı — hangi taraf eşleşirse eşleşsin "karşı marka"nın
// bilgisini taşıyacak şekilde repo katmanında normalize edilir.
export interface BrandRelationView {
  id: string;
  relation_type: RelationType;
  risk_level: RelationRisk | null;
  note: string;
  related_brand_id: string;
  related_brand_name: string;
  related_brand_cluster: Cluster;
  related_brand_logo_path: string | null;
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
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  content_item_id: string;
  title: string;
  status: TaskStatus;
  assignee_id: string | null;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  task_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

export interface TaskWithContext extends Task {
  assignee_name: string | null;
  content_title: string;
  brand_id: string;
  brand_name: string;
}

export interface BrandWithCount extends Brand {
  open_count: number;
}
