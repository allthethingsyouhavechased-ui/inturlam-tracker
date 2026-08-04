import { getDb, plainList, plainOne } from "@/lib/db/client";
import type { TaskPriority, TaskStatus } from "@/lib/types";

export interface DateRange {
  start: string;
  end: string;
}

// Raporların çoğu hem portföy geneli hem de tek kişi için çalışıyor. Kapsam
// null ise sorgu tüm görevleri kapsar; bir kişi id'si verilirse `t.assignee_id`
// üzerinden daraltılır. Aynı SQL'i iki kez yazmamak için tüm sayaç
// fonksiyonları bu isteğe bağlı parametreyi alıyor.
export type PersonScope = string | null;

function scopeCondition(scope: PersonScope): string {
  return scope ? "AND t.assignee_id = :personId" : "";
}

function scopeParams(scope: PersonScope): { personId: string } | undefined {
  return scope ? { personId: scope } : undefined;
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
  department: string | null;
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
  // Kategori id'si (`clusters.id`). Etikete çevirmek çağıranın işi —
  // `clusterLabelMap()[cluster] ?? UNKNOWN_CLUSTER_LABEL`.
  cluster: string;
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

export type TrendGranularity = "day" | "week" | "month";

export interface TrendReportPoint {
  key: string;
  label: string;
  opened_tasks: number;
  completed_tasks: number;
}

export interface TrendReport {
  granularity: TrendGranularity;
  points: TrendReportPoint[];
}

export interface CycleTimeBucket {
  key: "one_day" | "two_three" | "four_seven" | "eight_fourteen" | "fifteen_plus";
  label: string;
  task_count: number;
}

export interface CycleTimeReport {
  sample_size: number;
  average_days: number | null;
  median_days: number | null;
  p75_days: number | null;
  buckets: CycleTimeBucket[];
}

export interface DueHealthRow {
  bucket: "overdue" | "today" | "next_seven" | "later" | "unscheduled";
  label: string;
  task_count: number;
}

function periodCondition(column: string, range: DateRange | null): string {
  return range ? `date(${column}) BETWEEN :start AND :end` : "1 = 1";
}

function rangeParams(range: DateRange | null): { start: string; end: string } | undefined {
  return range ? { start: range.start, end: range.end } : undefined;
}

function allForRange<T>(sql: string, range: DateRange | null, scope: PersonScope = null): T[] {
  const statement = getDb().prepare(sql);
  const params = { ...rangeParams(range), ...scopeParams(scope) };
  return plainList<T>(
    Object.keys(params).length > 0 ? statement.all(params) : statement.all(),
  );
}

function parseISODate(value: string): Date {
  return new Date(`${value.slice(0, 10)}T12:00:00`);
}

function toISODate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(value: Date, amount: number): Date {
  const next = new Date(value);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfWeek(value: Date): Date {
  const day = value.getDay();
  return addDays(value, -(day === 0 ? 6 : day - 1));
}

function trendBucketKey(value: Date, granularity: TrendGranularity): string {
  if (granularity === "month") return toISODate(value).slice(0, 7);
  if (granularity === "week") return toISODate(startOfWeek(value));
  return toISODate(value);
}

function trendLabel(key: string, granularity: TrendGranularity): string {
  const date = parseISODate(granularity === "month" ? `${key}-01` : key);
  if (granularity === "month") {
    return new Intl.DateTimeFormat("tr-TR", { month: "short", year: "2-digit" }).format(date);
  }
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(date);
}

function quantile(sortedValues: number[], percentile: number): number | null {
  if (sortedValues.length === 0) return null;
  const position = (sortedValues.length - 1) * percentile;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  const value =
    lower === upper
      ? sortedValues[lower]
      : sortedValues[lower] + (sortedValues[upper] - sortedValues[lower]) * (position - lower);
  return Math.round(value * 10) / 10;
}

export function getTrendReport(range: DateRange | null, scope: PersonScope = null): TrendReport {
  const conditions = ["event_date IS NOT NULL"];
  if (range) conditions.push("event_date BETWEEN :start AND :end");
  if (scope) conditions.push("assignee_id = :personId");
  const statement = getDb().prepare(`
    SELECT event_date, event_type, COUNT(*) AS task_count
      FROM (
        SELECT date(created_at) AS event_date, 'opened' AS event_type, assignee_id
          FROM tasks
        UNION ALL
        SELECT date(completed_at) AS event_date, 'completed' AS event_type, assignee_id
          FROM tasks
         WHERE status = 'Yayinlandi' AND completed_at IS NOT NULL
      ) events
     WHERE ${conditions.join("\n       AND ")}
     GROUP BY event_date, event_type
     ORDER BY event_date
  `);
  const params = { ...rangeParams(range), ...scopeParams(scope) };
  const rows = plainList<{
    event_date: string;
    event_type: "opened" | "completed";
    task_count: number;
  }>(Object.keys(params).length > 0 ? statement.all(params) : statement.all());

  const startValue = range?.start ?? rows[0]?.event_date;
  const endValue = range?.end ?? rows[rows.length - 1]?.event_date;
  if (!startValue || !endValue) return { granularity: "day", points: [] };

  const start = parseISODate(startValue);
  const end = parseISODate(endValue);
  const dayCount = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1);
  const granularity: TrendGranularity = dayCount <= 35 ? "day" : dayCount <= 210 ? "week" : "month";
  const totals = new Map<string, { opened: number; completed: number }>();

  for (const row of rows) {
    const key = trendBucketKey(parseISODate(row.event_date), granularity);
    const value = totals.get(key) ?? { opened: 0, completed: 0 };
    value[row.event_type] += row.task_count;
    totals.set(key, value);
  }

  const points: TrendReportPoint[] = [];
  let cursor = granularity === "week" ? startOfWeek(start) : start;
  while (cursor <= end) {
    const key = trendBucketKey(cursor, granularity);
    const value = totals.get(key) ?? { opened: 0, completed: 0 };
    points.push({
      key,
      label: trendLabel(key, granularity),
      opened_tasks: value.opened,
      completed_tasks: value.completed,
    });
    if (granularity === "month") {
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1, 12);
    } else {
      cursor = addDays(cursor, granularity === "week" ? 7 : 1);
    }
  }

  return { granularity, points };
}

