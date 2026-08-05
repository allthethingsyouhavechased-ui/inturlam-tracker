// Departmanlar (ekip disiplinleri). Kişinin departmanı `people.department`
// sütununda tutulur — eskiden bu dosyadaki sabit bir ilk-isim listesiyle
// eşleştiriliyordu, o yüzden `/team`'den eklenen her yeni kişi kalıcı olarak
// "Diğer" satırına düşüyordu. Eski eşleme yalnızca migration'ın geri doldurma
// adımında yaşıyor (bkz. `migratePeopleDepartmentIfNeeded`, lib/db/client.ts).
export const DEPARTMENTS = [
  { id: "video", label: "Video" },
  { id: "design", label: "Tasarım" },
  { id: "social", label: "Sosyal Medya" },
  { id: "management", label: "Yönetim" },
] as const;

export type DepartmentId = (typeof DEPARTMENTS)[number]["id"];

// Departmanı atanmamış kişiler için sanal kova. Veritabanında NULL olarak
// durur; id'si hiçbir zaman `people.department`'a yazılmaz.
export const NO_DEPARTMENT = "other";
export const NO_DEPARTMENT_LABEL = "Diğer";

export type DepartmentKey = DepartmentId | typeof NO_DEPARTMENT;

export function isDepartmentId(value: unknown): value is DepartmentId {
  return DEPARTMENTS.some((department) => department.id === value);
}

// Formdan/URL'den gelen serbest değeri güvenli bir sütun değerine indirger.
export function normalizeDepartment(value: unknown): DepartmentId | null {
  return isDepartmentId(value) ? value : null;
}

export function departmentKey(value: string | null | undefined): DepartmentKey {
  return isDepartmentId(value) ? value : NO_DEPARTMENT;
}

export function departmentLabel(value: string | null | undefined): string {
  return (
    DEPARTMENTS.find((department) => department.id === value)?.label ??
    NO_DEPARTMENT_LABEL
  );
}

/**
 * Rapor satırlarını sabit departman sırasına dizer (Video → Tasarım → Sosyal
 * Medya → Yönetim → Diğer) ve o dönemde satırı olmayan departman için `empty()`
 * ile sıfır satırı üretir — tablo her dönem aynı satırları göstersin, işi
 * olmayan departman "kayboldu" gibi görünmesin. "Diğer" yalnızca gerçekten
 * satırı varsa eklenir (kimsesiz bir sanal kova sürekli görünmesin).
 */
export function withAllDepartments<T extends { department: DepartmentKey }>(
  rows: T[],
  empty: (department: DepartmentId) => T,
): T[] {
  const byKey = new Map(rows.map((row) => [row.department, row]));
  const ordered = DEPARTMENTS.map(
    (department) => byKey.get(department.id) ?? empty(department.id),
  );
  const unassigned = byKey.get(NO_DEPARTMENT);
  return unassigned ? [...ordered, unassigned] : ordered;
}

export interface DepartmentRow<T> {
  id: DepartmentKey;
  label: string;
  people: T[];
}

// Kişileri departmanlarına göre sabit sırada gruplar. Departmanı olmayanlar
// gizlenmez, sona "Diğer" satırında eklenir — boş departman satırı üretilmez.
export function groupPeopleByDepartment<T extends { department: string | null }>(
  people: T[],
): DepartmentRow<T>[] {
  const rows: DepartmentRow<T>[] = DEPARTMENTS.map((department) => ({
    id: department.id,
    label: department.label,
    people: people.filter((person) => person.department === department.id),
  }));

  const unassigned = people.filter((person) => !isDepartmentId(person.department));
  if (unassigned.length > 0) {
    rows.push({ id: NO_DEPARTMENT, label: NO_DEPARTMENT_LABEL, people: unassigned });
  }

  return rows;
}
