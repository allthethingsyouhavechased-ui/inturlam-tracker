import { getDb, plainList } from "@/lib/db/client";
import type { Brand, TaskWithContext } from "@/lib/types";

export interface ContentSearchResult {
  id: string;
  brand_id: string;
  brand_name: string;
  title: string;
}

export interface SearchResults {
  brands: Brand[];
  content: ContentSearchResult[];
  tasks: TaskWithContext[];
}

const RESULT_LIMIT = 20;

// Basit LIKE araması (COLLATE NOCASE yalnızca ASCII a-z/A-Z için case-insensitive
// eşleşir, SQLite'ta ICU eklentisi olmadan Türkçe İ/ı gibi harfler tam
// katlanmaz) — markalar/içerikler/görevler için "yeterince iyi" bir MVP.
export function searchAll(query: string): SearchResults {
  const q = query.trim();
  if (!q) return { brands: [], content: [], tasks: [] };
  const like = `%${q}%`;
  const db = getDb();

  const brands = plainList<Brand>(
    db
      .prepare(
        `SELECT * FROM brands
         WHERE archived = 0 AND name LIKE ? COLLATE NOCASE
         ORDER BY name LIMIT ?`,
      )
      .all(like, RESULT_LIMIT),
  );

  const content = plainList<ContentSearchResult>(
    db
      .prepare(
        `SELECT ci.id, ci.brand_id, b.name AS brand_name, ci.title
         FROM content_items ci
         JOIN brands b ON b.id = ci.brand_id
         WHERE ci.title LIKE ? COLLATE NOCASE
         ORDER BY ci.title LIMIT ?`,
      )
      .all(like, RESULT_LIMIT),
  );

  const tasks = plainList<TaskWithContext>(
    db
      .prepare(
        `SELECT t.*, p.name AS assignee_name, ci.title AS content_title,
                b.id AS brand_id, b.name AS brand_name
         FROM tasks t
         JOIN content_items ci ON ci.id = t.content_item_id
         JOIN brands b ON b.id = ci.brand_id
         LEFT JOIN people p ON p.id = t.assignee_id
         WHERE t.title LIKE ? COLLATE NOCASE
         ORDER BY t.title LIMIT ?`,
      )
      .all(like, RESULT_LIMIT),
  );

  return { brands, content, tasks };
}
