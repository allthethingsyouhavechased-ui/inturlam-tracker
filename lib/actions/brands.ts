"use server";

import { revalidatePath } from "next/cache";
import { CLUSTERS } from "@/lib/constants";
import { createBrand, setBrandArchived } from "@/lib/repositories/brands";
import type { Cluster } from "@/lib/types";

function cleanValue(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim();
  return s.length > 0 ? s : null;
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

export async function archiveBrandAction(brandId: string) {
  setBrandArchived(brandId, true);
  revalidatePath("/", "layout");
}

export async function unarchiveBrandAction(brandId: string) {
  setBrandArchived(brandId, false);
  revalidatePath("/", "layout");
}
