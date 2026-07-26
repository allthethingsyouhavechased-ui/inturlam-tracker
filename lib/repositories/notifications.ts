import { getDb, plainList, plainOne } from "@/lib/db/client";
import type { Notification } from "@/lib/types";

export interface NewNotification {
  recipientId: string;
  recipientName: string | null;
  actorId: string | null;
  actorName: string | null;
  taskId: string | null;
  brandId: string | null;
  summary: string;
}

export function createNotification(input: NewNotification): string {
  const id = crypto.randomUUID();
  getDb()
    .prepare(
      `INSERT INTO notifications
         (id, recipient_id, recipient_name, actor_id, actor_name, task_id, brand_id, summary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.recipientId,
      input.recipientName,
      input.actorId,
      input.actorName,
      input.taskId,
      input.brandId,
      input.summary,
    );
  return id;
}

export function listNotificationsForPerson(
  personId: string,
  limit = 20,
): Notification[] {
  return plainList<Notification>(
    getDb()
      .prepare(
        `SELECT * FROM notifications
         WHERE recipient_id = ?
         ORDER BY created_at DESC, rowid DESC LIMIT ?`,
      )
      .all(personId, limit),
  );
}

export function countUnreadForPerson(personId: string): number {
  const { n } = plainOne<{ n: number }>(
    getDb()
      .prepare(
        `SELECT COUNT(*) AS n FROM notifications WHERE recipient_id = ? AND read = 0`,
      )
      .get(personId),
  )!;
  return n;
}

export function markNotificationRead(id: string): void {
  getDb().prepare(`UPDATE notifications SET read = 1 WHERE id = ?`).run(id);
}

export function markAllNotificationsReadForPerson(personId: string): void {
  getDb()
    .prepare(`UPDATE notifications SET read = 1 WHERE recipient_id = ? AND read = 0`)
    .run(personId);
}
