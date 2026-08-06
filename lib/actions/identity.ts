"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { hashPassword, validatePassword, verifyPassword } from "@/lib/auth/password";
import { IDENTITY_COOKIE, getCurrentPerson } from "@/lib/identity";
import {
  createAuthSession,
  deleteAuthSession,
  deleteAuthSessionsForPerson,
} from "@/lib/repositories/authSessions";
import {
  getPersonCredentials,
  setInitialPassword,
  updatePersonPassword,
} from "@/lib/repositories/people";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

export interface IdentityActionState {
  error?: string;
}

async function replaceSession(personId: string): Promise<void> {
  const store = await cookies();
  const previousToken = store.get(IDENTITY_COOKIE)?.value;
  if (previousToken) deleteAuthSession(previousToken);
  store.delete("inturlam_pid");

  const token = createAuthSession(personId);
  store.set(IDENTITY_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: THIRTY_DAYS,
    path: "/",
  });
}

export async function loginPerson(
  _state: IdentityActionState,
  formData: FormData,
): Promise<IdentityActionState> {
  const personId = String(formData.get("personId") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const credentials = getPersonCredentials(personId);
  if (!credentials || credentials.active !== 1) return { error: "Hesap bulunamadı." };

  if (!credentials.password_hash) {
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    const passwordError = validatePassword(password);
    if (passwordError) return { error: passwordError };
    if (password !== confirmPassword) return { error: "Şifreler eşleşmiyor." };
    if (!setInitialPassword(personId, hashPassword(password))) {
      return { error: "Bu hesap için şifre az önce belirlendi. Yeni şifreyle tekrar giriş yap." };
    }
  } else if (!verifyPassword(password, credentials.password_hash)) {
    return { error: "Şifre hatalı." };
  }

  await replaceSession(personId);
  revalidatePath("/", "layout");
  redirect("/");
}

export async function changePassword(
  _state: IdentityActionState,
  formData: FormData,
): Promise<IdentityActionState> {
  const person = await getCurrentPerson();
  if (!person) return { error: "Şifre değiştirmek için giriş yapmalısın." };

  const credentials = getPersonCredentials(person.id);
  if (!credentials?.password_hash) return { error: "Hesabın mevcut şifresi bulunamadı." };

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  if (!verifyPassword(currentPassword, credentials.password_hash)) {
    return { error: "Mevcut şifre hatalı." };
  }
  const passwordError = validatePassword(newPassword);
  if (passwordError) return { error: passwordError };
  if (newPassword !== confirmPassword) return { error: "Yeni şifreler eşleşmiyor." };
  if (verifyPassword(newPassword, credentials.password_hash)) {
    return { error: "Yeni şifre mevcut şifreden farklı olmalı." };
  }

  updatePersonPassword(person.id, hashPassword(newPassword));
  deleteAuthSessionsForPerson(person.id);
  const store = await cookies();
  store.delete(IDENTITY_COOKIE);
  revalidatePath("/", "layout");
  redirect("/whoami?changed=1");
}

export async function clearIdentity() {
  const store = await cookies();
  const token = store.get(IDENTITY_COOKIE)?.value;
  if (token) deleteAuthSession(token);
  store.delete(IDENTITY_COOKIE);
  store.delete("inturlam_pid");
  revalidatePath("/", "layout");
  redirect("/whoami");
}
