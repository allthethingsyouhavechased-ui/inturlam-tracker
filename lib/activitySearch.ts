import type { ActivityEntry } from "@/lib/types";

function normalizeSearchText(value: string): string {
  return value.trim().toLocaleLowerCase("tr-TR");
}

export function filterActivityEntries(
  entries: ActivityEntry[],
  query: string,
): ActivityEntry[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return entries;

  return entries.filter((entry) =>
    normalizeSearchText(
      [entry.actor_name, entry.summary, entry.action, entry.entity_type]
        .filter(Boolean)
        .join(" "),
    ).includes(normalizedQuery),
  );
}
