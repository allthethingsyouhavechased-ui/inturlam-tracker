export type Cluster = "balik-deniz" | "kahve-gida" | "b2b-yapi" | "hamam" | "tek";
export type ContentType = "Reel" | "Foto" | "Kampanya" | "Video" | "Diger";
export type ContentStatus = "Planlandi" | "Uretimde" | "Tamamlandi" | "IptalEdildi";
export type TaskStatus =
  | "Beklemede"
  | "DevamEdiyor"
  | "Incelemede"
  | "Onaylandi"
  | "Yayinlandi";

export interface Brand {
  id: string;
  name: string;
  cluster: Cluster;
  sort_order: number;
  archived: number;
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
