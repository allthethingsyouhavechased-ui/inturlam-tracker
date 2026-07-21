import { getDb, plainList, plainOne } from "@/lib/db/client";
import type { Person } from "@/lib/types";

export function listActivePeople(): Person[] {
  return plainList<Person>(
    getDb().prepare("SELECT * FROM people WHERE active = 1 ORDER BY name").all(),
  );
}

export function getPerson(id: string): Person | undefined {
  return plainOne<Person>(
    getDb().prepare("SELECT * FROM people WHERE id = ?").get(id),
  );
}
