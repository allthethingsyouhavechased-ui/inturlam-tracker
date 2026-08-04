"use client";

import Link from "next/link";
import EmptyState from "@/components/EmptyState";
import RangeFilterBar, {
  ExcelDownloadLink,
  PrintButton,
  type RangeKey,
} from "@/components/reports/RangeFilterBar";
import {
  CycleTimePanel,
  DueHealthPanel,
  TrendChart,
} from "@/components/reports/ReportVisuals";
import {
  TASK_PRIORITY_DOT,
  TASK_PRIORITY_LABEL,
  TASK_STATUS_LABEL,
  TASK_STATUS_PROGRESS,
} from "@/lib/constants";
import { downloadCSV, toCSV } from "@/lib/csv";
import { formatDateShort } from "@/lib/date";
import type {
  CycleTimeReport,
  DueHealthRow,
  PriorityReportRow,
  ReportSummary,
  TrendReport,
  WorkflowReportRow,
} from "@/lib/repositories/reports";
import type { TaskWithContext } from "@/lib/types";

export interface PersonReportBrandRow {
  brand_id: string;
  brand_name: string;
  total_tasks: number;
  completed_tasks: number;
  open_tasks: number;
}

function formatRate(value: number | null): string {
  return value == null ? "—" : `%${Math.round(value)}`;
}

function formatDays(value: number | null): string {
  return value == null ? "—" : `${value.toLocaleString("tr-TR")} gün`;
}

const surfaceClass =
  "report-surface rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900";

