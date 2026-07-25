"use server";

import { revalidatePath } from "next/cache";
import { CLUSTERS, COVER_TEST_VERDICTS } from "@/lib/constants";
import { createBrand, setBrandArchived, updateBrand } from "@/lib/repositories/brands";
import type { Cluster, CoverTestVerdict } from "@/lib/types";

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
  const cluster = String(formData.get("cluster") ?? "") as Cluster;

  if (!name) throw new Error("Marka adı zorunlu.");
  if (!CLUSTERS.some((c) => c.id === cluster)) throw new Error("Geçersiz kategori.");

  createBrand({
    name,
    cluster,
    instagramHandle: cleanValue(formData.get("instagramHandle")),
  });

  revalidatePath("/", "layout");
}

export async function updateBrandAction(formData: FormData) {
  const id = String(formData.get("brandId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const cluster = String(formData.get("cluster") ?? "") as Cluster;

  if (!id) throw new Error("Marka bulunamadı.");
  if (!name) throw new Error("Marka adı zorunlu.");
  if (!CLUSTERS.some((c) => c.id === cluster)) throw new Error("Geçersiz kategori.");

  const verdictRaw = cleanValue(formData.get("coverTestVerdict"));
  const coverTestVerdict =
    verdictRaw && (COVER_TEST_VERDICTS as string[]).includes(verdictRaw)
      ? (verdictRaw as CoverTestVerdict)
      : null;

  updateBrand({
    id,
    name,
    cluster,
    instagramHandle: cleanValue(formData.get("instagramHandle")),
    followerCount: cleanInt(formData.get("followerCount")),
    postCount: cleanInt(formData.get("postCount")),
    medianReelViews: cleanValue(formData.get("medianReelViews")),
    coverTestVerdict,
    coverTestNote: cleanValue(formData.get("coverTestNote")),
    keyFinding: cleanValue(formData.get("keyFinding")),
    firstAction: cleanValue(formData.get("firstAction")),
    tier: cleanValue(formData.get("tier")),
  });

  revalidatePath("/", "layout");
}

export async function archiveBrandAction(brandId: string) {
  setBrandArchived(brandId, true);
  revalidatePath("/", "layout");
}

export async function unarchiveBrandAction(brandId: string) {
  setBrandArchived(brandId, false);
  revalidatePath("/", "layout");
}
