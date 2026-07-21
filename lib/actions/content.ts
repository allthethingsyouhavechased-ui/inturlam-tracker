"use server";

import { revalidatePath } from "next/cache";
import { CONTENT_STATUSES, CONTENT_TYPES } from "@/lib/constants";
import {
  createContentItem,
  updateContentStatus,
} from "@/lib/repositories/content";
import type { ContentStatus, ContentType } from "@/lib/types";

function cleanDate(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim();
  return s.length > 0 ? s : null;
}

export async function createContentItemAction(formData: FormData) {
  const brandId = String(formData.get("brandId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "") as ContentType;

  if (!brandId) throw new Error("Marka bulunamadı.");
  if (!title) throw new Error("Başlık zorunlu.");
  if (!CONTENT_TYPES.includes(type)) throw new Error("Geçersiz içerik türü.");

  createContentItem({
    brandId,
    title,
    type,
    targetDate: cleanDate(formData.get("targetDate")),
  });

  revalidatePath("/", "layout");
}

export async function setContentStatusAction(
  contentId: string,
  status: ContentStatus,
) {
  if (!CONTENT_STATUSES.includes(status)) {
    throw new Error("Geçersiz durum.");
  }
  updateContentStatus(contentId, status);
  revalidatePath("/", "layout");
}