export function getCycleTimeReport(
  range: DateRange | null,
  scope: PersonScope = null,
): CycleTimeReport {
  const completed = periodCondition("t.completed_at", range);
  const rows = allForRange<{ duration_days: number }>(
    `SELECT MAX(julianday(t.completed_at) - julianday(t.created_at), 0) AS duration_days
       FROM tasks t
      WHERE t.status = 'Yayinlandi'
        AND t.completed_at IS NOT NULL
        AND ${completed}
        ${scopeCondition(scope)}
      ORDER BY duration_days`,
    range,
    scope,
  );
  const durations = rows.map((row) => row.duration_days).sort((a, b) => a - b);
  const bucketDefinitions: Array<{
    key: CycleTimeBucket["key"];
    label: string;
    matches: (value: number) => boolean;
  }> = [
    { key: "one_day", label: "0–1 gün", matches: (value) => value <= 1 },
    { key: "two_three", label: "2–3 gün", matches: (value) => value > 1 && value <= 3 },
    { key: "four_seven", label: "4–7 gün", matches: (value) => value > 3 && value <= 7 },
    { key: "eight_fourteen", label: "8–14 gün", matches: (value) => value > 7 && value <= 14 },
    { key: "fifteen_plus", label: "15+ gün", matches: (value) => value > 14 },
  ];

  return {
    sample_size: durations.length,
    average_days:
      durations.length === 0
        ? null
        : Math.round((durations.reduce((sum, value) => sum + value, 0) / durations.length) * 10) / 10,
    median_days: quantile(durations, 0.5),
    p75_days: quantile(durations, 0.75),
    buckets: bucketDefinitions.map(({ key, label, matches }) => ({
      key,
      label,
      task_count: durations.filter(matches).length,
    })),
  };
}

