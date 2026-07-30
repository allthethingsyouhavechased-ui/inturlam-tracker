"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import EmptyState from "@/components/EmptyState";
import {
  TASK_STATUS_LABEL,
  TASK_STATUS_PROGRESS,
} from "@/lib/constants";
import { downloadCSV, toCSV } from "@/lib/csv";
import type {
  BrandReportRow,
  PersonReportRow,
  ReportSummary,
  WorkflowReportRow,
} from "@/lib/repositories/reports";

export type RangeKey = "all" | "week" | "month" | "custom";

interface BrandBreakdown {
  brand_id: string;
  brand_name: string;
  total_tasks: number;
  completed_tasks: number;
  open_tasks: number;
}

interface PersonBreakdown {
  person_id: string;
  person_name: string;
  total_tasks: number;
  completed_tasks: number;
  open_tasks: number;
}

export interface PersonReportView extends PersonReportRow {
  brands: BrandBreakdown[];
}

export interface BrandReportView extends BrandReportRow {
  people: PersonBreakdown[];
}

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "week", label: "Bu hafta" },
  { key: "month", label: "Bu ay" },
  { key: "custom", label: "Özel aralık" },
];

const inputClass =
  "min-h-11 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 dark:border-white/15 dark:bg-zinc-950";

function formatRate(value: number | null): string {
  return value == null ? "—" : `%${Math.round(value)}`;
}

function formatDays(value: number | null): string {
  return value == null ? "—" : `${value.toLocaleString("tr-TR")} gün`;
}

