"use client";

import { type FormEvent, useMemo, useState } from "react";
import ActivityFeed from "@/components/ActivityFeed";
import { filterActivityEntries } from "@/lib/activitySearch";
import type { ActivityEntry } from "@/lib/types";

export default function ActivitySearch({ entries }: { entries: ActivityEntry[] }) {
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const filteredEntries = useMemo(
    () => filterActivityEntries(entries, query),
    [entries, query],
  );

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery(draftQuery.trim());
  }

  function clearSearch() {
    setDraftQuery("");
    setQuery("");
  }

  return (
    <div className="space-y-3">
      <form
        role="search"
        aria-label="Aktivitelerde ara"
        onSubmit={submitSearch}
        className="flex flex-col gap-2 rounded-2xl border border-black/10 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-zinc-900 sm:flex-row"
      >
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Aktivite ara</span>
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
          >
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 3.473 9.768l3.63 3.63a.75.75 0 1 0 1.06-1.06l-3.63-3.63A5.5 5.5 0 0 0 9 3.5ZM5 9a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z" clipRule="evenodd" />
          </svg>
          <input
            type="search"
            value={draftQuery}
            onChange={(event) => setDraftQuery(event.target.value)}
            placeholder="Kişi veya aktivite içinde ara…"
            className="min-h-11 w-full rounded-xl border border-black/10 bg-zinc-50 pl-10 pr-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 dark:border-white/15 dark:bg-zinc-950"
          />
        </label>
        <div className="flex gap-2">
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="ui-press min-h-11 rounded-xl px-4 text-sm font-medium text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
            >
              Temizle
            </button>
          )}
          <button
            type="submit"
            className="ui-press min-h-11 flex-1 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700 sm:flex-none"
          >
            Ara
          </button>
        </div>
      </form>

      {query && (
        <p role="status" className="text-xs text-zinc-500 dark:text-zinc-400">
          “{query}” için {filteredEntries.length} sonuç
        </p>
      )}

      <div className="rounded-xl border border-black/10 bg-white p-2 dark:border-white/10 dark:bg-zinc-900">
        <ActivityFeed
          entries={filteredEntries}
          emptyText={
            query
              ? "Bu aramayla eşleşen aktivite bulunamadı."
              : "Henüz kayıtlı hareket yok. Bir görev oluştur, durum değiştir ya da yorum yaz — burada görünecek."
          }
        />
      </div>
    </div>
  );
}
