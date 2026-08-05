// Rapor ekranının Excel karşılığı.
//
// Eskiden dışa aktarma tek bir CSV'ydi ve yalnızca SAYI taşıyordu ("12
// tamamlandı"); dosyayı açan kişi hangi işlerden bahsedildiğini göremiyordu.
// Burada üretilen defter iki soruyu birden cevaplıyor:
//   1. "Görev dökümü" sayfası — satır satır işler: adı, markası, KATEGORİSİ,
//      içeriği, sorumlusu, durumu, tarihleri.
//   2. "Özet" sayfası — ekranda görünen kartların/panellerin kendisi, aynı
//      dönem etiketiyle, ki tablo ile özet aynı dosyada yan yana dursun.
//
// Sayfa üretimi burada (saf veri → satır) tutuluyor; route handler yalnızca
// sorguları çalıştırıp `buildXlsx`e veriyor.

import {
  CONTENT_TYPE_LABEL,
  TASK_PRIORITY_LABEL,
  TASK_STATUS_LABEL,
  UNKNOWN_CLUSTER_LABEL,
} from "@/lib/constants";
import { departmentLabel } from "@/lib/departments";
import type {
  BrandReportRow,
  CycleTimeReport,
  DepartmentReportRow,
  DueHealthRow,
  PersonReportRow,
  ReportSummary,
  TaskDetailRow,
  TrendReport,
  WorkflowReportRow,
} from "@/lib/repositories/reports";
import type { ContentType } from "@/lib/types";
import type { CellValue, Sheet } from "@/lib/xlsx";

export interface ReportWorkbookInput {
  /** Başlıkta görünen kapsam: portföy geneli ya da tek kişi. */
  title: string;
  reportLabel: string;
  generatedAt: string;
  summary: ReportSummary;
  previousSummary: ReportSummary | null;
  workflow: WorkflowReportRow[];
  dueHealth: DueHealthRow[];
  cycleTime: CycleTimeReport;
  trend: TrendReport;
  tasks: TaskDetailRow[];
  /** Kişi raporunda boş bırakılır — o dosyada ekip tablosu anlamsız. */
  people: PersonReportRow[];
  brands: BrandReportRow[];
  /** Yalnızca portföy dosyasında dolu; kapsamlı dosyada kapsamı tekrar ederdi. */
  departments: DepartmentReportRow[];
  clusterLabels: Record<string, string>;
}

function rate(value: number | null): CellValue {
  return value == null ? "—" : `%${Math.round(value)}`;
}

function days(value: number | null): CellValue {
  return value == null ? "—" : value;
}

function yesNo(value: number): string {
  return value === 1 ? "Evet" : "Hayır";
}

// SQLite damgası 'YYYY-MM-DD HH:MM:SS' → Excel'de okunur gün. Saat kısmı
// dökümde gürültü; gün yeterli.
function isoDay(value: string | null): CellValue {
  return value ? value.slice(0, 10) : "";
}

function comparison(current: number, previous: number | null | undefined): string {
  if (previous == null) return "Önceki dönem yok";
  const difference = current - previous;
  if (difference === 0) return "Önceki dönemle aynı";
  return `Önceki döneme göre ${difference > 0 ? "+" : ""}${difference}`;
}

// ---- Sayfa 1: Özet (ekrandaki görünümün kendisi) ----

