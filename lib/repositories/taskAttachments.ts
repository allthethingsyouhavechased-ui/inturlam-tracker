import { getDb, plainList, plainOne } from "@/lib/db/client";
import type { TaskAttachment } from "@/lib/types";

export function listAttachmentsByTask(taskId: string): TaskAttachment[] {
  return plainList<TaskAttachment>(
    getDb()
      .prepare("SELECT * FROM task_attachments WHERE task_id = ? ORDER BY created_at")
      .all(taskId),
  );
}

export function addTaskAttachment(input: {
  taskId: string;
  filePath: string;
  originalName: string | null;
}): void {
  const id = crypto.randomUUID();
  getDb()
    .prepare(
      "INSERT INTO task_attachments (id, task_id, file_path, original_name) VALUES (?, ?, ?, ?)",
    )
    .run(id, input.taskId, input.filePath, input.originalName);
}

export function getTaskAttachment(id: string): TaskAttachment | undefined {
  return plainOne<TaskAttachment>(
    getDb().prepare("SELECT * FROM task_attachments WHERE id = ?").get(id),
  );
}

export function deleteTaskAttachment(id: string): void {
  getDb().prepare("DELETE FROM task_attachments WHERE id = ?").run(id);
}
