import { getDb, plainList, plainOne } from "@/lib/db/client";
import type { Task, TaskPriority, TaskStatus, TaskWithContext } from "@/lib/types";

// Acil→Düşük sıralaması için ORDER BY'da kullanılan CASE ifadesi.
const PRIORITY_ORDER_SQL = `CASE t.priority
  WHEN 'Acil' THEN 0 WHEN 'Yuksek' THEN 1 WHEN 'Normal' THEN 2 ELSE 3 END`;

// Yorum özeti korelasyonlu alt sorgularla geliyor (JOIN + GROUP BY yerine):
// `t.*` seçildiği için GROUP BY tüm sütunları listelemeyi gerektirirdi ve yeni
// bir sütun eklendiğinde sessizce bozulurdu. `idx_comments_task` sayesinde her
// alt sorgu indeks üzerinden çalışıyor.
//
// created_at saniye hassasiyetinde (datetime('now')); aynı saniyede yazılan iki
// yorumda sıralama belirsiz kalmasın diye `rowid` ikinci anahtar.
const LAST_COMMENT_ORDER = "ORDER BY c.created_at DESC, c.rowid DESC LIMIT 1";

const WITH_CONTEXT_SELECT = `
  SELECT t.*, p.name AS assignee_name,
         ci.title AS content_title,
         b.id AS brand_id, b.name AS brand_name,
         (SELECT COUNT(*) FROM comments c WHERE c.task_id = t.id) AS comment_count,
         (SELECT c.body FROM comments c
           WHERE c.task_id = t.id ${LAST_COMMENT_ORDER}) AS last_comment_body,
         (SELECT cp.name FROM comments c
            JOIN people cp ON cp.id = c.author_id
           WHERE c.task_id = t.id ${LAST_COMMENT_ORDER}) AS last_comment_author
  FROM tasks t
  JOIN content_items ci ON ci.id = t.content_item_id
  JOIN brands b ON b.id = ci.brand_id
  LEFT JOIN people p ON p.id = t.assignee_id
`;

export function listTasksByContent(contentItemId: string): TaskWithContext[] {
  return plainList<TaskWithContext>(
    getDb()
      .prepare(
        `${WITH_CONTEXT_SELECT} WHERE t.content_item_id = ? ORDER BY ${PRIORITY_ORDER_SQL}, t.created_at`,
      )
      .all(contentItemId),
  );
}

export function getTask(id: string): TaskWithContext | undefined {
  return plainOne<TaskWithContext>(
    getDb().prepare(`${WITH_CONTEXT_SELECT} WHERE t.id = ?`).get(id),
  );
}

// "/tasks" (Görevler) sayfası için — portföydeki tüm görevler, istemci
// tarafında filtrelenmek üzere tek seferde çekilir.
export function listAllTasks(): TaskWithContext[] {
  return plainList<TaskWithContext>(
    getDb()
      .prepare(
        `${WITH_CONTEXT_SELECT} ORDER BY ${PRIORITY_ORDER_SQL}, (t.due_date IS NULL), t.due_date, b.name`,
      )
      .all(),
  );
}

export function listTasksDueThisWeek(
  start: string,
  end: string,
): TaskWithContext[] {
  return plainList<TaskWithContext>(
    getDb()
      .prepare(
        `${WITH_CONTEXT_SELECT}
         WHERE t.due_date IS NOT NULL AND t.due_date BETWEEN ? AND ?
           AND t.status != 'Yayinlandi'
         ORDER BY t.due_date, b.name`,
      )
      .all(start, end),
  );
}

// "/calendar" (Takvim) sayfası için — verilen aralıkta (ay ızgarası, dolgu
// günleri dahil) teslim tarihi olan TÜM görevler, durumdan bağımsız.
// `listTasksDueThisWeek`'in aksine 'Yayinlandi' filtrelenmiyor: takvim geçmiş
// bir ayı gösterirken tamamlanmış iş de o günün altında görünmeli, yoksa
// geçmiş aylar olduğundan daha boş görünür. Aynı gün içinde önce en öncelikli
// görev listelensin diye sıralama günün içinde de PRIORITY_ORDER_SQL kullanır
// — hücrede yalnızca ilk birkaçı gösterilip gerisi "+N daha" ile katlanıyor.
export function listTasksDueInRange(start: string, end: string): TaskWithContext[] {
  return plainList<TaskWithContext>(
    getDb()
      .prepare(
        `${WITH_CONTEXT_SELECT}
         WHERE t.due_date IS NOT NULL AND t.due_date BETWEEN ? AND ?
         ORDER BY t.due_date, ${PRIORITY_ORDER_SQL}, b.name`,
      )
      .all(start, end),
  );
}

export function listOverdueTasks(today: string): TaskWithContext[] {
  return plainList<TaskWithContext>(
    getDb()
      .prepare(
        `${WITH_CONTEXT_SELECT}
         WHERE t.due_date IS NOT NULL AND t.due_date < ?
           AND t.status != 'Yayinlandi'
         ORDER BY t.due_date, b.name`,
      )
      .all(today),
  );
}

