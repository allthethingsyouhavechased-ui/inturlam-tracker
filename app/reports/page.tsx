import ReportsClient, {
  type BrandReportView,
  type PersonReportView,
  type RangeKey,
} from "@/components/ReportsClient";
import { currentMonthRange, currentWeekRange, todayISO } from "@/lib/date";
import {
  getCycleTimeReport,
  getReportSummary,
  getTrendReport,
  listBrandPersonBreakdown,
  listBrandReport,
  listDueHealthReport,
  listPersonBrandBreakdown,
  listPersonReport,
  listWorkflowReport,
  type DateRange,
} from "@/lib/repositories/reports";

export const dynamic = "force-dynamic";

function resolveRange(
  rangeKey: RangeKey,
  customStart: string | undefined,
  customEnd: string | undefined,
): DateRange | null {
  if (rangeKey === "week") return currentWeekRange();
  if (rangeKey === "month") return currentMonthRange();
  if (rangeKey === "custom" && customStart && customEnd) {
    return { start: customStart, end: customEnd };
  }
  return null;
}

function shiftISODate(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function previousDateRange(range: DateRange): DateRange {
  const start = new Date(`${range.start}T12:00:00`);
  const end = new Date(`${range.end}T12:00:00`);
  const dayCount = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  const previousEnd = shiftISODate(range.start, -1);
  return { start: shiftISODate(previousEnd, -(dayCount - 1)), end: previousEnd };
}

function formatReportDate(value: string): string {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric" })
    .format(new Date(`${value}T12:00:00`));
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; start?: string; end?: string }>;
}) {
  const sp = await searchParams;
  const rangeKey: RangeKey =
    sp.range === "week" || sp.range === "month" || sp.range === "custom"
      ? sp.range
      : "all";
  const range = resolveRange(rangeKey, sp.start, sp.end);
  const today = todayISO();

  const summary = getReportSummary(range, today);
  const previousSummary = range ? getReportSummary(previousDateRange(range), today) : null;
  const workflow = listWorkflowReport();
  const trend = getTrendReport(range);
  const cycleTime = getCycleTimeReport(range);
  const dueHealth = listDueHealthReport(today);
  const personRows = listPersonReport(range, today);
  const personBrandRows = listPersonBrandBreakdown(range);
  const brandRows = listBrandReport(range, today);
  const brandPersonRows = listBrandPersonBreakdown(range);

  const personViews: PersonReportView[] = personRows.map((p) => ({
    ...p,
    brands: personBrandRows
      .filter((b) => b.person_id === p.person_id)
      .map(({ brand_id, brand_name, total_tasks, completed_tasks, open_tasks }) => ({
        brand_id,
        brand_name,
        total_tasks,
        completed_tasks,
        open_tasks,
      })),
  }));

  const brandViews: BrandReportView[] = brandRows.map((b) => ({
    ...b,
    people: brandPersonRows
      .filter((p) => p.brand_id === b.brand_id)
      .map(({ person_id, person_name, total_tasks, completed_tasks, open_tasks }) => ({
        person_id,
        person_name,
        total_tasks,
        completed_tasks,
        open_tasks,
      })),
  }));

  const reportLabel = range
    ? `${formatReportDate(range.start)} – ${formatReportDate(range.end)}`
    : "Tüm zamanlar";
  const generatedAt = new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date());

  return (
    <div className="report-page space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-400">Operasyon analitiği</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Raporlar</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">İş yükü, teslim sağlığı, tamamlanma süresi ve ekip/marka performans görünümü</p>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{reportLabel}</p>
      </div>
      <ReportsClient
        summary={summary}
        previousSummary={previousSummary}
        workflow={workflow}
        trend={trend}
        cycleTime={cycleTime}
        dueHealth={dueHealth}
        people={personViews}
        brands={brandViews}
        rangeKey={rangeKey}
        customStart={sp.start ?? ""}
        customEnd={sp.end ?? ""}
        reportLabel={reportLabel}
        generatedAt={generatedAt}
      />
    </div>
  );
}
