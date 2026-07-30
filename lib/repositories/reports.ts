import { getDb, plainList, plainOne } from "@/lib/db/client";
import type { TaskStatus } from "@/lib/types";

export interface DateRange {
  start: string;
  end: string;
}

export interface ReportSummary {
  opened_tasks: number;
  completed_tasks: number;
  open_tasks: number;
  overdue_tasks: number;
  on_time_rate: number | null;
  average_cycle_days: number | null;
}

export interface WorkflowReportRow {
  status: Exclude<TaskStatus, "Yayinlandi">;
  task_count: number;
}

export interface PersonReportRow {
  person_id: string;
  person_name: string;
  active: number;
  total_tasks: number;
  completed_tasks: number;
  open_tasks: number;
  overdue_tasks: number;
  on_time_rate: number | null;
  average_cycle_days: number | null;
}

export interface PersonBrandRow {
  person_id: string;
  brand_id: string;
  brand_name: string;
  total_tasks: number;
  completed_tasks: number;
  open_tasks: number;
}

export interface BrandReportRow {
  brand_id: string;
  brand_name: string;
  archived: number;
  total_content: number;
  total_tasks: number;
  completed_tasks: number;
  open_tasks: number;
  overdue_tasks: number;
  on_time_rate: number | null;
  average_cycle_days: number | null;
}

export interface BrandPersonRow {
  brand_id: string;
  person_id: string;
  person_name: string;
  total_tasks: number;
  completed_tasks: number;
  open_tasks: number;
}

function periodCondition(column: string, range: DateRange | null): string {
  return range ? `date(${column}) BETWEEN :start AND :end` : "1 = 1";
}

function rangeParams(range: DateRange | null): { start: string; end: string } | undefined {
  return range ? { start: range.start, end: range.end } : undefined;
}

function allForRange<T>(sql: string, range: DateRange | null): T[] {
  const statement = getDb().prepare(sql);
  const params = rangeParams(range);
  return plainList<T>(params ? statement.all(params) : statement.all());
}