export function listDueHealthReport(
  today: string,
  scope: PersonScope = null,
): DueHealthRow[] {
  return plainList<DueHealthRow>(
    getDb()
      .prepare(
        `WITH buckets(bucket, label, sort_order) AS (
           VALUES ('overdue', 'Gecikmiş', 1),
                  ('today', 'Bugün', 2),
                  ('next_seven', 'Önümüzdeki 7 gün', 3),
                  ('later', 'Daha sonra', 4),
                  ('unscheduled', 'Tarihsiz', 5)
         )
         SELECT buckets.bucket, buckets.label, COUNT(t.id) AS task_count
           FROM buckets
           LEFT JOIN tasks t
             ON t.status != 'Yayinlandi'
            ${scopeCondition(scope)}
            AND CASE buckets.bucket
              WHEN 'overdue' THEN t.due_date IS NOT NULL AND t.due_date < :today
              WHEN 'today' THEN t.due_date = :today
              WHEN 'next_seven' THEN t.due_date > :today AND t.due_date <= date(:today, '+7 day')
              WHEN 'later' THEN t.due_date > date(:today, '+7 day')
              WHEN 'unscheduled' THEN t.due_date IS NULL
            END
          GROUP BY buckets.bucket, buckets.label, buckets.sort_order
          ORDER BY buckets.sort_order`,
      )
      .all({ today, ...scopeParams(scope) }),
  );
}

