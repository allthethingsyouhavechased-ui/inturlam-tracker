"use server";

import { revalidatePath } from "next/cache";
import { recordActivity } from "@/lib/activity";
import { resolveClusterFromForm } from "@/lib/clusters";
import { todayISO } from "@/lib/date";
import {
  createBrand,
  getBrand,
  setBrandArchived,
  updateBrand,
} from "@/lib/repositories/brands";

function cleanValue(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim();
  return s.length > 0 ? s : null;
}

// Takipçi/gönderi gibi sayılar Türkçe binlik ayracıyla ("12.345") girilebilir —
// rakam dışındaki her şeyi at, boşsa null.
function cleanInt(value: FormDataEntryValue | null): number | null {
  const digits = String(value ?? "").replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = Number.parseInt(digits, 10);
  return Number.isFinite(n) ? n : null;
}

export async function createBrandAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Marka adı zorunlu.");
  const cluster = await resolveClusterFromForm(formData);

  const id = createBrand({
    name,
    cluster,
    instagramHandle: cleanValue(formData.get("instagramHandle")),
  });

  await recordActivity({
    action: "brand.create",
    entityType: "brand",
    entityId: id,
    brandId: id,
    summary: `“${name}” markasını oluşturdu`,
  });

  revalidatePath("/", "layout");
}

export async function updateBrandAction(formData: FormData) {
  const id = String(formData.get("brandId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  if (!id) throw new Error("Marka bulunamadı.");
  if (!name) throw new Error("Marka adı zorunlu.");
  const cluster = await resolveClusterFromForm(formData);

  updateBrand({
    id,
    name,
    cluster,
    instagramHandle: cleanValue(formData.get("instagramHandle")),
    followerCount: cleanInt(formData.get("followerCount")),
    postCount: cleanInt(formData.get("postCount")),
    keyFinding: cleanValue(formData.get("keyFinding")),
    tier: cleanValue(formData.get("tier")),
    today: todayISO(),
  });

  await recordActivity({
    action: "brand.update",
    entityType: "brand",
    entityId: id,
    brandId: id,
    summary: `“${name}” marka bilgilerini güncelledi`,
  });

  revalidatePath("/", "layout");
}

export async function archiveBrandAction(brandId: string) {
  const brand = getBrand(brandId);
  setBrandArchived(brandId, true);
  await recordActivity({
    action: "brand.archive",
    entityType: "brand",
    entityId: brandId,
    brandId,
    summary: `“${brand?.name ?? "Marka"}” markasını arşivledi`,
  });
  revalidatePath("/", "layout");
}

export async function unarchiveBrandAction(brandId: string) {
  const brand = getBrand(brandId);
  setBrandArchived(brandId, false);
  await recordActivity({
    action: "brand.unarchive",
    entityType: "brand",
    entityId: brandId,
    brandId,
    summary: `“${brand?.name ?? "Marka"}” markasını arşivden çıkardı`,
  });
  revalidatePath("/", "layout");
}
