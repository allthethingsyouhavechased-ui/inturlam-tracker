import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/constants";
import type { TaskPriority, TaskStatus, TaskWithContext } from "@/lib/types";

// Liste görünümündeki tıklanabilir sütun sıralaması. Hem /tasks hem /panom
// aynı davranışı kullansın diye burada — saf fonksiyonlar, DB'ye dokunmaz.

export type ListSortKey = "gorev" | "marka" | "oncelik" | "durum" | "atanan" | "teslim";
export type SortDir = "asc" | "desc";
export interface ListSort {
  key: ListSortKey;
  dir: SortDir;
}

// Sütun başlığındaki metin + tıklandığında ne olacağını anlatan ipucu.
export const LIST_SORT_HINT: Record<ListSortKey, string> = {
  gorev: "Göreve göre sırala (A → Z)",
  marka: "Markaya göre sırala — aynı markanın görevleri alt alta",
  oncelik: "Önceliğe göre sırala (Acil → Düşük)",
  durum: "Duruma göre sırala (Beklemede → Yayınlandı)",
  atanan: "Atanana göre sırala — atanmamışlar en sonda",
  teslim: "Teslim tarihine göre sırala — tarihsizler en sonda",
};

const collator = new Intl.Collator("tr");

// TASK_PRIORITIES düşükten yükseğe tanımlı; listede "asc" = en acil önce
// olsun istiyoruz, bu yüzden ters indeks.
function priorityRank(p: TaskPriority): number {
  return TASK_PRIORITIES.length - 1 - TASK_PRIORITIES.indexOf(p);
}

function statusRank(s: TaskStatus): number {
  return TASK_STATUSES.indexOf(s);
}

// Değeri olmayan satırlar (atanmamış görev, tarihsiz görev) yön ne olursa olsun
// hep en sonda kalır — tabloların genel beklentisi bu.
function isEmpty(t: TaskWithContext, key: ListSortKey): boolean {
  if (key === "atanan") return !t.assignee_name;
  if (key === "teslim") return !t.due_date;
  return false;
}

function compare(a: TaskWithContext, b: TaskWithContext, key: ListSortKey): number {
  switch (key) {
    case "gorev":
      return collator.compare(a.title, b.title);
    case "marka":
      // Aynı marka içinde önce projeye, sonra başlığa göre — marka bloğu kendi
      // içinde de rastgele değil, okunabilir sıralansın.
      return (
        collator.compare(a.brand_name, b.brand_name) ||
        collator.compare(a.content_title, b.content_title) ||
        collator.compare(a.title, b.title)
      );
    case "oncelik":
      return priorityRank(a.priority) - priorityRank(b.priority);
    case "durum":
      return statusRank(a.status) - statusRank(b.status);
    case "atanan":
      return collator.compare(a.assignee_name ?? "", b.assignee_name ?? "");
    case "teslim":
      return (a.due_date ?? "").localeCompare(b.due_date ?? "");
  }
}

export function sortTasksForList(
  tasks: TaskWithContext[],
  sort: ListSort,
): TaskWithContext[] {
  const factor = sort.dir === "asc" ? 1 : -1;
  return [...tasks].sort((a, b) => {
    const aEmpty = isEmpty(a, sort.key);
    const bEmpty = isEmpty(b, sort.key);
    if (aEmpty !== bEmpty) return aEmpty ? 1 : -1;
    if (aEmpty && bEmpty) return collator.compare(a.title, b.title);
    const primary = compare(a, b, sort.key) * factor;
    // Eşitlikte marka + başlık: aynı öncelikteki görevler her render'da aynı
    // sırada dursun (kararlı ve tahmin edilebilir görünüm).
    return (
      primary ||
      collator.compare(a.brand_name, b.brand_name) ||
      collator.compare(a.title, b.title)
    );
  });
}

// Başlığa tıklama döngüsü: artan → azalan → varsayılan (sıralama yok).
export function nextSort(current: ListSort | null, key: ListSortKey): ListSort | null {
  if (!current || current.key !== key) return { key, dir: "asc" };
  if (current.dir === "asc") return { key, dir: "desc" };
  return null;
}
