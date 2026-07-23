import { getDb, plainList } from "@/lib/db/client";
import type { CommentAttachment } from "@/lib/types";

export interface CommentWithAuthor {
  id: string;
  task_id: string;
  author_id: string;
  author_name: string;
  body: string;
  created_at: string;
  attachments: CommentAttachment[];
}

export function listCommentsByTask(taskId: string): CommentWithAuthor[] {
  const comments = plainList<Omit<CommentWithAuthor, "attachments">>(
    getDb()
      .prepare(
        `SELECT c.*, p.name AS author_name
         FROM comments c
         JOIN people p ON p.id = c.author_id
         WHERE c.task_id = ?
         ORDER BY c.created_at`,
      )
      .all(taskId),
  );
  if (comments.length === 0) return [];

  const placeholders = comments.map(() => "?").join(",");
  const attachments = plainList<CommentAttachment>(
    getDb()
      .prepare(
        `SELECT * FROM comment_attachments WHERE comment_id IN (${placeholders}) ORDER BY created_at`,
      )
      .all(...comments.map((c) => c.id)),
  );
  const byComment = new Map<string, CommentAttachment[]>();
  for (const a of attachments) {
    const list = byComment.get(a.comment_id) ?? [];
    list.push(a);
    byComment.set(a.comment_id, list);
  }
  return comments.map((c) => ({ ...c, attachments: byComment.get(c.id) ?? [] }));
}

export function createComment(input: {
  taskId: string;
  authorId: string;
  body: string;
}): string {
  const id = crypto.randomUUID();
  getDb()
    .prepare(
      "INSERT INTO comments (id, task_id, author_id, body) VALUES (?, ?, ?, ?)",
    )
    .run(id, input.taskId, input.authorId, input.body);
  return id;
}

export function addCommentAttachment(input: {
  commentId: string;
  filePath: string;
  originalName: string | null;
}): void {
  const id = crypto.randomUUID();
  getDb()
    .prepare(
      "INSERT INTO comment_attachments (id, comment_id, file_path, original_name) VALUES (?, ?, ?, ?)",
    )
    .run(id, input.commentId, input.filePath, input.originalName);
}
