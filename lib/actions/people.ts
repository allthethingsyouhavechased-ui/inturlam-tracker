"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createPerson,
  getPerson,
  setPersonActive,
  updatePersonProfile,
} from "@/lib/repositories/people";
import { saveImageFiles, validateImageFiles } from "@/lib/uploads";

function optionalText(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

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

export async function updatePersonProfileAction(formData: FormData) {
  const id = String(formData.get("personId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const title = optionalText(formData.get("title"));
  const bio = optionalText(formData.get("bio"));

  if (!id) throw new Error("Kişi bulunamadı.");
  if (!name) throw new Error("İsim zorunlu.");
  if (name.length > 80) throw new Error("İsim en fazla 80 karakter olabilir.");
  if ((title?.length ?? 0) > 120) throw new Error("Unvan en fazla 120 karakter olabilir.");
  if ((bio?.length ?? 0) > 1000) throw new Error("Tanıtım en fazla 1000 karakter olabilir.");

  const person = getPerson(id);
  if (!person) throw new Error("Kişi bulunamadı.");

  const avatarEntry = formData.get("avatar");
  const avatar = avatarEntry instanceof File && avatarEntry.size > 0 ? avatarEntry : null;
  if (avatar) validateImageFiles([avatar]);
  const savedAvatar = avatar ? (await saveImageFiles([avatar], "people"))[0] : null;

  updatePersonProfile({
    id,
    name,
    title,
    bio,
    avatarPath: savedAvatar?.filePath ?? person.avatar_path,
  });
  revalidatePath("/", "layout");
  revalidatePath(`/team/${id}`);
  redirect(`/team/${encodeURIComponent(id)}?saved=1`);
}
