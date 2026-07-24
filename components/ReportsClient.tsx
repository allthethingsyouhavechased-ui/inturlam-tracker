"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { downloadCSV, toCSV } from "@/lib/csv";
import type { BrandReportRow, PersonReportRow } from "@/lib/repositories/reports";

export type RangeKey = "all" | "week" | "month" | "custom";

export interface PersonReportView extends PersonReportRow {
  brands: { brand_id: string; brand_name: string; total_tasks: number; completed_tasks: number }[];
}

export interface BrandReportView extends BrandReportRow {
  people: { person_id: string; person_name: string; total_tasks: number; completed_tasks: number }[];
}

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "week", label: "Bu hafta" },
  { key: "month", label: "Bu ay" },
  { key: "custom", label: "Özel aralık" },
];

const inputClass =
  "rounded-md border border-black/10 bg-white px-2 py-1 text-xs outline-none focus:border-indigo-500 dark:border-white/15 dark:bg-zinc-900";

export default function ReportsClient({
  people,
  brands,
  rangeKey,
  customStart,
  customEnd,
}: {
  people: PersonReportView[];
  brands: BrandReportView[];
  rangeKey: RangeKey;
  customStart: string;
  customEnd: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [hideArchived, setHideArchived] = useState(false);
  const [start, setStart] = useState(customStart);
  const [end, setEnd] = useState(customEnd);

  function setRange(key: RangeKey) {
    if (key === "custom") return;
    router.push(`${pathname}?range=${key}`);
  }

  function applyCustomRange() {
    if (!start || !end) return;
    router.push(`${pathname}?range=custom&start=${start}&end=${end}`);
  }

  const visibleBrands = hideArchived ? brands.filter((b) => b.archived === 0) : brands;

  function exportPeopleCSV() {
    const csv = toCSV(people, [
      { key: "person_name", label: "Kişi" },
      { key: "total_tasks", label: "Toplam Görev" },
      { key: "completed_tasks", label: "Tamamlanan" },
      { key: "open_tasks", label: "Açık" },
      { key: "overdue_tasks", label: "Gecikmiş" },
    ]);
    downloadCSV("kisi-raporu.csv", csv);
  }

  function exportBrandsCSV() {
    const csv = toCSV(visibleBrands, [
      { key: "brand_name", label: "Marka" },
      { key: "total_content", label: "İçerik Sayısı" },
      { key: "total_tasks", label: "Toplam Görev" },
      { key: "completed_tasks", label: "Tamamlanan" },
      { key: "open_tasks", label: "Açık" },
    ]);
    downloadCSV("marka-raporu.csv", csv);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-black/10 bg-white p-3 text-sm print:hidden dark:border-white/10 dark:bg-zinc-900">
        <span className="text-xs font-medium text-zinc-500">Tarih aralığı:</span>
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setRange(opt.key)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              rangeKey === opt.key
                ? "bg-indigo-600 text-white"
                : "bg-black/5 text-zinc-600 hover:bg-black/10 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/20"
            }`}
          >
            {opt.label}
          </button>
        ))}
        {rangeKey === "custom" && (
          <span className="flex items-center gap-1.5">
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className={inputClass}
            />
            <span className="text-zinc-400">–</span>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className={inputClass}
            />
            <button
              type="button"
              onClick={applyCustomRange}
              className="rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-500"
            >
              Uygula
            </button>
          </span>
        )}
        <label className="ml-auto flex items-center gap-1.5 text-xs text-zinc-500">
          <input
            type="checkbox"
            checked={hideArchived}
            onChange={(e) => setHideArchived(e.target.checked)}
          />
          Arşivlenmiş markaları gizle
        </label>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-md px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
        >
          Yazdır
        </button>
      </div>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Kişi bazlı
          </h2>
          <button
            type="button"
            onClick={exportPeopleCSV}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-500 print:hidden"
          >
            CSV indir
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-xs uppercase tracking-wider text-zinc-400 dark:border-white/10">
                <th className="px-3 py-2 font-medium">Kişi</th>
                <th className="px-3 py-2 font-medium">Toplam</th>
                <th className="px-3 py-2 font-medium">Tamamlanan</th>
                <th className="px-3 py-2 font-medium">Açık</th>
                <th className="px-3 py-2 font-medium">Gecikmiş</th>
              </tr>
            </thead>
            <tbody>
              {people.map((p) => (
                <tr
                  key={p.person_id}
                  className="border-b border-black/5 last:border-0 dark:border-white/5"
                >
                  <td className="px-3 py-2">
                    <details>
                      <summary className="cursor-pointer font-medium">
                        {p.person_name}
                      </summary>
                      {p.brands.length > 0 && (
                        <ul className="mt-1 space-y-0.5 pl-3 text-xs text-zinc-500">
                          {p.brands.map((b) => (
                            <li key={b.brand_id}>
                              {b.brand_name}: {b.total_tasks} görev ({b.completed_tasks}{" "}
                              tamamlandı)
                            </li>
                          ))}
                        </ul>
                      )}
                    </details>
                  </td>
                  <td className="px-3 py-2 tabular-nums">{p.total_tasks}</td>
                  <td className="px-3 py-2 tabular-nums">{p.completed_tasks}</td>
                  <td className="px-3 py-2 tabular-nums">{p.open_tasks}</td>
                  <td className="px-3 py-2 tabular-nums">
                    {p.overdue_tasks > 0 ? (
                      <span className="font-medium text-rose-600 dark:text-rose-400">
                        {p.overdue_tasks}
                      </span>
                    ) : (
                      p.overdue_tasks
                    )}
                  </td>
                </tr>
              ))}
              {people.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-zinc-400">
                    Kayıt yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Marka bazlı
          </h2>
          <button
            type="button"
            onClick={exportBrandsCSV}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-500 print:hidden"
          >
            CSV indir
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-xs uppercase tracking-wider text-zinc-400 dark:border-white/10">
                <th className="px-3 py-2 font-medium">Marka</th>
                <th className="px-3 py-2 font-medium">İçerik</th>
                <th className="px-3 py-2 font-medium">Toplam Görev</th>
                <th className="px-3 py-2 font-medium">Tamamlanan</th>
                <th className="px-3 py-2 font-medium">Açık</th>
              </tr>
            </thead>
            <tbody>
              {visibleBrands.map((b) => (
                <tr
                  key={b.brand_id}
                  className="border-b border-black/5 last:border-0 dark:border-white/5"
                >
                  <td className="px-3 py-2">
                    <details>
                      <summary className="cursor-pointer font-medium">
                        {b.brand_name}
                        {b.archived === 1 && (
                          <span className="ml-1.5 rounded-full bg-black/5 px-1.5 py-0.5 text-[10px] font-normal text-zinc-500 dark:bg-white/10">
                            arşiv
                          </span>
                        )}
                      </summary>
                      {b.people.length > 0 && (
                        <ul className="mt-1 space-y-0.5 pl-3 text-xs text-zinc-500">
                          {b.people.map((p) => (
                            <li key={p.person_id}>
                              {p.person_name}: {p.total_tasks} görev ({p.completed_tasks}{" "}
                              tamamlandı)
                            </li>
                          ))}
                        </ul>
                      )}
                    </details>
                  </td>
                  <td className="px-3 py-2 tabular-nums">{b.total_content}</td>
                  <td className="px-3 py-2 tabular-nums">{b.total_tasks}</td>
                  <td className="px-3 py-2 tabular-nums">{b.completed_tasks}</td>
                  <td className="px-3 py-2 tabular-nums">{b.open_tasks}</td>
                </tr>
              ))}
              {visibleBrands.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-zinc-400">
                    Kayıt yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
