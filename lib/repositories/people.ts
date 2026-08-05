import { getDb, plainList, plainOne } from "@/lib/db/client";
import { DEPARTMENTS, NO_DEPARTMENT, type DepartmentKey } from "@/lib/departments";
import type { Person } from "@/lib/types";

// `DEPARTMENTS` id'leri kod sabiti (kullanıcı girdisi DEĞİL), bu yüzden SQL'e
// doğrudan gömülüyor — parametre listesi departman sayısına göre değişken
// uzunlukta olurdu ve her sorguda ayrı ayrı bağlanması gerekirdi.
const KNOWN_DEPARTMENT_LIST = DEPARTMENTS.map((department) => `'${department.id}'`).join(", ");

/**
 * `people.department` değerini rapor kovasına çevirir: tanınmayan ya da boş
 * değerlerin hepsi "Diğer"e düşer — arayüzdeki `departmentKey()` ile aynı kural,
 * sadece SQL tarafında. `column` tam sütun adı olmalı (`p.department` gibi).
 */
export function departmentBucketExpression(column: string): string {
  return `CASE WHEN ${column} IN (${KNOWN_DEPARTMENT_LIST})
            THEN ${column} ELSE '${NO_DEPARTMENT}' END`;
}

/**
 * Verilen departmandaki kişileri seçen koşul. Departman GÖREVİN değil KİŞİNİN
 * alanı olduğu için görev sorguları bu alt sorguyla daraltılıyor; `column`
 * çağıranın atanan sütunu (`t.assignee_id` gibi). Sonuç olarak **atanmamış
 * görevler hiçbir departmanın raporuna girmez**.
 *
 * Gerçek bir departman id'si için sorgu `:department` adlı parametreyi bekler
 * ("Diğer" kovası parametresizdir — koşul sabit bir NOT IN listesi).
 */
export function departmentPeopleCondition(department: DepartmentKey, column: string): string {
  return department === NO_DEPARTMENT
    ? `${column} IN (SELECT id FROM people
                      WHERE department IS NULL
                         OR department NOT IN (${KNOWN_DEPARTMENT_LIST}))`
    : `${column} IN (SELECT id FROM people WHERE department = :department)`;
}

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

export function createPerson(name: string, department: string | null = null): string {
  const id = crypto.randomUUID();
  getDb()
    .prepare("INSERT INTO people (id, name, department) VALUES (?, ?, ?)")
    .run(id, name, department);
  return id;
}

export function updatePersonProfile(input: {
  id: string;
  name: string;
  title: string | null;
  bio: string | null;
  department: string | null;
  avatarPath: string | null;
}): void {
  getDb()
    .prepare(
      `UPDATE people
          SET name = ?, title = ?, bio = ?, department = ?, avatar_path = ?
        WHERE id = ?`,
    )
    .run(
      input.name,
      input.title,
      input.bio,
      input.department,
      input.avatarPath,
      input.id,
    );
}

export function setPersonActive(id: string, active: boolean): void {
  getDb()
    .prepare("UPDATE people SET active = ? WHERE id = ?")
    .run(active ? 1 : 0, id);
}
