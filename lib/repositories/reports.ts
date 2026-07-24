import { getDb, plainList } from "@/lib/db/client";

export interface DateRange {
  start: string;
  end: string;
}

export interface PersonReportRow {
  person_id: string;
  person_name: string;
  total_tasks: number;
  completed_tasks: number;
  open_tasks: number;
  overdue_tasks: number;
}

// Bir kişinin toplam/tamamlanan/açık/gecikmiş görev sayıları. "Tamamlanan",
// tasks.status = 'Yayinlandi' anlamına gelir; ayrı bir "tamamlanma tarihi"
// takip edilmediği için tarih filtresi task'ın OLUŞTURULMA tarihine göre
// uygulanır (created_at) — bir görev filtre aralığından SONRA tamamlanmış
// olsa bile o aralıkta oluşturulduysa rapora dahil olur.
export function listPersonReport(range: DateRange | null, today: string): PersonReportRow[] {
  const dateFilter = range ? "AND date(t.created_at) BETWEEN ? AND ?" : "";
  const params: string[] = [today];
  if (range) params.push(range.start, range.end);

  return plainList<PersonReportRow>(
    getDb()
      .prepare(
        `SELECT p.id AS person_id, p.name AS person_name,
                COUNT(t.id) AS total_tasks,
                COALESCE(SUM(CASE WHEN t.status = 'Yayinlandi' THEN 1 ELSE 0 END), 0) AS completed_tasks,
                COALESCE(SUM(CASE WHEN t.status != 'Yayinlandi' THEN 1 ELSE 0 END), 0) AS open_tasks,
                COALESCE(SUM(CASE WHEN t.status != 'Yayinlandi' AND t.due_date IS NOT NULL AND t.due_date < ? THEN 1 ELSE 0 END), 0) AS overdue_tasks
         FROM people p
         LEFT JOIN tasks t ON t.assignee_id = p.id ${dateFilter}
         WHERE p.active = 1
         GROUP BY p.id
         ORDER BY total_tasks DESC, p.name`,
      )
      .all(...params),
  );
}

export interface PersonBrandRow {
  person_id: string;
  brand_id: string;
  brand_name: string;
  total_tasks: number;
  completed_tasks: number;
}

// Bir kişinin hangi markalarda kaç görev yaptığı kırılımı.
export function listPersonBrandBreakdown(range: DateRange | null): PersonBrandRow[] {
  const dateFilter = range ? "AND date(t.created_at) BETWEEN ? AND ?" : "";
  const params: string[] = range ? [range.start, range.end] : [];

  return plainList<PersonBrandRow>(
    getDb()
      .prepare(
        `SELECT p.id AS person_id, b.id AS brand_id, b.name AS brand_name,
                COUNT(t.id) AS total_tasks,
                COALESCE(SUM(CASE WHEN t.status = 'Yayinlandi' THEN 1 ELSE 0 END), 0) AS completed_tasks
         FROM tasks t
         JOIN content_items ci ON ci.id = t.content_item_id
         JOIN brands b ON b.id = ci.brand_id
         JOIN people p ON p.id = t.assignee_id
         WHERE 1=1 ${dateFilter}
         GROUP BY p.id, b.id
         ORDER BY p.name, total_tasks DESC`,
      )
      .all(...params),
  );
}

export interface BrandReportRow {
  brand_id: string;
  brand_name: string;
  archived: number;
  total_content: number;
  total_tasks: number;
  completed_tasks: number;
  open_tasks: number;
}

// Arşivlenmiş markalar bilinçli olarak filtrelenmiyor — geçmişte o markada
// yapılan iş, kişinin performans geçmişinin bir parçası; hariç tutmak veri
// kaybı hissi verir. Arayüzde "arşivlenmişleri gizle" seçeneği ile
// istemci tarafında (archived alanına göre) filtrelenebilir.
export function listBrandReport(range: DateRange | null): BrandReportRow[] {
  const dateFilter = range ? "AND date(t.created_at) BETWEEN ? AND ?" : "";
  const params: string[] = range ? [range.start, range.end] : [];

  return plainList<BrandReportRow>(
    getDb()
      .prepare(
        `SELECT b.id AS brand_id, b.name AS brand_name, b.archived AS archived,
                COUNT(DISTINCT ci.id) AS total_content,
                COUNT(t.id) AS total_tasks,
                COALESCE(SUM(CASE WHEN t.status = 'Yayinlandi' THEN 1 ELSE 0 END), 0) AS completed_tasks,
                COALESCE(SUM(CASE WHEN t.status != 'Yayinlandi' THEN 1 ELSE 0 END), 0) AS open_tasks
         FROM brands b
         LEFT JOIN content_items ci ON ci.brand_id = b.id
         LEFT JOIN tasks t ON t.content_item_id = ci.id ${dateFilter}
         GROUP BY b.id
         ORDER BY total_tasks DESC, b.name`,
      )
      .all(...params),
  );
}

export interface BrandPersonRow {
  brand_id: string;
  person_id: string;
  person_name: string;
  total_tasks: number;
  completed_tasks: number;
}

// Bir markada kimin kaç görev yaptığı kırılımı.
export function listBrandPersonBreakdown(range: DateRange | null): BrandPersonRow[] {
  const dateFilter = range ? "AND date(t.created_at) BETWEEN ? AND ?" : "";
  const params: string[] = range ? [range.start, range.end] : [];

  return plainList<BrandPersonRow>(
    getDb()
      .prepare(
        `SELECT b.id AS brand_id, p.id AS person_id, p.name AS person_name,
                COUNT(t.id) AS total_tasks,
                COALESCE(SUM(CASE WHEN t.status = 'Yayinlandi' THEN 1 ELSE 0 END), 0) AS completed_tasks
         FROM tasks t
         JOIN content_items ci ON ci.id = t.content_item_id
         JOIN brands b ON b.id = ci.brand_id
         JOIN people p ON p.id = t.assignee_id
         WHERE 1=1 ${dateFilter}
         GROUP BY b.id, p.id
         ORDER BY b.name, total_tasks DESC`,
      )
      .all(...params),
  );
}
