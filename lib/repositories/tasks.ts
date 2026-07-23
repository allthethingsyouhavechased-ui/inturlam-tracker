import { getDb, plainList, plainOne } from "@/lib/db/client";
import type { Task, TaskPriority, TaskStatus, TaskWithContext } from "@/lib/types";

// Acil→Düşük sıralaması için ORDER BY'da kullanılan CASE ifadesi.
const PRIORITY_ORDER_SQL = `CASE t.priority
  WHEN 'Acil' THEN 0 WHEN 'Yuksek' THEN 1 WHEN 'Normal' THEN 2 ELSE 3 END`;

const WITH_CONTEXT_SELECT = `
  SELECT t.*, p.name AS assignee_name,
         ci.title AS content_title,
         b.id AS brand_id, b.name AS brand_name
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