function summarySheet(input: ReportWorkbookInput): Sheet {
  const rows: CellValue[][] = [];
  const boldRows: number[] = [];

  function section(heading: string): void {
    if (rows.length > 0) rows.push([]);
    boldRows.push(rows.length);
    rows.push([heading]);
  }

  rows.push(["İNTURLAM · OPERASYON RAPORU"]);
  boldRows.push(0);
  rows.push([input.title]);
  rows.push(["Dönem", input.reportLabel]);
  rows.push(["Hazırlanma tarihi", input.generatedAt]);

  section("Operasyon özeti");
  rows.push(["Ölçüt", "Değer", "Not"]);
  boldRows.push(rows.length - 1);
  const { summary, previousSummary } = input;
  const netFlow = summary.completed_tasks - summary.opened_tasks;
  const coverage =
    summary.opened_tasks === 0
      ? null
      : Math.round((summary.completed_tasks / summary.opened_tasks) * 100);
  rows.push([
    "Dönemde açılan",
    summary.opened_tasks,
    comparison(summary.opened_tasks, previousSummary?.opened_tasks),
  ]);
  rows.push([
    "Dönemde tamamlanan",
    summary.completed_tasks,
    comparison(summary.completed_tasks, previousSummary?.completed_tasks),
  ]);
  rows.push(["Akış dengesi", netFlow, "Tamamlanan − açılan"]);
  rows.push(["Karşılama", coverage == null ? "—" : `%${coverage}`, "Tamamlanan / açılan"]);
  rows.push(["Açık iş yükü", summary.open_tasks, "Bugünkü durum"]);
  rows.push(["Geciken", summary.overdue_tasks, "Teslim tarihi geçmiş açık işler"]);
  rows.push(["Zamanında tamamlama", rate(summary.on_time_rate), "Teslim tarihi olan işlerde"]);
  rows.push([
    "Ortalama tamamlanma süresi",
    days(summary.average_cycle_days),
    "Gün — açılıştan tamamlanmaya",
  ]);

  section("Aktif iş akışı (açık işler hangi aşamada)");
  rows.push(["Durum", "Görev"]);
  boldRows.push(rows.length - 1);
  for (const row of input.workflow) {
    rows.push([TASK_STATUS_LABEL[row.status], row.task_count]);
  }

  section("Teslim sağlığı");
  rows.push(["Kova", "Görev"]);
  boldRows.push(rows.length - 1);
  for (const row of input.dueHealth) {
    rows.push([row.label, row.task_count]);
  }

  section("Tamamlanma süresi dağılımı");
  rows.push(["Aralık", "Görev"]);
  boldRows.push(rows.length - 1);
  for (const bucket of input.cycleTime.buckets) {
    rows.push([bucket.label, bucket.task_count]);
  }
  rows.push(["Örneklem", input.cycleTime.sample_size]);
  rows.push(["Ortalama (gün)", days(input.cycleTime.average_days)]);
  rows.push(["Medyan (gün)", days(input.cycleTime.median_days)]);
  rows.push(["%75'lik dilim (gün)", days(input.cycleTime.p75_days)]);

  section("Trend");
  rows.push(["Dönem", "Açılan", "Tamamlanan"]);
  boldRows.push(rows.length - 1);
  for (const point of input.trend.points) {
    rows.push([point.label, point.opened_tasks, point.completed_tasks]);
  }

  return {
    name: "Özet",
    // Başlık satırı yok (`columns` verilmiyor): bu sayfa tek bir tablo değil,
    // alt alta bölümler. Genişlikler bu yüzden elle.
    columns: undefined,
    rows,
    boldRows,
  };
}

// ---- Sayfa 2: Görev dökümü ----

function taskSheet(input: ReportWorkbookInput): Sheet {
  return {
    name: "Görev dökümü",
    columns: [
      { header: "Görev", width: 46 },
      { header: "Marka", width: 22 },
      { header: "Kategori", width: 18 },
      { header: "İçerik", width: 30 },
      { header: "İçerik türü", width: 14 },
      { header: "Sorumlu", width: 18 },
      { header: "Departman", width: 14 },
      { header: "Durum", width: 14 },
      { header: "Öncelik", width: 10 },
      { header: "Teslim tarihi", width: 13 },
      { header: "Açılış", width: 13 },
      { header: "Tamamlanma", width: 13 },
      { header: "Süre (gün)", width: 11 },
      { header: "Gecikmiş", width: 10 },
      { header: "Dönemde açıldı", width: 15 },
      { header: "Dönemde tamamlandı", width: 19 },
      { header: "Yorum", width: 8 },
      { header: "Arşiv", width: 10 },
    ],
    rows: input.tasks.map((task) => [
      task.title,
      task.brand_name,
      input.clusterLabels[task.cluster] ?? task.cluster ?? UNKNOWN_CLUSTER_LABEL,
      task.content_title,
      CONTENT_TYPE_LABEL[task.content_type as ContentType] ?? task.content_type,
      task.assignee_name ?? "Atanmamış",
      task.assignee_name ? departmentLabel(task.department) : "—",
      TASK_STATUS_LABEL[task.status],
      TASK_PRIORITY_LABEL[task.priority],
      task.due_date ?? "",
      isoDay(task.created_at),
      isoDay(task.completed_at),
      task.cycle_days ?? "",
      yesNo(task.overdue),
      yesNo(task.opened_in_period),
      yesNo(task.completed_in_period),
      task.comment_count,
      task.archived_at ? "Arşivde" : "",
    ]),
  };
}