function MetricCard({
  label,
  value,
  note,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  note: string;
  tone?: "neutral" | "success" | "danger";
}) {
  const dotClass =
    tone === "success"
      ? "bg-emerald-500"
      : tone === "danger"
        ? "bg-rose-500"
        : "bg-brand-500";
  const surfaceClass =
    tone === "success"
      ? "border-t-emerald-500 bg-emerald-50/35 dark:bg-emerald-950/10"
      : tone === "danger"
        ? "border-t-rose-500 bg-rose-50/45 dark:bg-rose-950/10"
        : "border-t-brand-500 bg-white dark:bg-zinc-900";

  return (
    <div
      className={`min-w-0 border-t-2 px-4 py-4 last:col-span-2 sm:px-5 xl:last:col-span-1 ${surfaceClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        </div>
        <span className={`mt-1 size-2.5 shrink-0 rounded-full ${dotClass}`} aria-hidden="true" />
      </div>
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{note}</p>
    </div>
  );
}

export default function ReportsClient({
  summary,
  workflow,
  people,
  brands,
  rangeKey,
  customStart,
  customEnd,
}: {
  summary: ReportSummary;
  workflow: WorkflowReportRow[];
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
  const [showPeopleTable, setShowPeopleTable] = useState(true);
  const [showBrandTable, setShowBrandTable] = useState(true);

  const customRangeInvalid = Boolean(start && end && start > end);
  const visibleBrands = hideArchived ? brands.filter((brand) => brand.archived === 0) : brands;
  const workflowTotal = workflow.reduce((total, row) => total + row.task_count, 0);
  const busiestPerson = people.reduce<PersonReportView | null>(
    (current, person) =>
      !current || person.open_tasks > current.open_tasks ? person : current,
    null,
  );
  const busiestBrand = visibleBrands.reduce<BrandReportView | null>(
    (current, brand) =>
      !current || brand.open_tasks > current.open_tasks ? brand : current,
    null,
  );
  const maxPersonOpen = Math.max(1, ...people.map((person) => person.open_tasks));
  const maxBrandOpen = Math.max(1, ...visibleBrands.map((brand) => brand.open_tasks));

  function setRange(key: RangeKey) {
    if (key === "custom") {
      router.push(`${pathname}?range=custom`);
      return;
    }
    router.push(`${pathname}?range=${key}`);
  }

  function applyCustomRange() {
    if (!start || !end || customRangeInvalid) return;
    router.push(`${pathname}?range=custom&start=${start}&end=${end}`);
  }

  function exportPeopleCSV() {
    const rows = people.map((person) => ({
      person_name: person.person_name,
      opened_tasks: person.total_tasks,
      completed_tasks: person.completed_tasks,
      open_tasks: person.open_tasks,
      overdue_tasks: person.overdue_tasks,
      on_time_rate: formatRate(person.on_time_rate),
      average_cycle: formatDays(person.average_cycle_days),
    }));
    const csv = toCSV(rows, [
      { key: "person_name", label: "Kişi" },
      { key: "opened_tasks", label: "Dönemde Açılan" },
      { key: "completed_tasks", label: "Dönemde Tamamlanan" },
      { key: "open_tasks", label: "Açık İş Yükü" },
      { key: "overdue_tasks", label: "Gecikmiş" },
      { key: "on_time_rate", label: "Zamanında Tamamlama" },
      { key: "average_cycle", label: "Ortalama Süre" },
    ]);
    downloadCSV("kisi-raporu.csv", csv);
  }

  function exportBrandsCSV() {
    const rows = visibleBrands.map((brand) => ({
      brand_name: brand.brand_name,
      total_content: brand.total_content,
      opened_tasks: brand.total_tasks,
      completed_tasks: brand.completed_tasks,
      open_tasks: brand.open_tasks,
      overdue_tasks: brand.overdue_tasks,
      on_time_rate: formatRate(brand.on_time_rate),
      average_cycle: formatDays(brand.average_cycle_days),
    }));
    const csv = toCSV(rows, [
      { key: "brand_name", label: "Marka" },
      { key: "total_content", label: "Yeni İçerik" },
      { key: "opened_tasks", label: "Dönemde Açılan" },
      { key: "completed_tasks", label: "Dönemde Tamamlanan" },
      { key: "open_tasks", label: "Açık İş Yükü" },
      { key: "overdue_tasks", label: "Gecikmiş" },
      { key: "on_time_rate", label: "Zamanında Tamamlama" },
      { key: "average_cycle", label: "Ortalama Süre" },
    ]);
    downloadCSV("marka-raporu.csv", csv);
  }

  return (
    <div className="space-y-8">
      <section
        aria-label="Rapor filtreleri"
        className="flex flex-wrap items-center gap-2 rounded-2xl border border-black/10 bg-white p-3 print:hidden dark:border-white/10 dark:bg-zinc-900"
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

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-zinc-600 transition hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
          >
            Yazdır
          </button>
        </div>
      </section>

      <section aria-labelledby="report-summary-title" className="space-y-3">
        <div>
          <h2 id="report-summary-title" className="text-lg font-semibold">
            Operasyon özeti
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Açılan ve tamamlanan seçili dönemi; açık ve geciken değerleri bugünkü iş
            yükünü gösterir.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-black/10 bg-black/10 dark:border-white/10 dark:bg-white/10 xl:grid-cols-5">
          <MetricCard
            label="Dönemde açılan"
            value={summary.opened_tasks}
            note="Yeni görev"
          />
          <MetricCard
            label="Tamamlanan"
            value={summary.completed_tasks}
            note={`Ort. ${formatDays(summary.average_cycle_days)}`}
            tone="success"
          />
          <MetricCard
            label="Açık iş yükü"
            value={summary.open_tasks}
            note="Şu an devam eden"
          />
          <MetricCard
            label="Geciken"
            value={summary.overdue_tasks}
            note="Teslim tarihi geçmiş"
            tone={summary.overdue_tasks > 0 ? "danger" : "neutral"}
          />
          <MetricCard
            label="Zamanında"
            value={formatRate(summary.on_time_rate)}
            note="Teslim tarihi olan işler"
            tone="success"
          />
        </div>
      </section>

      <section aria-label="Rapor öne çıkanları" className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            En yoğun kişi
          </p>
          <p className="mt-2 truncate text-base font-semibold">
            {busiestPerson?.person_name ?? "Veri yok"}
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {busiestPerson ? `${busiestPerson.open_tasks} açık görev` : "Henüz iş yükü oluşmadı"}
          </p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            En yoğun marka
          </p>
          <p className="mt-2 truncate text-base font-semibold">
            {busiestBrand?.brand_name ?? "Veri yok"}
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {busiestBrand ? `${busiestBrand.open_tasks} açık görev` : "Henüz iş yükü oluşmadı"}
          </p>
        </div>
        <div
          className={`rounded-2xl border p-4 ${
            summary.overdue_tasks > 0
              ? "border-rose-200 bg-rose-50/60 dark:border-rose-900 dark:bg-rose-950/20"
              : "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Takip gerektiren
          </p>
          <p className="mt-2 text-base font-semibold">
            {summary.overdue_tasks > 0
              ? `${summary.overdue_tasks} gecikmiş görev`
              : "Gecikmiş görev yok"}
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {summary.overdue_tasks > 0 ? "Önceliklendirme gerekebilir" : "Teslim görünümü sağlıklı"}
          </p>
        </div>
      </section>

      <section
        aria-labelledby="workflow-title"
        className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 id="workflow-title" className="text-lg font-semibold">
              Aktif iş akışı
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              İşlerin şu anda hangi aşamada beklediği
            </p>
          </div>
          <span className="text-sm font-medium tabular-nums">{workflowTotal} açık görev</span>
        </div>
        {workflowTotal === 0 ? (
          <div className="mt-5">
            <EmptyState
              compact
              title="Aktif iş akışı boş"
              description="Açık görev oluştuğunda durum dağılımı burada görünecek."
            />
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {workflow.map((row) => {
              const percentage = (row.task_count / workflowTotal) * 100;
              return (
                <div key={row.status}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium">{TASK_STATUS_LABEL[row.status]}</span>
                    <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
                      {row.task_count}
                    </span>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full bg-black/5 dark:bg-white/10"
                    role="progressbar"
                    aria-label={`${TASK_STATUS_LABEL[row.status]} görevleri`}
                    aria-valuemin={0}
                    aria-valuemax={workflowTotal}
                    aria-valuenow={row.task_count}
                  >
                    <div
                      className={`h-full rounded-full transition-[width] duration-500 ${TASK_STATUS_PROGRESS[row.status]}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Ekip görünümü</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Performans puanı değil, iş yükü ve teslim görünümü
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowPeopleTable((visible) => !visible)}
              aria-expanded={showPeopleTable}
              className="ui-press inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
            >
              {showPeopleTable ? "Tabloyu gizle" : "Tabloyu göster"}
            </button>
            <button
              type="button"
              onClick={exportPeopleCSV}
              className="ui-press inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-brand-600 hover:bg-brand-500/10 dark:text-brand-400"
            >
              CSV
            </button>
          </div>
        </div>
        {showPeopleTable &&
          (people.length > 0 ? (
        <div className="ui-enter overflow-x-auto rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-zinc-50/90 dark:bg-zinc-950/70">
              <tr className="border-b border-black/10 text-left text-xs uppercase tracking-wider text-zinc-500 dark:border-white/10 dark:text-zinc-400">
                <th className="px-4 py-3 font-medium">Kişi</th>
                <th className="px-3 py-3 font-medium">Açılan</th>
                <th className="px-3 py-3 font-medium">Tamamlanan</th>
                <th className="px-3 py-3 font-medium">Açık</th>
                <th className="px-3 py-3 font-medium">Geciken</th>
                <th className="px-3 py-3 font-medium">Zamanında</th>
                <th className="px-3 py-3 font-medium">Ort. süre</th>
              </tr>
            </thead>
            <tbody>
              {people.map((person) => (
                <tr
                  key={person.person_id}
                  className={`border-b border-black/5 transition-colors last:border-0 hover:bg-black/[0.025] dark:border-white/5 dark:hover:bg-white/[0.025] ${
                    person.person_id === busiestPerson?.person_id
                      ? "bg-brand-50/45 dark:bg-brand-950/15"
                      : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <details>
                      <summary className="cursor-pointer font-medium">
                        {person.person_name}
                        {person.person_id === busiestPerson?.person_id &&
                          person.open_tasks > 0 && (
                            <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                              en yoğun
                            </span>
                          )}
                        {person.active === 0 && (
                          <span className="ml-2 rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-normal text-zinc-500 dark:bg-white/10">
                            pasif
                          </span>
                        )}
                      </summary>
                      {person.brands.length > 0 && (
                        <ul className="mt-2 space-y-1 pl-3 text-xs text-zinc-500 dark:text-zinc-400">
                          {person.brands.map((brand) => (
                            <li key={brand.brand_id}>
                              {brand.brand_name}: {brand.completed_tasks} tamamlanan,{" "}
                              {brand.open_tasks} açık
                            </li>
                          ))}
                        </ul>
                      )}
                    </details>
                  </td>
                  <td className="px-3 py-3 tabular-nums">{person.total_tasks}</td>
                  <td className="px-3 py-3 font-medium tabular-nums">
                    {person.completed_tasks}
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    <div className="flex items-center gap-2">
                      <span className="min-w-4">{person.open_tasks}</span>
                      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                        <span
                          className="block h-full rounded-full bg-brand-500"
                          style={{ width: `${(person.open_tasks / maxPersonOpen) * 100}%` }}
                        />
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    <span
                      className={
                        person.overdue_tasks > 0
                          ? "font-medium text-rose-600 dark:text-rose-400"
                          : undefined
                      }
                    >
                      {person.overdue_tasks}
                    </span>
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {formatRate(person.on_time_rate)}
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {formatDays(person.average_cycle_days)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          ) : (
            <EmptyState
              compact
              title="Ekip raporu için veri yok"
              description="Görevler kişilere atandığında ekip iş yükü burada görünecek."
            />
          ))}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Marka görünümü</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Üretim hacmi, açık işler ve teslim sağlığı
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm text-zinc-600 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={hideArchived}
                onChange={(event) => setHideArchived(event.target.checked)}
              />
              Arşivi gizle
            </label>
            <button
              type="button"
              onClick={() => setShowBrandTable((visible) => !visible)}
              aria-expanded={showBrandTable}
              className="ui-press inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
            >
              {showBrandTable ? "Tabloyu gizle" : "Tabloyu göster"}
            </button>
            <button
              type="button"
              onClick={exportBrandsCSV}
              className="ui-press inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-brand-600 hover:bg-brand-500/10 dark:text-brand-400"
            >
              CSV
            </button>
          </div>
        </div>
        {showBrandTable &&
          (visibleBrands.length > 0 ? (
        <div className="ui-enter overflow-x-auto rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="bg-zinc-50/90 dark:bg-zinc-950/70">
              <tr className="border-b border-black/10 text-left text-xs uppercase tracking-wider text-zinc-500 dark:border-white/10 dark:text-zinc-400">
                <th className="px-4 py-3 font-medium">Marka</th>
                <th className="px-3 py-3 font-medium">Yeni içerik</th>
                <th className="px-3 py-3 font-medium">Açılan</th>
                <th className="px-3 py-3 font-medium">Tamamlanan</th>
                <th className="px-3 py-3 font-medium">Açık</th>
                <th className="px-3 py-3 font-medium">Geciken</th>
                <th className="px-3 py-3 font-medium">Zamanında</th>
                <th className="px-3 py-3 font-medium">Ort. süre</th>
              </tr>
            </thead>
            <tbody>
              {visibleBrands.map((brand) => (
                <tr
                  key={brand.brand_id}
                  className={`border-b border-black/5 transition-colors last:border-0 hover:bg-black/[0.025] dark:border-white/5 dark:hover:bg-white/[0.025] ${
                    brand.brand_id === busiestBrand?.brand_id
                      ? "bg-brand-50/45 dark:bg-brand-950/15"
                      : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <details>
                      <summary className="cursor-pointer font-medium">
                        {brand.brand_name}
                        {brand.brand_id === busiestBrand?.brand_id &&
                          brand.open_tasks > 0 && (
                            <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                              en yoğun
                            </span>
                          )}
                        {brand.archived === 1 && (
                          <span className="ml-2 rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-normal text-zinc-500 dark:bg-white/10">
                            arşiv
                          </span>
                        )}
                      </summary>
                      {brand.people.length > 0 && (
                        <ul className="mt-2 space-y-1 pl-3 text-xs text-zinc-500 dark:text-zinc-400">
                          {brand.people.map((person) => (
                            <li key={person.person_id}>
                              {person.person_name}: {person.completed_tasks} tamamlanan,{" "}
                              {person.open_tasks} açık
                            </li>
                          ))}
                        </ul>
                      )}
                    </details>
                  </td>
                  <td className="px-3 py-3 tabular-nums">{brand.total_content}</td>
                  <td className="px-3 py-3 tabular-nums">{brand.total_tasks}</td>
                  <td className="px-3 py-3 font-medium tabular-nums">
                    {brand.completed_tasks}
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    <div className="flex items-center gap-2">
                      <span className="min-w-4">{brand.open_tasks}</span>
                      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                        <span
                          className="block h-full rounded-full bg-brand-500"
                          style={{ width: `${(brand.open_tasks / maxBrandOpen) * 100}%` }}
                        />
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    <span
                      className={
                        brand.overdue_tasks > 0
                          ? "font-medium text-rose-600 dark:text-rose-400"
                          : undefined
                      }
                    >
                      {brand.overdue_tasks}
                    </span>
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {formatRate(brand.on_time_rate)}
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {formatDays(brand.average_cycle_days)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          ) : (
            <EmptyState
              compact
              title="Marka raporu için veri yok"
              description="İçerik ve görevler oluşturulduğunda marka görünümü burada dolacak."
            />
          ))}
      </section>
    </div>
  );
}
