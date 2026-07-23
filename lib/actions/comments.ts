"use server";

import { revalidatePath } from "next/cache";
import fs from "node:fs/promises";
import path from "node:path";
import { getCurrentPerson } from "@/lib/identity";
import { addCommentAttachment, createComment } from "@/lib/repositories/comments";

const MAX_FILES = 6;
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
};

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "comments");

export async function addCommentAction(formData: FormData) {
  const taskId = String(formData.get("taskId") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const images = formData
    .getAll("images")
    .filter((v): v is File => v instanceof File && v.size > 0)
    .slice(0, MAX_FILES);

  if (!taskId) throw new Error("Görev bulunamadı.");
  if (!body && images.length === 0) return; // boş yorum gönderme

  const person = await getCurrentPerson();
  if (!person) throw new Error("Yorum yazmak için önce kim olduğunu seç.");

  for (const image of images) {
    if (image.size > MAX_FILE_SIZE) {
      throw new Error(`${image.name}: dosya çok büyük (max 8MB).`);
    }
    if (!(image.type in ALLOWED_EXTENSIONS)) {
      throw new Error(`${image.name}: sadece görsel dosyaları (PNG/JPG/GIF/WEBP) yüklenebilir.`);
    }
  }

  const commentId = createComment({ taskId, authorId: person.id, body });

  if (images.length > 0) {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    for (const image of images) {
      const ext = ALLOWED_EXTENSIONS[image.type];
      const fileName = `${crypto.randomUUID()}.${ext}`;
      const buffer = Buffer.from(await image.arrayBuffer());
      await fs.writeFile(path.join(UPLOAD_DIR, fileName), buffer);
      addCommentAttachment({
        commentId,
        filePath: `/uploads/comments/${fileName}`,
        originalName: image.name || null,
      });
    }
  }

  revalidatePath("/", "layout");
}