export function getReportSummary(
  range: DateRange | null,
  today: string,
  scope: PersonScope = null,
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
    ${scope ? "WHERE t.assignee_id = :personId" : ""}
  `);
  const params: Record<string, string> = { today };
  if (range) {
    params.start = range.start;
    params.end = range.end;
  }
  if (scope) params.personId = scope;
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

export function listWorkflowReport(scope: PersonScope = null): WorkflowReportRow[] {
  return plainList<WorkflowReportRow>(
    getDb()
      .prepare(
        `WITH workflow(status, sort_order) AS (
           VALUES ('Beklemede', 1), ('DevamEdiyor', 2),
                  ('Incelemede', 3), ('Onaylandi', 4)
         )
         SELECT workflow.status, COUNT(t.id) AS task_count
           FROM workflow
           LEFT JOIN tasks t ON t.status = workflow.status ${scopeCondition(scope)}
          GROUP BY workflow.status, workflow.sort_order
          ORDER BY workflow.sort_order`,
      )
      .all({ ...scopeParams(scope) }),
  );
}

export interface PriorityReportRow {
  priority: TaskPriority;
  open_tasks: number;
  overdue_tasks: number;
}

// Kişinin açık işlerinin öncelik dağılımı — "yoğun mu" sorusunun yanında
// "yoğunluğu ne kadarı acil" sorusunu cevaplar. Boş öncelikler de 0 ile döner
// ki grafik her kişide aynı 4 satırı göstersin.
export function listPriorityReport(
  today: string,
  scope: PersonScope = null,
): PriorityReportRow[] {
  return plainList<PriorityReportRow>(
    getDb()
      .prepare(
        `WITH levels(priority, sort_order) AS (
           VALUES ('Acil', 0), ('Yuksek', 1), ('Normal', 2), ('Dusuk', 3)
         )
         SELECT levels.priority,
                COUNT(t.id) AS open_tasks,
                COALESCE(SUM(CASE
                  WHEN t.due_date IS NOT NULL AND t.due_date < :today
                  THEN 1 ELSE 0 END), 0) AS overdue_tasks
           FROM levels
           LEFT JOIN tasks t
             ON t.priority = levels.priority
            AND t.status != 'Yayinlandi'
            ${scopeCondition(scope)}
          GROUP BY levels.priority, levels.sort_order
          ORDER BY levels.sort_order`,
      )
      .all({ today, ...scopeParams(scope) }),
  );
}

export function listPersonReport(
  range: DateRange | null,
  today: string,
): PersonReportRow[] {
  const opened = periodCondition("t.created_at", range);
  const completed = periodCondition("t.completed_at", range);
  const statement = getDb().prepare(`
    SELECT p.id AS person_id, p.name AS person_name,
      p.department AS department, p.active,
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
  scope: PersonScope = null,
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
      WHERE 1 = 1 ${scopeCondition(scope)}
      GROUP BY p.id, b.id
     HAVING total_tasks > 0 OR completed_tasks > 0 OR open_tasks > 0
      ORDER BY p.name, completed_tasks DESC, open_tasks DESC`,
    range,
    scope,
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
    SELECT b.id AS brand_id, b.name AS brand_name, b.cluster AS cluster,
      b.archived AS archived,
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

// Excel dökümündeki satır satır görev listesi. Rapor ekranları yalnızca SAYI
// gösteriyor ("12 tamamlandı"); dışa aktarma o sayıların arkasındaki işleri de
// taşımalı — hangi görev, hangi marka, hangi kategori, kim, ne zaman.
export interface TaskDetailRow {
  task_id: string;
  title: string;
  brand_name: string;
  cluster: string;
  content_title: string;
  content_type: string;
  assignee_name: string | null;
  department: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
  archived_at: string | null;
  cycle_days: number | null;
  overdue: number;
  opened_in_period: number;
  completed_in_period: number;
  comment_count: number;
}

/**
 * Seçili dönemle ilgili TÜM görevler: dönemde açılanlar, dönemde tamamlananlar
 * ve hâlâ açık olanlar. Üçünün birleşimi, çünkü ekrandaki özet de bu üç sayıyı
 * yan yana gösteriyor — döküm ile kartlar aynı evreni anlatsın.
 *
 * `opened_in_period` / `completed_in_period` sütunları hangi satırın hangi
 * sayıya katkı verdiğini gösterir; böylece Excel'de filtreleyip özet sayfasıyla
 * karşılaştırmak mümkün olur. Aralık verilmezse (Tüm zamanlar) her satır
 * "dönemde" sayılır.
 */
export function listTaskDetailReport(
  range: DateRange | null,
  today: string,
  scope: PersonScope = null,
): TaskDetailRow[] {
  const opened = periodCondition("t.created_at", range);
  const completed = periodCondition("t.completed_at", range);
  const statement = getDb().prepare(
    `SELECT t.id AS task_id, t.title AS title,
            b.name AS brand_name, b.cluster AS cluster,
            ci.title AS content_title, ci.type AS content_type,
            p.name AS assignee_name, p.department AS department,
            t.status, t.priority, t.due_date, t.created_at, t.completed_at,
            t.archived_at,
            CASE WHEN t.status = 'Yayinlandi' AND t.completed_at IS NOT NULL
              THEN ROUND(MAX(julianday(t.completed_at) - julianday(t.created_at), 0), 1)
            END AS cycle_days,
            CASE WHEN t.status != 'Yayinlandi'
                  AND t.due_date IS NOT NULL AND t.due_date < :today
              THEN 1 ELSE 0 END AS overdue,
            CASE WHEN ${opened} THEN 1 ELSE 0 END AS opened_in_period,
            CASE WHEN t.status = 'Yayinlandi' AND ${completed}
              THEN 1 ELSE 0 END AS completed_in_period,
            (SELECT COUNT(*) FROM comments c WHERE c.task_id = t.id) AS comment_count
       FROM tasks t
       JOIN content_items ci ON ci.id = t.content_item_id
       JOIN brands b ON b.id = ci.brand_id
       LEFT JOIN people p ON p.id = t.assignee_id
      WHERE (${opened}
             OR (t.status = 'Yayinlandi' AND t.completed_at IS NOT NULL AND ${completed})
             OR t.status != 'Yayinlandi')
        ${scopeCondition(scope)}
      ORDER BY b.name, ci.title,
               CASE t.priority
                 WHEN 'Acil' THEN 0 WHEN 'Yuksek' THEN 1 WHEN 'Normal' THEN 2 ELSE 3 END,
               (t.due_date IS NULL), t.due_date, t.title`,
  );
  return plainList<TaskDetailRow>(
    statement.all({ today, ...rangeParams(range), ...scopeParams(scope) }),
  );
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