export function getReportSummary(
  range: DateRange | null,
  today: string,
): ReportSummary {
  const opened = periodCondition("t.created_at", range);
  const completed = periodCondition("t.completed_at", range);
  const statement = getDb().prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN ${opened} THEN 1 ELSE 0 END), 0) AS opened_tasks,
      COALESCE(SUM(CASE
        WHEN t.status = 'Yayinlandi' AND ${completed} THEN 1 ELSE 0 END), 0
      ) AS completed_tasks,
      COALESCE(SUM(CASE WHEN t.status != 'Yayinlandi' THEN 1 ELSE 0 END), 0)
        AS open_tasks,
      COALESCE(SUM(CASE
        WHEN t.status != 'Yayinlandi'
         AND t.due_date IS NOT NULL
         AND t.due_date < :today
        THEN 1 ELSE 0 END), 0) AS overdue_tasks,
      ROUND(
        100.0 * SUM(CASE
          WHEN t.status = 'Yayinlandi'
           AND ${completed}
           AND t.due_date IS NOT NULL
           AND date(t.completed_at) <= t.due_date
          THEN 1 ELSE 0 END)
        / NULLIF(SUM(CASE
          WHEN t.status = 'Yayinlandi'
           AND ${completed}
           AND t.due_date IS NOT NULL
          THEN 1 ELSE 0 END), 0),
        0
      ) AS on_time_rate,
      ROUND(AVG(CASE
        WHEN t.status = 'Yayinlandi' AND ${completed}
        THEN MAX(julianday(t.completed_at) - julianday(t.created_at), 0)
      END), 1) AS average_cycle_days
    FROM tasks t
  `);
  const params: Record<string, string> = { today };
  if (range) {
    params.start = range.start;
    params.end = range.end;
  }
  return (
    plainOne<ReportSummary>(statement.get(params)) ?? {
      opened_tasks: 0,
      completed_tasks: 0,
      open_tasks: 0,
      overdue_tasks: 0,
      on_time_rate: null,
      average_cycle_days: null,
    }
  );
}

export function listWorkflowReport(): WorkflowReportRow[] {
  return plainList<WorkflowReportRow>(
    getDb()
      .prepare(
        `WITH workflow(status, sort_order) AS (
           VALUES ('Beklemede', 1), ('DevamEdiyor', 2),
                  ('Incelemede', 3), ('Onaylandi', 4)
         )
         SELECT workflow.status, COUNT(t.id) AS task_count
           FROM workflow
           LEFT JOIN tasks t ON t.status = workflow.status
          GROUP BY workflow.status, workflow.sort_order
          ORDER BY workflow.sort_order`,
      )
      .all(),
  );
}

export function listPersonReport(
  range: DateRange | null,
  today: string,
): PersonReportRow[] {
  const opened = periodCondition("t.created_at", range);
  const completed = periodCondition("t.completed_at", range);
  const statement = getDb().prepare(`
    SELECT p.id AS person_id, p.name AS person_name, p.active,
      COALESCE(SUM(CASE WHEN ${opened} THEN 1 ELSE 0 END), 0) AS total_tasks,
      COALESCE(SUM(CASE
        WHEN t.status = 'Yayinlandi' AND ${completed} THEN 1 ELSE 0 END), 0
      ) AS completed_tasks,
      COALESCE(SUM(CASE WHEN t.status != 'Yayinlandi' THEN 1 ELSE 0 END), 0)
        AS open_tasks,
      COALESCE(SUM(CASE
        WHEN t.status != 'Yayinlandi'
         AND t.due_date IS NOT NULL
         AND t.due_date < :today
        THEN 1 ELSE 0 END), 0) AS overdue_tasks,
      ROUND(
        100.0 * SUM(CASE
          WHEN t.status = 'Yayinlandi'
           AND ${completed}
           AND t.due_date IS NOT NULL
           AND date(t.completed_at) <= t.due_date
          THEN 1 ELSE 0 END)
        / NULLIF(SUM(CASE
          WHEN t.status = 'Yayinlandi'
           AND ${completed}
           AND t.due_date IS NOT NULL
          THEN 1 ELSE 0 END), 0),
        0
      ) AS on_time_rate,
      ROUND(AVG(CASE
        WHEN t.status = 'Yayinlandi' AND ${completed}
        THEN MAX(julianday(t.completed_at) - julianday(t.created_at), 0)
      END), 1) AS average_cycle_days
    FROM people p
    LEFT JOIN tasks t ON t.assignee_id = p.id
    GROUP BY p.id
    ORDER BY completed_tasks DESC, open_tasks DESC, p.name
  `);
  const params: Record<string, string> = { today };
  if (range) {
    params.start = range.start;
    params.end = range.end;
  }
  return plainList<PersonReportRow>(statement.all(params));
}

export function listPersonBrandBreakdown(
  range: DateRange | null,
): PersonBrandRow[] {
  const opened = periodCondition("t.created_at", range);
  const completed = periodCondition("t.completed_at", range);
  return allForRange<PersonBrandRow>(
    `SELECT p.id AS person_id, b.id AS brand_id, b.name AS brand_name,
            SUM(CASE WHEN ${opened} THEN 1 ELSE 0 END) AS total_tasks,
            SUM(CASE
              WHEN t.status = 'Yayinlandi' AND ${completed} THEN 1 ELSE 0 END
            ) AS completed_tasks,
            SUM(CASE WHEN t.status != 'Yayinlandi' THEN 1 ELSE 0 END) AS open_tasks
       FROM tasks t
       JOIN content_items ci ON ci.id = t.content_item_id
       JOIN brands b ON b.id = ci.brand_id
       JOIN people p ON p.id = t.assignee_id
      GROUP BY p.id, b.id
     HAVING total_tasks > 0 OR completed_tasks > 0 OR open_tasks > 0
      ORDER BY p.name, completed_tasks DESC, open_tasks DESC`,
    range,
  );
}

// Arşivlenmiş markalar geçmiş raporlarında kalır; kullanıcı isterse arayüzden
// gizleyebilir. "İçerik" sayısı seçili dönemde açılan içerikleri ifade eder.
export function listBrandReport(
  range: DateRange | null,
  today: string,
): BrandReportRow[] {
  const contentOpened = periodCondition("ci.created_at", range);
  const taskOpened = periodCondition("t.created_at", range);
  const completed = periodCondition("t.completed_at", range);
  const statement = getDb().prepare(`
    SELECT b.id AS brand_id, b.name AS brand_name, b.archived AS archived,
      COUNT(DISTINCT CASE WHEN ${contentOpened} THEN ci.id END) AS total_content,
      COALESCE(SUM(CASE WHEN ${taskOpened} THEN 1 ELSE 0 END), 0) AS total_tasks,
      COALESCE(SUM(CASE
        WHEN t.status = 'Yayinlandi' AND ${completed} THEN 1 ELSE 0 END), 0
      ) AS completed_tasks,
      COALESCE(SUM(CASE WHEN t.status != 'Yayinlandi' THEN 1 ELSE 0 END), 0)
        AS open_tasks,
      COALESCE(SUM(CASE
        WHEN t.status != 'Yayinlandi'
         AND t.due_date IS NOT NULL
         AND t.due_date < :today
        THEN 1 ELSE 0 END), 0) AS overdue_tasks,
      ROUND(
        100.0 * SUM(CASE
          WHEN t.status = 'Yayinlandi'
           AND ${completed}
           AND t.due_date IS NOT NULL
           AND date(t.completed_at) <= t.due_date
          THEN 1 ELSE 0 END)
        / NULLIF(SUM(CASE
          WHEN t.status = 'Yayinlandi'
           AND ${completed}
           AND t.due_date IS NOT NULL
          THEN 1 ELSE 0 END), 0),
        0
      ) AS on_time_rate,
      ROUND(AVG(CASE
        WHEN t.status = 'Yayinlandi' AND ${completed}
        THEN MAX(julianday(t.completed_at) - julianday(t.created_at), 0)
      END), 1) AS average_cycle_days
    FROM brands b
    LEFT JOIN content_items ci ON ci.brand_id = b.id
    LEFT JOIN tasks t ON t.content_item_id = ci.id
    GROUP BY b.id
    ORDER BY completed_tasks DESC, open_tasks DESC, b.name
  `);
  const params: Record<string, string> = { today };
  if (range) {
    params.start = range.start;
    params.end = range.end;
  }
  return plainList<BrandReportRow>(statement.all(params));
}

export function listBrandPersonBreakdown(
  range: DateRange | null,
): BrandPersonRow[] {
  const opened = periodCondition("t.created_at", range);
  const completed = periodCondition("t.completed_at", range);
  return allForRange<BrandPersonRow>(
    `SELECT b.id AS brand_id, p.id AS person_id, p.name AS person_name,
            SUM(CASE WHEN ${opened} THEN 1 ELSE 0 END) AS total_tasks,
            SUM(CASE
              WHEN t.status = 'Yayinlandi' AND ${completed} THEN 1 ELSE 0 END
            ) AS completed_tasks,
            SUM(CASE WHEN t.status != 'Yayinlandi' THEN 1 ELSE 0 END) AS open_tasks
       FROM tasks t
       JOIN content_items ci ON ci.id = t.content_item_id
       JOIN brands b ON b.id = ci.brand_id
       JOIN people p ON p.id = t.assignee_id
      GROUP BY b.id, p.id
     HAVING total_tasks > 0 OR completed_tasks > 0 OR open_tasks > 0
      ORDER BY b.name, completed_tasks DESC, open_tasks DESC`,
    range,
  );
}
