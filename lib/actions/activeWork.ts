"use server";

import { revalidatePath } from "next/cache";
import { getCurrentPerson } from "@/lib/identity";
import { setPersonActiveBrand } from "@/lib/repositories/activeWork";

export async function setActiveBrandAction(brandId: string | null) {
  const person = await getCurrentPerson();
  if (!person) throw new Error("Marka seçmek için önce kimliğini seçmelisin.");

  setPersonActiveBrand(person.id, brandId || null);
  revalidatePath("/team");
}
