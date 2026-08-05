// Excel dökümünün can damarı: rapor artık sadece SAYI değil, o sayıların
// arkasındaki işleri de taşımalı. Bu test hem kapsamı (hangi görev dosyaya
// girer) hem de satırın içeriğini (ad, marka, KATEGORİ, içerik, sorumlu)
// kilitliyor — sayfalar sessizce sayıya geri dönmesin.

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { after, beforeEach, describe, it } from "node:test";

const TMP_DB = path.join(os.tmpdir(), `inturlam-test-detail-${process.pid}.db`);
process.env.INTURLAM_DB_PATH = TMP_DB;

const { getDb } = await import("@/lib/db/client");
const { listBrandReport, listTaskDetailReport } = await import("@/lib/repositories/reports");
const { buildReportSheets } = await import("@/lib/reportWorkbook");

function resetDb(): void {
  globalThis.__inturlamDb?.close();
  globalThis.__inturlamDb = undefined;
  for (const suffix of ["", "-wal", "-shm"]) {
    fs.rmSync(TMP_DB + suffix, { force: true });
  }
}

function seed(db: DatabaseSync): void {
  db.prepare("INSERT INTO brands (id, name, cluster) VALUES ('b1', 'Sihirli Olta', 'balik-deniz')").run();
  db.prepare("INSERT INTO people (id, name, department) VALUES ('p1', 'Ayşe', 'design')").run();
  db.prepare("INSERT INTO people (id, name) VALUES ('p2', 'Bora')").run();
  db.prepare(
    `INSERT INTO content_items (id, brand_id, title, type, created_at)
     VALUES ('c1', 'b1', 'Temmuz Reel Serisi', 'Reel', '2026-07-01 09:00:00')`,
  ).run();

  const insert = db.prepare(
    `INSERT INTO tasks
       (id, content_item_id, title, status, priority, assignee_id, due_date,
        completed_at, created_at, updated_at)
     VALUES (?, 'c1', ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  // Dönemde açılıp dönemde tamamlanan (zamanında).
  insert.run("t1", "Kapak görseli", "Yayinlandi", "Yuksek", "p1", "2026-07-12",
    "2026-07-10 12:00:00", "2026-07-05 12:00:00", "2026-07-10 12:00:00");
  // Dönem ÖNCESİ açılmış, hâlâ açık ve gecikmiş.
  insert.run("t2", "Kurgu", "DevamEdiyor", "Acil", "p2", "2026-07-02",
    null, "2026-06-20 12:00:00", "2026-06-20 12:00:00");
  // Dönem ÖNCESİ açılıp dönem ÖNCESİ tamamlanmış → dökümde OLMAMALI.
  insert.run("t3", "Eski brief", "Yayinlandi", "Normal", "p1", "2026-06-05",
    "2026-06-06 12:00:00", "2026-06-01 12:00:00", "2026-06-06 12:00:00");
  // Atanmamış açık iş — sorumlu sütunu boş kalmamalı ("Atanmamış").
  insert.run("t4", "Yayın planı", "Beklemede", "Dusuk", null, null,
    null, "2026-07-20 12:00:00", "2026-07-20 12:00:00");
}

const range = { start: "2026-07-01", end: "2026-07-31" };
const today = "2026-07-25";

beforeEach(resetDb);
after(resetDb);

describe("listTaskDetailReport", () => {
  it("dönemde açılan, dönemde tamamlanan ve hâlâ açık işleri kapsıyor", () => {
    seed(getDb());
    const rows = listTaskDetailReport(range, today);

    assert.deepEqual(
      rows.map((row) => row.task_id).sort(),
      ["t1", "t2", "t4"],
      "dönemin tamamen dışında kalan kapanmış iş dökümde olmamalı",
    );
    // Aralıksız çağrı (Tüm zamanlar) her şeyi kapsar.
    assert.equal(listTaskDetailReport(null, today).length, 4);
  });

  it("satırda işin adını, markasını, kategorisini ve bağlamını taşıyor", () => {
    seed(getDb());
    const row = listTaskDetailReport(range, today).find((r) => r.task_id === "t1")!;

    assert.equal(row.title, "Kapak görseli");
    assert.equal(row.brand_name, "Sihirli Olta");
    assert.equal(row.cluster, "balik-deniz");
    assert.equal(row.content_title, "Temmuz Reel Serisi");
    assert.equal(row.content_type, "Reel");
    assert.equal(row.assignee_name, "Ayşe");
    assert.equal(row.department, "design");
    assert.equal(row.status, "Yayinlandi");
    assert.equal(row.priority, "Yuksek");
    assert.equal(row.due_date, "2026-07-12");
    assert.equal(row.cycle_days, 5);
    assert.equal(row.opened_in_period, 1);
    assert.equal(row.completed_in_period, 1);
    assert.equal(row.overdue, 0);
  });

  it("gecikmeyi bugüne göre işaretliyor, dönem dışı açılışı ayırt ediyor", () => {
    seed(getDb());
    const row = listTaskDetailReport(range, today).find((r) => r.task_id === "t2")!;

    assert.equal(row.overdue, 1, "teslim tarihi geçmiş açık iş gecikmiş sayılmalı");
    assert.equal(row.opened_in_period, 0, "haziranda açılan iş dönemde açılan değil");
    assert.equal(row.completed_in_period, 0);
    assert.equal(row.cycle_days, null, "tamamlanmamış işin süresi olmaz");
  });

  it("kişi kapsamı verildiğinde yalnızca o kişinin işlerini döndürüyor", () => {
    seed(getDb());
    assert.deepEqual(
      listTaskDetailReport(range, today, "p1").map((row) => row.task_id),
      ["t1"],
    );
    assert.deepEqual(
      listTaskDetailReport(range, today, "p2").map((row) => row.task_id),
      ["t2"],
    );
  });
});

describe("buildReportSheets", () => {
  it("özet + görev dökümü sayfalarını etiketli değerlerle dolduruyor", () => {
    const db = getDb();
    seed(db);
    const sheets = buildReportSheets({
      title: "Portföy geneli",
      reportLabel: "1 Tem 2026 – 31 Tem 2026",
      generatedAt: "25 Temmuz 2026 10:00",
      summary: {
        opened_tasks: 2,
        completed_tasks: 1,
        open_tasks: 2,
        overdue_tasks: 1,
        on_time_rate: 100,
        average_cycle_days: 5,
      },
      previousSummary: null,
      workflow: [{ status: "Beklemede", task_count: 1 }],
      dueHealth: [{ bucket: "overdue", label: "Gecikmiş", task_count: 1 }],
      cycleTime: { sample_size: 1, average_days: 5, median_days: 5, p75_days: 5, buckets: [] },
      trend: { granularity: "day", points: [] },
      tasks: listTaskDetailReport(range, today),
      people: [],
      brands: listBrandReport(range, today),
      departments: [],
      clusterLabels: { "balik-deniz": "Balık & Deniz" },
    });

    assert.deepEqual(sheets.map((sheet) => sheet.name), ["Özet", "Görev dökümü", "Marka"]);

    // Özet sayfası ekrandaki kartların kendisini taşımalı.
    const summaryCells = sheets[0].rows.flat();
    assert.ok(summaryCells.includes("Dönemde tamamlanan"));
    assert.ok(summaryCells.includes("1 Tem 2026 – 31 Tem 2026"));

    // Döküm sayfasında ham enum değil, ekranda görünen Türkçe etiket olmalı.
    const detail = sheets[1];
    assert.deepEqual(
      detail.columns?.slice(0, 5).map((column) => column.header),
      ["Görev", "Marka", "Kategori", "İçerik", "İçerik türü"],
    );
    const published = detail.rows.find((row) => row[0] === "Kapak görseli")!;
    assert.equal(published[2], "Balık & Deniz", "kategori id değil etiket yazılmalı");
    assert.equal(published[5], "Ayşe");
    assert.equal(published[6], "Tasarım");
    assert.equal(published[7], "Yayınlandı");
    assert.equal(published[8], "Yüksek");

    const unassigned = detail.rows.find((row) => row[0] === "Yayın planı")!;
    assert.equal(unassigned[5], "Atanmamış");
    assert.equal(unassigned[6], "—", "atanmamış işe departman uydurulmamalı");
  });
});
