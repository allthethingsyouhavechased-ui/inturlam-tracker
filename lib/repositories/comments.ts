import { getDb, plainList } from "@/lib/db/client";

export interface CommentWithAuthor {
  id: string;
  task_id: string;
  author_id: string;
  author_name: string;
  body: string;
  created_at: string;
}

export function listCommentsByTask(taskId: string): CommentWithAuthor[] {
  return plainList<CommentWithAuthor>(
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
