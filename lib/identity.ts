import { cookies } from "next/headers";
import { cache } from "react";
import { getPerson } from "@/lib/repositories/people";
import type { Person } from "@/lib/types";

export const IDENTITY_COOKIE = "inturlam_pid";

export const getCurrentPerson = cache(async (): Promise<Person | null> => {
  const store = await cookies();
  const id = store.get(IDENTITY_COOKIE)?.value;
  if (!id) return null;
  const person = getPerson(id);
  return person && person.active === 1 ? person : null;
});