// Sayının yanında her zaman bir cümle: rapor "anlaşılır" olsun diye rakamın
// ne anlama geldiği okuyucunun yorumuna bırakılmıyor.
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
    tone === "success" ? "bg-emerald-500" : tone === "danger" ? "bg-rose-500" : "bg-brand-500";
  const surface =
    tone === "success"
      ? "border-t-emerald-500 bg-emerald-50/35 dark:bg-emerald-950/10"
      : tone === "danger"
        ? "border-t-rose-500 bg-rose-50/45 dark:bg-rose-950/10"
        : "border-t-brand-500 bg-white dark:bg-zinc-900";

  return (
    <div className={`min-w-0 border-t-2 px-4 py-4 sm:px-5 ${surface}`}>
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

function comparePeriod(current: number, previous: number | null | undefined): string {
  if (previous == null) return "Tüm kayıtlar";
  const difference = current - previous;
  if (difference === 0) return "Önceki dönemle aynı";
  return `Önceki döneme göre ${difference > 0 ? "+" : ""}${difference}`;
}

function TaskRow({ task, trailing }: { task: TaskWithContext; trailing: React.ReactNode }) {
  return (
    <li>
      <Link
        href={`/tasks/${task.id}`}
        className="flex items-start justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
      >
        <span className="flex min-w-0 items-start gap-2">
          <span
            className={`mt-1.5 size-2 shrink-0 rounded-full ${TASK_PRIORITY_DOT[task.priority]}`}
            aria-hidden="true"
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{task.title}</span>
            <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
              {task.brand_name} · {task.content_title} ·{" "}
              {TASK_PRIORITY_LABEL[task.priority]}
            </span>
          </span>
        </span>
        <span className="shrink-0 text-right text-xs tabular-nums">{trailing}</span>
      </Link>
    </li>
  );
}

function TaskListPanel({
  title,
  description,
  count,
  emptyTitle,
  emptyDescription,
  children,
}: {
  title: string;
  description: string;
  count: number;
  emptyTitle: string;
  emptyDescription: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`${surfaceClass} p-5`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
        </div>
        <span className="text-sm font-medium tabular-nums">{count} görev</span>
      </div>
      {count === 0 ? (
        <div className="mt-4">
          <EmptyState compact title={emptyTitle} description={emptyDescription} />
        </div>
      ) : (
        <ul className="mt-3 -mx-3 divide-y divide-black/5 dark:divide-white/5">{children}</ul>
      )}
    </section>
  );
}

function daysBetween(fromISO: string, toISO: string): number {
  const from = new Date(`${fromISO}T12:00:00`).getTime();
  const to = new Date(`${toISO}T12:00:00`).getTime();
  return Math.round((to - from) / 86_400_000);
}

export default function PersonReportClient({
  personId,
  personName,
  departmentLabel,
  personTitle,
  summary,
  previousSummary,
  teamSummary,
  teamSize,
  workflow,
  priorities,
  trend,
  cycleTime,
  dueHealth,
  brands,
  overdueTasks,
  upcomingTasks,
  completedTasks,
  upcomingDays,
  rangeKey,
  customStart,
  customEnd,
  reportLabel,
  generatedAt,
}: {
  personId: string;
  personName: string;
  departmentLabel: string;
  personTitle: string | null;
  summary: ReportSummary;
  previousSummary: ReportSummary | null;
  teamSummary: ReportSummary;
  teamSize: number;
  workflow: WorkflowReportRow[];
  priorities: PriorityReportRow[];
  trend: TrendReport;
  cycleTime: CycleTimeReport;
  dueHealth: DueHealthRow[];
  brands: PersonReportBrandRow[];
  overdueTasks: TaskWithContext[];
  upcomingTasks: TaskWithContext[];
  completedTasks: TaskWithContext[];
  upcomingDays: number;
  rangeKey: RangeKey;
  customStart: string;
  customEnd: string;
  reportLabel: string;
  generatedAt: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const workflowTotal = workflow.reduce((total, row) => total + row.task_count, 0);
  const priorityTotal = priorities.reduce((total, row) => total + row.open_tasks, 0);
  const maxBrandTotal = Math.max(
    1,
    ...brands.map((brand) => brand.open_tasks + brand.completed_tasks),
  );

  const teamAverageOpen = Math.round((teamSummary.open_tasks / teamSize) * 10) / 10;
  const teamAverageCompleted = Math.round((teamSummary.completed_tasks / teamSize) * 10) / 10;
  const workloadShare =
    teamSummary.open_tasks === 0
      ? null
      : Math.round((summary.open_tasks / teamSummary.open_tasks) * 100);
  const completionShare =
    teamSummary.completed_tasks === 0
      ? null
      : Math.round((summary.completed_tasks / teamSummary.completed_tasks) * 100);

  // Rapor tek cümlelik bir okuma ile başlasın: rakamları yorumlayan kısa özet.
  const headlineParts: string[] = [
    `${personName}, seçili dönemde ${summary.completed_tasks} iş tamamladı ve şu anda ${summary.open_tasks} açık işi var.`,
  ];
  if (summary.overdue_tasks > 0) {
    headlineParts.push(
      `Bunların ${summary.overdue_tasks} tanesinin teslim tarihi geçmiş — önce buraya bakılmalı.`,
    );
  } else if (summary.open_tasks > 0) {
    headlineParts.push("Gecikmiş işi yok, teslim görünümü sağlıklı.");
  }
  // Yüzdeye Türkçe iyelik eki getirmekten kaçınılıyor ("%16'i" / "%0'ini" gibi
  // yanlış ekler çıkıyordu); cümleler ekin sayıya bağlanmayacağı şekilde kuruldu.
  if (summary.on_time_rate != null) {
    headlineParts.push(
      `Teslim tarihi olan işlerde zamanında tamamlama oranı %${Math.round(summary.on_time_rate)}.`,
    );
  }
  if (workloadShare != null && summary.open_tasks > 0) {
    headlineParts.push(
      `Ekibin toplam açık iş yükündeki payı %${workloadShare} (ekip ortalaması ${teamAverageOpen.toLocaleString("tr-TR")} açık iş).`,
    );
  }

  function exportCSV() {
    const rows = [
      { metric: "Departman", value: departmentLabel },
      { metric: "Unvan", value: personTitle ?? "—" },
      { metric: "Dönem", value: reportLabel },
      { metric: "Dönemde açılan", value: String(summary.opened_tasks) },
      { metric: "Dönemde tamamlanan", value: String(summary.completed_tasks) },
      { metric: "Açık iş yükü", value: String(summary.open_tasks) },
      { metric: "Gecikmiş", value: String(summary.overdue_tasks) },
      { metric: "Zamanında tamamlama", value: formatRate(summary.on_time_rate) },
      { metric: "Ortalama tamamlanma süresi", value: formatDays(summary.average_cycle_days) },
      { metric: "Ekip ortalaması (açık)", value: teamAverageOpen.toLocaleString("tr-TR") },
      {
        metric: "Ekip ortalaması (tamamlanan)",
        value: teamAverageCompleted.toLocaleString("tr-TR"),
      },
      ...workflow.map((row) => ({
        metric: `Durum — ${TASK_STATUS_LABEL[row.status]}`,
        value: String(row.task_count),
      })),
      ...priorities.map((row) => ({
        metric: `Öncelik — ${TASK_PRIORITY_LABEL[row.priority]}`,
        value: String(row.open_tasks),
      })),
      ...brands.map((brand) => ({
        metric: `Marka — ${brand.brand_name}`,
        value: `${brand.completed_tasks} tamamlanan / ${brand.open_tasks} açık`,
      })),
      ...overdueTasks.map((task) => ({
        metric: `Gecikmiş görev — ${task.brand_name}`,
        value: `${task.title} (${formatDateShort(task.due_date)})`,
      })),
    ];
    const csv = toCSV(rows, [
      { key: "metric", label: "Başlık" },
      { key: "value", label: "Değer" },
    ]);
    downloadCSV(`${personName.toLocaleLowerCase("tr-TR").replace(/\s+/g, "-")}-raporu.csv`, csv);
  }

  return (
    <div className="space-y-6">
      <div className="hidden items-start justify-between border-b border-zinc-300 pb-4 print:flex">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            İNTURLAM · KİŞİ RAPORU
          </p>
          <h1 className="mt-1 text-2xl font-semibold">{personName}</h1>
          <p className="mt-1 text-sm text-zinc-600">
            {departmentLabel}
            {personTitle ? ` · ${personTitle}` : ""} · {reportLabel}
          </p>
        </div>
        <div className="text-right text-xs text-zinc-500">
          <p>Hazırlanma tarihi</p>
          <p className="mt-1 font-medium text-zinc-800">{generatedAt}</p>
        </div>
      </div>

      <RangeFilterBar rangeKey={rangeKey} customStart={customStart} customEnd={customEnd}>
        <Link
          href={`/tasks?assignee=${encodeURIComponent(personId)}`}
          className="ui-press inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-brand-600 hover:bg-brand-500/10 dark:text-brand-400"
        >
          Görevlerini aç
        </Link>
        <button
          type="button"
          onClick={exportCSV}
          className="ui-press inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-brand-600 hover:bg-brand-500/10 dark:text-brand-400"
        >
          CSV
        </button>
        <ExcelDownloadLink
          rangeKey={rangeKey}
          customStart={customStart}
          customEnd={customEnd}
          personId={personId}
        />
        <PrintButton />
      </RangeFilterBar>

      <section
        aria-label="Rapor özeti"
        className="rounded-2xl border border-brand-200 bg-brand-50/50 p-5 dark:border-brand-900 dark:bg-brand-950/20"
      >
        <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-300">
          Özet
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
          {headlineParts.join(" ")}
        </p>
      </section>

      <section aria-labelledby="person-metrics" className="space-y-3">
        <div>
          <h2 id="person-metrics" className="text-lg font-semibold">
            Rakamlarla {personName}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Açılan ve tamamlanan seçili döneme ait; açık ve geciken bugünkü durumu gösterir.
          </p>
        </div>
        <div className="report-surface grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-black/10 bg-black/10 dark:border-white/10 dark:bg-white/10 md:grid-cols-3 xl:grid-cols-6">
          <MetricCard
            label="Dönemde açılan"
            value={summary.opened_tasks}
            note={comparePeriod(summary.opened_tasks, previousSummary?.opened_tasks)}
          />
          <MetricCard
            label="Tamamlanan"
            value={summary.completed_tasks}
            note={`Ekip ortalaması ${teamAverageCompleted.toLocaleString("tr-TR")}`}
            tone="success"
          />
          <MetricCard
            label="Açık iş yükü"
            value={summary.open_tasks}
            note={`Ekip ortalaması ${teamAverageOpen.toLocaleString("tr-TR")}`}
          />
          <MetricCard
            label="Geciken"
            value={summary.overdue_tasks}
            note={summary.overdue_tasks > 0 ? "Teslim tarihi geçmiş" : "Gecikme yok"}
            tone={summary.overdue_tasks > 0 ? "danger" : "success"}
          />
          <MetricCard
            label="Zamanında"
            value={formatRate(summary.on_time_rate)}
            note="Tarihli işlerde teslim başarısı"
            tone="success"
          />
          <MetricCard
            label="Ort. süre"
            value={formatDays(summary.average_cycle_days)}
            note="Açılıştan tamamlanmaya"
          />
        </div>
        {(workloadShare != null || completionShare != null) && (
          <div className="grid gap-3 sm:grid-cols-2">
            {workloadShare != null && (
              <ShareBar
                label="Ekibin açık iş yükündeki payı"
                percentage={workloadShare}
                detail={`${summary.open_tasks} / ${teamSummary.open_tasks} açık görev`}
              />
            )}
            {completionShare != null && (
              <ShareBar
                label="Dönemde tamamlananlardaki payı"
                percentage={completionShare}
                detail={`${summary.completed_tasks} / ${teamSummary.completed_tasks} tamamlanan görev`}
                tone="success"
              />
            )}
          </div>
        )}
      </section>

      <section aria-label="Dağılımlar" className="grid gap-4 xl:grid-cols-2">
        <div className={`${surfaceClass} p-5`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">Açık işler hangi aşamada</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Kişinin işlerinin şu anda beklediği durum
              </p>
            </div>
            <span className="text-sm font-medium tabular-nums">{workflowTotal} açık</span>
          </div>
          {workflowTotal === 0 ? (
            <div className="mt-4">
              <EmptyState
                compact
                title="Açık iş yok"
                description="Bu kişiye atanmış açık görev bulunmuyor."
              />
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {workflow.map((row) => (
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
                      style={{ width: `${(row.task_count / workflowTotal) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`${surfaceClass} p-5`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">Açık işlerin önceliği</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Yoğunluğun ne kadarı gerçekten acil
              </p>
            </div>
            <span className="text-sm font-medium tabular-nums">{priorityTotal} açık</span>
          </div>
          {priorityTotal === 0 ? (
            <div className="mt-4">
              <EmptyState
                compact
                title="Açık iş yok"
                description="Öncelik dağılımı açık görev oluştuğunda görünecek."
              />
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {priorities.map((row) => (
                <div key={row.priority}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-2 font-medium">
                      <span
                        className={`size-2 rounded-full ${TASK_PRIORITY_DOT[row.priority]}`}
                        aria-hidden="true"
                      />
                      {TASK_PRIORITY_LABEL[row.priority]}
                    </span>
                    <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
                      {row.open_tasks}
                      {row.overdue_tasks > 0 && (
                        <span className="ml-1 text-rose-600 dark:text-rose-400">
                          · {row.overdue_tasks} geciken
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                    <div
                      className={`h-full rounded-full ${TASK_PRIORITY_DOT[row.priority]}`}
                      style={{ width: `${(row.open_tasks / priorityTotal) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <TrendChart report={trend} />

      <section aria-label="Süre ve teslim analizi" className="grid gap-4 xl:grid-cols-2">
        <CycleTimePanel report={cycleTime} />
        <DueHealthPanel rows={dueHealth} />
      </section>

      <section className={`${surfaceClass} p-5`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Hangi markalara çalışıyor</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Seçili dönemdeki dağılım — tamamlanan ve açık işler
            </p>
          </div>
          <span className="text-sm font-medium tabular-nums">{brands.length} marka</span>
        </div>
        {brands.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              compact
              title="Marka dağılımı yok"
              description="Bu kişiye bir markanın işi atandığında dağılım burada görünecek."
            />
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {brands.map((brand) => {
              const total = brand.open_tasks + brand.completed_tasks;
              return (
                <div key={brand.brand_id}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                    <Link
                      href={`/brands/${brand.brand_id}`}
                      className="truncate font-medium hover:text-brand-600 hover:underline dark:hover:text-brand-400"
                    >
                      {brand.brand_name}
                    </Link>
                    <span className="shrink-0 tabular-nums text-zinc-500 dark:text-zinc-400">
                      {brand.completed_tasks} tamamlanan · {brand.open_tasks} açık
                    </span>
                  </div>
                  <div
                    className="flex h-2 overflow-hidden rounded-full bg-black/5 dark:bg-white/10"
                    style={{ width: `${(total / maxBrandTotal) * 100}%`, minWidth: "8%" }}
                  >
                    <span
                      className="bg-emerald-500"
                      style={{ width: `${total === 0 ? 0 : (brand.completed_tasks / total) * 100}%` }}
                    />
                    <span
                      className="bg-brand-500"
                      style={{ width: `${total === 0 ? 0 : (brand.open_tasks / total) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <p className="pt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
              <span className="mr-1 inline-block size-2 rounded-full bg-emerald-500 align-middle" />
              tamamlanan
              <span className="ml-3 mr-1 inline-block size-2 rounded-full bg-brand-500 align-middle" />
              açık
            </p>
          </div>
        )}
      </section>

      <TaskListPanel
        title="Gecikmiş işler"
        description="Teslim tarihi geçmiş, hâlâ açık görevler — en eskisi en üstte"
        count={overdueTasks.length}
        emptyTitle="Gecikmiş iş yok"
        emptyDescription="Teslim tarihi geçmiş açık görev bulunmuyor."
      >
        {overdueTasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            trailing={
              <>
                <span className="block font-medium text-rose-600 dark:text-rose-400">
                  {task.due_date ? `${daysBetween(task.due_date, today)} gün` : "—"}
                </span>
                <span className="block text-zinc-500 dark:text-zinc-400">
                  {formatDateShort(task.due_date)}
                </span>
              </>
            }
          />
        ))}
      </TaskListPanel>

      <TaskListPanel
        title={`Önümüzdeki ${upcomingDays} gün`}
        description="Yaklaşan teslim tarihleri"
        count={upcomingTasks.length}
        emptyTitle="Yaklaşan teslim yok"
        emptyDescription={`Önümüzdeki ${upcomingDays} gün içinde teslim tarihi olan açık görev yok.`}
      >
        {upcomingTasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            trailing={
              <>
                <span className="block font-medium">
                  {task.due_date === today
                    ? "Bugün"
                    : `${daysBetween(today, task.due_date ?? today)} gün`}
                </span>
                <span className="block text-zinc-500 dark:text-zinc-400">
                  {formatDateShort(task.due_date)}
                </span>
              </>
            }
          />
        ))}
      </TaskListPanel>

      <TaskListPanel
        title="Son tamamladıkları"
        description="En son kapatılan işler"
        count={completedTasks.length}
        emptyTitle="Henüz tamamlanan iş yok"
        emptyDescription="Bir görev yayınlandığında burada listelenecek."
      >
        {completedTasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            trailing={
              <span className="block text-emerald-600 dark:text-emerald-400">
                {formatDateShort(task.completed_at?.slice(0, 10) ?? null)}
              </span>
            }
          />
        ))}
      </TaskListPanel>
    </div>
  );
}

function ShareBar({
  label,
  percentage,
  detail,
  tone = "neutral",
}: {
  label: string;
  percentage: number;
  detail: string;
  tone?: "neutral" | "success";
}) {
  return (
    <div className={`${surfaceClass} p-4`}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="text-lg font-semibold tabular-nums">%{percentage}</p>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-black/5 dark:bg-white/10"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
      >
        <div
          className={`h-full rounded-full ${tone === "success" ? "bg-emerald-500" : "bg-brand-500"}`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{detail}</p>
    </div>
  );
}
