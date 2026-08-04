// Rapor ekranının Excel dökümü: /reports/export?range=month[&start&end][&person=ID]
//
// Neden Server Action değil de route handler: dosya indirmesi bir HTTP yanıtı —
// tarayıcı `<a download>` ile doğrudan çekiyor, JavaScript'te blob kurmaya
// (`downloadCSV`in yaptığı gibi) gerek kalmıyor. Ayrıca `lib/xlsx.ts`
// `node:zlib` kullanıyor; burada kalınca istemci paketine hiç girmiyor.

import { NextResponse } from "next/server";
import { currentMonthRange, currentWeekRange, todayISO } from "@/lib/date";
import { buildReportSheets } from "@/lib/reportWorkbook";
import { clusterLabelMap } from "@/lib/repositories/clusters";
import { getPerson } from "@/lib/repositories/people";
import {
  getCycleTimeReport,
  getReportSummary,
  getTrendReport,
  listBrandReport,
  listDueHealthReport,
  listPersonReport,
  listTaskDetailReport,
  listWorkflowReport,
  type DateRange,
} from "@/lib/repositories/reports";
import { sweepArchivablePublishedTasks } from "@/lib/repositories/tasks";
import { buildXlsx, xlsxFileName } from "@/lib/xlsx";

export const dynamic = "force-dynamic";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Rapor sayfalarındaki `resolveRange` ile aynı kurallar; burada ayrıca elle
// yazılmış query string'e karşı tarih biçimi doğrulanıyor (bozuk değer sessizce
// "tüm zamanlar"a düşsün, 500 üretmesin).
function resolveRange(params: URLSearchParams): { range: DateRange | null; key: string } {
  const key = params.get("range") ?? "all";
  if (key === "week") return { range: currentWeekRange(), key };
  if (key === "month") return { range: currentMonthRange(), key };
  if (key === "custom") {
    const start = params.get("start") ?? "";
    const end = params.get("end") ?? "";
    if (ISO_DATE.test(start) && ISO_DATE.test(end) && start <= end) {
      return { range: { start, end }, key };
    }
  }
  return { range: null, key: "all" };
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
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

export async function GET(request: Request): Promise<NextResponse> {
  const params = new URL(request.url).searchParams;
  const { range } = resolveRange(params);
  const today = todayISO();

  // Kişi kapsamı: geçersiz/bilinmeyen id sessizce portföy geneline düşmemeli —
  // dosyayı açan kişi kimin raporuna baktığını bilmelidir.
  const personId = params.get("person");
  const person = personId ? getPerson(personId) : undefined;
  if (personId && !person) {
    return NextResponse.json({ error: "Kişi bulunamadı." }, { status: 404 });
  }
  const scope = person?.id ?? null;

  // Döküm de panolarla aynı arşiv kuralını görsün.
  sweepArchivablePublishedTasks();

  const reportLabel = range
    ? `${formatReportDate(range.start)} – ${formatReportDate(range.end)}`
    : "Tüm zamanlar";

  const sheets = buildReportSheets({
    title: person ? `Kişi raporu · ${person.name}` : "Portföy geneli",
    reportLabel,
    generatedAt: new Intl.DateTimeFormat("tr-TR", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date()),
    summary: getReportSummary(range, today, scope),
    previousSummary: range ? getReportSummary(previousDateRange(range), today, scope) : null,
    workflow: listWorkflowReport(scope),
    dueHealth: listDueHealthReport(today, scope),
    cycleTime: getCycleTimeReport(range, scope),
    trend: getTrendReport(range, scope),
    tasks: listTaskDetailReport(range, today, scope),
    // Kişi dosyasında ekip tablosu yok (o kişiyi ekiple kıyaslamak raporun kendi
    // ekranının işi); marka tablosu ise portföy genelinde anlamlı.
    people: person ? [] : listPersonReport(range, today),
    brands: person ? [] : listBrandReport(range, today),
    clusterLabels: clusterLabelMap(),
  });

  const fileName = xlsxFileName([
    person ? person.name : "inturlam",
    "rapor",
    range ? `${range.start}_${range.end}` : "tum-zamanlar",
  ]);

  return new NextResponse(new Uint8Array(buildXlsx(sheets)), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      // İç araç, LAN: tarayıcı eski bir dökümü yeniden sunmasın.
      "Cache-Control": "no-store",
    },
  });
}
