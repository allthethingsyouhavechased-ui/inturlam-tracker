"use server";

import { revalidatePath } from "next/cache";
import { createPerson, setPersonActive } from "@/lib/repositories/people";

export async function createPersonAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("İsim zorunlu.");

  createPerson(name);
  revalidatePath("/", "layout");
}

export async function deactivatePersonAction(personId: string) {
  setPersonActive(personId, false);
  revalidatePath("/", "layout");
}

export async function reactivatePersonAction(personId: string) {
  setPersonActive(personId, true);
  revalidatePath("/", "layout");
}
