"use server";

import { revalidatePath } from "next/cache";
import { recordActivity } from "@/lib/activity";
import { getCurrentPerson } from "@/lib/identity";
import { notifyMentions } from "@/lib/notifications";
import {
  addCommentAttachment,
  createComment,
  deleteComment,
  getCommentAuthorId,
  listAttachmentPaths,
  listCommentsByTask,
  updateCommentBody,
  type CommentWithAuthor,
} from "@/lib/repositories/comments";
import { getTask } from "@/lib/repositories/tasks";
import { deleteUploadedFile, extractImageFiles, saveImageFiles, validateImageFiles } from "@/lib/uploads";

export async function getTaskCommentsAction(taskId: string): Promise<CommentWithAuthor[]> {
  return listCommentsByTask(taskId);
}

export async function addCommentAction(formData: FormData) {
  const taskId = String(formData.get("taskId") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const images = extractImageFiles(formData);

  if (!taskId) throw new Error("Görev bulunamadı.");
  if (!body && images.length === 0) return; // boş yorum gönderme

  const person = await getCurrentPerson();
  if (!person) throw new Error("Yorum yazmak için önce kim olduğunu seç.");

  validateImageFiles(images);

  const commentId = createComment({ taskId, authorId: person.id, body });

  const saved = await saveImageFiles(images, "comments");
  for (const { filePath, originalName } of saved) {
    addCommentAttachment({ commentId, filePath, originalName });
  }

  const task = getTask(taskId);
  await recordActivity({
    action: "comment.add",
    entityType: "task",
    entityId: taskId,
    brandId: task?.brand_id ?? null,
    summary: `“${task?.title ?? "Görev"}” görevine yorum yaptı`,
  });

  // @mention edilen kişilere bildirim üret (varsa). Kendini mention etmek
  // bildirim doğurmaz — notifyMentions bunu zaten filtreler. En iyi çabadır,
  // hata olursa yutulur; yorum burada zaten başarıyla kaydedilmiş durumda.
  if (body) {
    notifyMentions({
      body,
      actor: person,
      taskId,
      taskTitle: task?.title ?? "Görev",
      brandId: task?.brand_id ?? null,
    });
  }

  revalidatePath("/", "layout");
}

export async function updateCommentAction(formData: FormData) {
  const commentId = String(formData.get("commentId") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!commentId) throw new Error("Yorum bulunamadı.");
  if (!body) throw new Error("Yorum boş olamaz.");

  const person = await getCurrentPerson();
  const authorId = getCommentAuthorId(commentId);
  if (!person || person.id !== authorId) {
    throw new Error("Sadece kendi yorumunu düzenleyebilirsin.");
  }

  updateCommentBody(commentId, body);
  revalidatePath("/", "layout");
}

export async function deleteCommentAction(commentId: string) {
  const person = await getCurrentPerson();
  const authorId = getCommentAuthorId(commentId);
  if (!person || person.id !== authorId) {
    throw new Error("Sadece kendi yorumunu silebilirsin.");
  }

  const filePaths = listAttachmentPaths(commentId);
  deleteComment(commentId);
  for (const filePath of filePaths) {
    await deleteUploadedFile(filePath);
  }
  revalidatePath("/", "layout");
}
