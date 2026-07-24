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

export function listInactivePeople(): Person[] {
  return plainList<Person>(
    getDb().prepare("SELECT * FROM people WHERE active = 0 ORDER BY name").all(),
  );
}

export function createPerson(name: string): string {
  const id = crypto.randomUUID();
  getDb().prepare("INSERT INTO people (id, name) VALUES (?, ?)").run(id, name);
  return id;
}

export function setPersonActive(id: string, active: boolean): void {
  getDb()
    .prepare("UPDATE people SET active = ? WHERE id = ?")
    .run(active ? 1 : 0, id);
}
