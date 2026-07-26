"use server";

import { revalidatePath } from "next/cache";
import { getCurrentPerson } from "@/lib/identity";
import {
  markAllNotificationsReadForPerson,
  markNotificationRead,
} from "@/lib/repositories/notifications";

export async function markNotificationReadAction(id: string) {
  const person = await getCurrentPerson();
  if (!person) return;
  markNotificationRead(id);
  revalidatePath("/", "layout");
}

export async function markAllNotificationsReadAction() {
  const person = await getCurrentPerson();
  if (!person) return;
  markAllNotificationsReadForPerson(person.id);
  revalidatePath("/", "layout");
}