export function listOpenTasksByAssignee(personId: string): TaskWithContext[] {
  return plainList<TaskWithContext>(
    getDb()
      .prepare(
        `${WITH_CONTEXT_SELECT}
         WHERE t.assignee_id = ? AND t.status != 'Yayinlandi'
         ORDER BY (t.due_date IS NULL), t.due_date, b.name`,
      )
      .all(personId),
  );
}

export function createTask(input: {
  contentItemId: string;
  title: string;
  assigneeId: string | null;
  dueDate: string | null;
  priority?: TaskPriority;
}): string {
  const id = crypto.randomUUID();
  getDb()
    .prepare(
      "INSERT INTO tasks (id, content_item_id, title, assignee_id, due_date, priority) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .run(
      id,
      input.contentItemId,
      input.title,
      input.assigneeId,
      input.dueDate,
      input.priority ?? "Normal",
    );
  return id;
}

export function updateTaskRepeat(id: string, repeatDays: number | null): void {
  getDb()
    .prepare("UPDATE tasks SET repeat_days = ?, updated_at = datetime('now') WHERE id = ?")
    .run(repeatDays, id);
}

// Tekrar eden görevin bir sonraki örneğini açar. Tarih, ESKİ görevin teslim
// tarihine göre kayar (bugüne göre değil) — geç tamamlanan haftalık iş takvimi
// kaydırmasın. Tarihi yoksa bugünden itibaren hesaplanır.
export function createNextOccurrence(task: Task, today: string): string {
  const base = task.due_date ?? today;
  const d = new Date(`${base}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + (task.repeat_days ?? 0));
  const id = crypto.randomUUID();
  getDb()
    .prepare(
      `INSERT INTO tasks (id, content_item_id, title, priority, assignee_id, due_date, notes, repeat_days)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      task.content_item_id,
      task.title,
      task.priority,
      task.assignee_id,
      d.toISOString().slice(0, 10),
      task.notes,
      task.repeat_days,
    );
  return id;
}

export function updateTaskStatus(id: string, status: TaskStatus): void {
  getDb()
    .prepare(
      "UPDATE tasks SET status = ?, updated_at = datetime('now') WHERE id = ?",
    )
    .run(status, id);
}

export function updateTaskPriority(id: string, priority: TaskPriority): void {
  getDb()
    .prepare(
      "UPDATE tasks SET priority = ?, updated_at = datetime('now') WHERE id = ?",
    )
    .run(priority, id);
}

export function updateTaskDueDate(id: string, dueDate: string | null): void {
  getDb()
    .prepare("UPDATE tasks SET due_date = ?, updated_at = datetime('now') WHERE id = ?")
    .run(dueDate, id);
}

export function updateTaskAssignee(id: string, assigneeId: string | null): void {
  getDb()
    .prepare(
      "UPDATE tasks SET assignee_id = ?, updated_at = datetime('now') WHERE id = ?",
    )
    .run(assigneeId, id);
}

export function updateTaskDetails(input: {
  id: string;
  dueDate: string | null;
  notes: string | null;
}): void {
  getDb()
    .prepare(
      "UPDATE tasks SET due_date = ?, notes = ?, updated_at = datetime('now') WHERE id = ?",
    )
    .run(input.dueDate, input.notes, input.id);
}

export function deleteTask(id: string): Task | undefined {
  const db = getDb();
  const task = plainOne<Task>(
    db.prepare("SELECT * FROM tasks WHERE id = ?").get(id),
  );
  db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  return task;
}

// ---- Toplu işlemler ----
// Tek UPDATE/DELETE ile `WHERE id IN (?, ?, …)` — hepsi tek statement'ta atomik
// çalışır. Boş liste no-op. Placeholder sayısı id sayısına göre üretiliyor.

export function bulkUpdateTaskStatus(ids: string[], status: TaskStatus): void {
  if (ids.length === 0) return;
  const placeholders = ids.map(() => "?").join(", ");
  getDb()
    .prepare(
      `UPDATE tasks SET status = ?, updated_at = datetime('now') WHERE id IN (${placeholders})`,
    )
    .run(status, ...ids);
}

export function bulkUpdateTaskPriority(ids: string[], priority: TaskPriority): void {
  if (ids.length === 0) return;
  const placeholders = ids.map(() => "?").join(", ");
  getDb()
    .prepare(
      `UPDATE tasks SET priority = ?, updated_at = datetime('now') WHERE id IN (${placeholders})`,
    )
    .run(priority, ...ids);
}

export function bulkUpdateTaskAssignee(ids: string[], assigneeId: string | null): void {
  if (ids.length === 0) return;
  const placeholders = ids.map(() => "?").join(", ");
  getDb()
    .prepare(
      `UPDATE tasks SET assignee_id = ?, updated_at = datetime('now') WHERE id IN (${placeholders})`,
    )
    .run(assigneeId, ...ids);
}

export function bulkDeleteTasks(ids: string[]): void {
  if (ids.length === 0) return;
  const placeholders = ids.map(() => "?").join(", ");
  getDb().prepare(`DELETE FROM tasks WHERE id IN (${placeholders})`).run(...ids);
}
