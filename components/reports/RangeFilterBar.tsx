"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export type RangeKey = "all" | "week" | "month" | "custom";

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "week", label: "Bu hafta" },
  { key: "month", label: "Bu ay" },
  { key: "custom", label: "Özel aralık" },
];

const inputClass =
  "min-h-11 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 dark:border-white/15 dark:bg-zinc-950";

// Hem portföy raporunda hem kişi raporunda aynı dönem seçimi kullanılıyor.
// Seçim URL'de (`?range=`) tutuluyor: sunucu tarafındaki sorgular zaten
// searchParams'tan okuyor ve rapor linki paylaşılabilir kalıyor.
export default function RangeFilterBar({
  rangeKey,
  customStart,
  customEnd,
  children,
}: {
  rangeKey: RangeKey;
  customStart: string;
  customEnd: string;
  /** Sağ tarafa eklenen sayfaya özel eylemler (yazdır, CSV vb.). */
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [start, setStart] = useState(customStart);
  const [end, setEnd] = useState(customEnd);

  const customRangeInvalid = Boolean(start && end && start > end);

  function setRange(key: RangeKey) {
    router.push(`${pathname}?range=${key}`);
  }

  function applyCustomRange() {
    if (!start || !end || customRangeInvalid) return;
    router.push(`${pathname}?range=custom&start=${start}&end=${end}`);
  }

  return (
    <section
      aria-label="Rapor filtreleri"
      className="sticky top-[calc(var(--header-h)+0.75rem)] z-20 flex flex-wrap items-center gap-2 rounded-2xl border border-black/10 bg-white/95 p-3 shadow-sm backdrop-blur print:hidden dark:border-white/10 dark:bg-zinc-900/95"
    >
      <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        Dönem
      </span>
      {RANGE_OPTIONS.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => setRange(option.key)}
          aria-pressed={rangeKey === option.key}
          className={`min-h-11 rounded-xl px-3 text-sm font-medium transition-colors ${
            rangeKey === option.key
              ? "bg-brand-600 text-white"
              : "text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
          }`}
        >
          {option.label}
        </button>
      ))}

      {rangeKey === "custom" && (
        <div className="flex w-full flex-wrap items-end gap-2 border-t border-black/5 pt-3 dark:border-white/10 lg:w-auto lg:border-0 lg:pt-0">
          <label className="grid gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            Başlangıç
            <input
              type="date"
              value={start}
              onChange={(event) => setStart(event.target.value)}
              className={inputClass}
            />
          </label>
          <label className="grid gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            Bitiş
            <input
              type="date"
              value={end}
              onChange={(event) => setEnd(event.target.value)}
              className={inputClass}
            />
          </label>
          <button
            type="button"
            onClick={applyCustomRange}
            disabled={!start || !end || customRangeInvalid}
            className="min-h-11 rounded-xl bg-brand-600 px-4 text-sm font-medium text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Uygula
          </button>
          {customRangeInvalid && (
            <span className="w-full text-xs text-rose-600 dark:text-rose-400">
              Bitiş tarihi başlangıçtan önce olamaz.
            </span>
          )}
        </div>
      )}

      <div className="ml-auto flex items-center gap-1">{children}</div>
    </section>
  );
}

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="ui-press inline-flex min-h-11 items-center gap-2 rounded-xl border border-black/10 px-3 text-sm font-medium text-zinc-700 hover:bg-black/5 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/10"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M5 2.75A.75.75 0 0 1 5.75 2h8.5a.75.75 0 0 1 .75.75V6h.75A2.25 2.25 0 0 1 18 8.25v5.5A2.25 2.25 0 0 1 15.75 16H15v1.25a.75.75 0 0 1-.75.75h-8.5a.75.75 0 0 1-.75-.75V16h-.75A2.25 2.25 0 0 1 2 13.75v-5.5A2.25 2.25 0 0 1 4.25 6H5V2.75ZM6.5 6h7V3.5h-7V6Zm0 7.5v3h7v-3h-7Z"
          clipRule="evenodd"
        />
      </svg>
      PDF / Yazdır
    </button>
  );
}
