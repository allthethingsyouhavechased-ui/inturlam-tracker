import ReportsClient, {
  type BrandReportView,
  type PersonReportView,
  type RangeKey,
} from "@/components/ReportsClient";
import { currentMonthRange, currentWeekRange, todayISO } from "@/lib/date";
import {
  listBrandPersonBreakdown,
  listBrandReport,
  listPersonBrandBreakdown,
  listPersonReport,
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

  const personRows = listPersonReport(range, today);
  const personBrandRows = listPersonBrandBreakdown(range);
  const brandRows = listBrandReport(range);
  const brandPersonRows = listBrandPersonBreakdown(range);

  const personViews: PersonReportView[] = personRows.map((p) => ({
    ...p,
    brands: personBrandRows
      .filter((b) => b.person_id === p.person_id)
      .map(({ brand_id, brand_name, total_tasks, completed_tasks }) => ({
        brand_id,
        brand_name,
        total_tasks,
        completed_tasks,
      })),
  }));

  const brandViews: BrandReportView[] = brandRows.map((b) => ({
    ...b,
    people: brandPersonRows
      .filter((p) => p.brand_id === b.brand_id)
      .map(({ person_id, person_name, total_tasks, completed_tasks }) => ({
        person_id,
        person_name,
        total_tasks,
        completed_tasks,
      })),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Raporlar</h1>
      <ReportsClient
        people={personViews}
        brands={brandViews}
        rangeKey={rangeKey}
        customStart={sp.start ?? ""}
        customEnd={sp.end ?? ""}
      />
    </div>
  );
}
