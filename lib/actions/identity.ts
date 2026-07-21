"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { IDENTITY_COOKIE } from "@/lib/identity";
import { getPerson } from "@/lib/repositories/people";

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function setIdentity(formData: FormData) {
  const personId = String(formData.get("personId") ?? "");
  const person = getPerson(personId);
  if (!person) {
    throw new Error("Geçersiz kişi seçimi.");
  }
  const store = await cookies();
  store.set(IDENTITY_COOKIE, personId, {
    httpOnly: false,
    sameSite: "lax",
    maxAge: ONE_YEAR,
    path: "/",
  });
  revalidatePath("/", "layout");
  redirect("/");
}

export async function clearIdentity() {
  const store = await cookies();
  store.delete(IDENTITY_COOKIE);
  revalidatePath("/", "layout");
  redirect("/whoami");
}
