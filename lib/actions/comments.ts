"use server";

import { revalidatePath } from "next/cache";
import { getCurrentPerson } from "@/lib/identity";
import { createComment } from "@/lib/repositories/comments";

export async function addCommentAction(formData: FormData) {
  const taskId = String(formData.get("taskId") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!taskId) throw new Error("Görev bulunamadı.");
  if (!body) return; // boş yorum gönderme

  const person = await getCurrentPerson();
  if (!person) throw new Error("Yorum yazmak için önce kim olduğunu seç.");

  createComment({ taskId, authorId: person.id, body });
  revalidatePath("/", "layout");
}