// ---- Sayfa 3 ve 4: ekrandaki ekip / marka tabloları ----

function peopleSheet(input: ReportWorkbookInput): Sheet {
  return {
    name: "Ekip",
    columns: [
      { header: "Kişi", width: 22 },
      { header: "Departman", width: 14 },
      { header: "Dönemde açılan", width: 15 },
      { header: "Dönemde tamamlanan", width: 19 },
      { header: "Açık iş yükü", width: 13 },
      { header: "Gecikmiş", width: 10 },
      { header: "Zamanında", width: 11 },
      { header: "Ort. süre (gün)", width: 15 },
      { header: "Durum", width: 10 },
    ],
    rows: input.people.map((person) => [
      person.person_name,
      departmentLabel(person.department),
      person.total_tasks,
      person.completed_tasks,
      person.open_tasks,
      person.overdue_tasks,
      rate(person.on_time_rate),
      days(person.average_cycle_days),
      person.active === 1 ? "Aktif" : "Pasif",
    ]),
  };
}

function departmentsSheet(input: ReportWorkbookInput): Sheet {
  return {
    name: "Departman",
    columns: [
      { header: "Departman", width: 18 },
      { header: "Kişi", width: 8 },
      { header: "Aktif kişi", width: 11 },
      { header: "Dönemde açılan", width: 15 },
      { header: "Dönemde tamamlanan", width: 19 },
      { header: "Açık iş yükü", width: 13 },
      { header: "Gecikmiş", width: 10 },
      { header: "Zamanında", width: 11 },
      { header: "Ort. süre (gün)", width: 15 },
    ],
    rows: input.departments.map((department) => [
      departmentLabel(department.department),
      department.person_count,
      department.active_person_count,
      department.total_tasks,
      department.completed_tasks,
      department.open_tasks,
      department.overdue_tasks,
      rate(department.on_time_rate),
      days(department.average_cycle_days),
    ]),
  };
}

function brandsSheet(input: ReportWorkbookInput): Sheet {
  return {
    name: "Marka",
    columns: [
      { header: "Marka", width: 24 },
      { header: "Kategori", width: 18 },
      { header: "Yeni içerik", width: 12 },
      { header: "Dönemde açılan", width: 15 },
      { header: "Dönemde tamamlanan", width: 19 },
      { header: "Açık iş yükü", width: 13 },
      { header: "Gecikmiş", width: 10 },
      { header: "Zamanında", width: 11 },
      { header: "Ort. süre (gün)", width: 15 },
      { header: "Durum", width: 10 },
    ],
    rows: input.brands.map((brand) => [
      brand.brand_name,
      input.clusterLabels[brand.cluster] ?? brand.cluster ?? UNKNOWN_CLUSTER_LABEL,
      brand.total_content,
      brand.total_tasks,
      brand.completed_tasks,
      brand.open_tasks,
      brand.overdue_tasks,
      rate(brand.on_time_rate),
      days(brand.average_cycle_days),
      brand.archived === 1 ? "Arşiv" : "Aktif",
    ]),
  };
}

/**
 * Defterin sayfaları. Departman/ekip/marka sayfaları veri yoksa (kişi
 * raporunda ekip tablosu gönderilmiyor) hiç eklenmez — Excel'de boş sekme
 * bırakmamak için.
 */
export function buildReportSheets(input: ReportWorkbookInput): Sheet[] {
  const sheets: Sheet[] = [summarySheet(input), taskSheet(input)];
  if (input.departments.length > 0) sheets.push(departmentsSheet(input));
  if (input.people.length > 0) sheets.push(peopleSheet(input));
  if (input.brands.length > 0) sheets.push(brandsSheet(input));
  return sheets;
}
