import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { after, beforeEach, describe, it } from "node:test";

const TMP_DB = path.join(os.tmpdir(), `inturlam-test-department-report-${process.pid}.db`);
process.env.INTURLAM_DB_PATH = TMP_DB;

const { getDb } = await import("@/lib/db/client");
const {
  getCycleTimeReport,
  getReportSummary,
  getTrendReport,
  listBrandBreakdownForScope,
  listDepartmentReport,
  listDueHealthReport,
  listPersonReport,
  listPriorityReport,
  listWorkflowReport,
} = await import("@/lib/repositories/reports");
const {
  listCompletedTasksByDepartment,
  listOverdueTasksByDepartment,
  listUpcomingTasksByDepartment,
} = await import("@/lib/repositories/tasks");

function resetDb(): void {
  globalThis.__inturlamDb?.close();
  globalThis.__inturlamDb = undefined;
  for (const suffix of ["", "-wal", "-shm"]) {
    fs.rmSync(TMP_DB + suffix, { force: true });
  }
}

/**
 * design: Sıla (aktif) + Murat (pasif) · video: Yunus · departmansız: Deniz
 * (NULL) ve Eski (silinmiş bir departman id'si — "Diğer" kovasına düşmeli).
 */
function seedDepartments(db: DatabaseSync): void {
  db.prepare("INSERT INTO brands (id, name, cluster) VALUES ('b1', 'Marka A', 'tek')").run();
  db.prepare("INSERT INTO brands (id, name, cluster) VALUES ('b2', 'Marka B', 'tek')").run();
  const person = db.prepare(
    "INSERT INTO people (id, name, department, active) VALUES (?, ?, ?, ?)",
  );
  person.run("sila", "Sıla", "design", 1);
  person.run("murat", "Murat", "design", 0);
  person.run("yunus", "Yunus", "video", 1);
  person.run("deniz", "Deniz", null, 1);
  person.run("eski", "Eski Kayıt", "silinmis-departman", 1);
  const content = db.prepare(
    "INSERT INTO content_items (id, brand_id, title, type, created_at) VALUES (?, ?, ?, ?, ?)",
  );
  content.run("c1", "b1", "Temmuz içeriği", "Reel", "2026-07-01 09:00:00");
  content.run("c2", "b2", "Kampanya", "Kampanya", "2026-07-01 09:00:00");
}

function insertTask(
  db: DatabaseSync,
  input: {
    id: string;
    contentId?: string;
    status: string;
    createdAt: string;
    completedAt?: string | null;
    dueDate?: string | null;
    assigneeId?: string | null;
  },
): void {
  db.prepare(
    `INSERT INTO tasks
      (id, content_item_id, title, status, assignee_id, due_date,
       completed_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    input.id,
    input.contentId ?? "c1",
    `Görev ${input.id}`,
    input.status,
    input.assigneeId ?? null,
    input.dueDate ?? null,
    input.completedAt ?? null,
    input.createdAt,
    input.completedAt ?? input.createdAt,
  );
}

// design: 1 tamamlanan (zamanında, Sıla) + 1 tamamlanan (geç, Murat) +
//         1 gecikmiş açık (Sıla) · video: 1 yaklaşan açık (Yunus)
// atanmamış ve "Diğer" kovasındaki işler ayrıca kontrol ediliyor.
function seedTasks(db: DatabaseSync): void {
  insertTask(db, {
    id: "d1",
    status: "Yayinlandi",
    createdAt: "2026-07-01 00:00:00",
    completedAt: "2026-07-05 00:00:00",
    dueDate: "2026-07-06",
    assigneeId: "sila",
  });
  insertTask(db, {
    id: "d2",
    contentId: "c2",
    status: "Yayinlandi",
    createdAt: "2026-07-01 00:00:00",
    completedAt: "2026-07-15 00:00:00",
    dueDate: "2026-07-10",
    assigneeId: "murat",
  });
  insertTask(db, {
    id: "d3",
    status: "DevamEdiyor",
    createdAt: "2026-07-02 00:00:00",
    dueDate: "2026-07-20",
    assigneeId: "sila",
  });
  insertTask(db, {
    id: "v1",
    status: "Beklemede",
    createdAt: "2026-07-03 00:00:00",
    dueDate: "2026-07-27",
    assigneeId: "yunus",
  });
  insertTask(db, {
    id: "o1",
    status: "Beklemede",
    createdAt: "2026-07-04 00:00:00",
    dueDate: "2026-07-26",
    assigneeId: "deniz",
  });
  insertTask(db, {
    id: "o2",
    status: "Beklemede",
    createdAt: "2026-07-04 00:00:00",
    dueDate: "2026-07-15",
    assigneeId: "eski",
  });
  // Atanmamış iş: hiçbir departmana sayılmamalı.
  insertTask(db, {
    id: "x1",
    status: "Beklemede",
    createdAt: "2026-07-04 00:00:00",
    dueDate: "2026-07-10",
    assigneeId: null,
  });
}

const range = { start: "2026-07-01", end: "2026-07-31" };
const today = "2026-07-25";

beforeEach(resetDb);
after(resetDb);

describe("departman toplamları", () => {
  it("kişileri departmanına göre topluyor, tanınmayan/boş departmanı Diğer'de birleştiriyor", () => {
    const db = getDb();
    seedDepartments(db);
    seedTasks(db);

    const rows = listDepartmentReport(range, today);
    const byKey = new Map(rows.map((row) => [row.department, row]));

    const design = byKey.get("design");
    assert.ok(design);
    assert.equal(design.person_count, 2);
    assert.equal(design.active_person_count, 1, "pasif kişi sayılmalı ama aktif sayılmamalı");
    assert.equal(design.total_tasks, 3);
    assert.equal(design.completed_tasks, 2);
    assert.equal(design.open_tasks, 1);
    assert.equal(design.overdue_tasks, 1);
    assert.equal(design.on_time_rate, 50, "biri zamanında biri geç tamamlandı");
    assert.equal(design.average_cycle_days, 9);

    const video = byKey.get("video");
    assert.ok(video);
    assert.equal(video.person_count, 1);
    assert.equal(video.total_tasks, 1);
    assert.equal(video.completed_tasks, 0);
    assert.equal(video.open_tasks, 1);
    assert.equal(video.overdue_tasks, 0);

    // Departmanı NULL olan ile silinmiş bir departman id'si taşıyan kişi aynı
    // kovada; arayüzdeki `departmentKey()` ile aynı kural.
    const other = byKey.get("other");
    assert.ok(other);
    assert.equal(other.person_count, 2);
    assert.equal(other.open_tasks, 2);
    assert.equal(other.overdue_tasks, 1, "eski kaydın 15 Temmuz teslimi geçmiş");

    assert.equal(
      rows.reduce((total, row) => total + row.open_tasks, 0),
      4,
      "atanmamış görev hiçbir departmana sayılmamalı",
    );
  });

  it("dönemde işi olmayan departman için de doğru sıfırları veriyor", () => {
    const db = getDb();
    seedDepartments(db);
    seedTasks(db);

    const empty = listDepartmentReport(
      { start: "2026-01-01", end: "2026-01-31" },
      today,
    ).find((row) => row.department === "design");
    assert.ok(empty);
    assert.equal(empty.total_tasks, 0, "ocakta açılan iş yok");
    assert.equal(empty.completed_tasks, 0);
    assert.equal(empty.on_time_rate, null);
    // Açık iş yükü dönemden bağımsız, bugünkü durumu gösterir.
    assert.equal(empty.open_tasks, 1);
  });

  it("aralık verilmediğinde görevi olmayan kişiyi 1 iş gibi saymıyor", () => {
    const db = getDb();
    seedDepartments(db);

    const rows = listDepartmentReport(null, today);
    assert.deepEqual(
      rows.map((row) => [row.department, row.total_tasks]).sort(),
      [
        ["design", 0],
        ["other", 0],
        ["video", 0],
      ].sort(),
    );
    assert.deepEqual(
      listPersonReport(null, today).map((row) => row.total_tasks),
      [0, 0, 0, 0, 0],
    );
  });
});

// Departman kapsamı (`{ department }`) kişi kapsamıyla aynı sorguları
// kullanıyor. Buradaki testler asıl riski kilitliyor: kapsam eklenince sayılar
// sessizce tüm ekibi kapsamasın, atanmamış işler departmana sızmasın.
describe("departman bazlı rapor kapsamı", () => {
  it("özet, akış, öncelik ve teslim sağlığını departmana daraltıyor", () => {
    const db = getDb();
    seedDepartments(db);
    seedTasks(db);

    assert.deepEqual(getReportSummary(range, today, { department: "design" }), {
      opened_tasks: 3,
      completed_tasks: 2,
      open_tasks: 1,
      overdue_tasks: 1,
      on_time_rate: 50,
      average_cycle_days: 9,
    });

    // Kapsamsız çağrı eskisi gibi her şeyi kapsar (atanmamış iş dahil).
    assert.equal(getReportSummary(range, today).open_tasks, 5);

    assert.deepEqual(
      listWorkflowReport({ department: "design" }).map(({ status, task_count }) => [
        status,
        task_count,
      ]),
      [
        ["Beklemede", 0],
        ["DevamEdiyor", 1],
        ["Incelemede", 0],
        ["Onaylandi", 0],
      ],
    );

    assert.deepEqual(
      listPriorityReport(today, { department: "video" }).map(
        ({ priority, open_tasks }) => [priority, open_tasks],
      ),
      [
        ["Acil", 0],
        ["Yuksek", 0],
        ["Normal", 1],
        ["Dusuk", 0],
      ],
    );

    assert.deepEqual(
      listDueHealthReport(today, { department: "video" }).map(({ bucket, task_count }) => [
        bucket,
        task_count,
      ]),
      [
        ["overdue", 0],
        ["today", 0],
        ["next_seven", 1],
        ["later", 0],
        ["unscheduled", 0],
      ],
    );

    assert.equal(getCycleTimeReport(range, { department: "design" }).sample_size, 2);
    assert.equal(getCycleTimeReport(range, { department: "video" }).sample_size, 0);
  });

  it("Diğer kovası departmanı boş ve tanınmayan kişileri birlikte kapsıyor", () => {
    const db = getDb();
    seedDepartments(db);
    seedTasks(db);

    const summary = getReportSummary(range, today, { department: "other" });
    assert.equal(summary.open_tasks, 2, "atanmamış görev buraya da girmemeli");
    assert.equal(summary.overdue_tasks, 1);
  });

  it("trend ve marka dağılımını departmana göre süzüyor", () => {
    const db = getDb();
    seedDepartments(db);
    seedTasks(db);

    const trend = getTrendReport(range, { department: "design" });
    assert.equal(
      trend.points.find((point) => point.key === "2026-07-05")?.completed_tasks,
      1,
    );
    assert.equal(
      trend.points.find((point) => point.key === "2026-07-15")?.completed_tasks,
      1,
      "aynı departmandaki pasif kişinin işi de trende girmeli",
    );

    const brands = listBrandBreakdownForScope(range, { department: "design" });
    assert.deepEqual(
      brands.map((row) => [row.brand_name, row.completed_tasks, row.open_tasks]),
      [
        ["Marka A", 1, 1],
        ["Marka B", 1, 0],
      ],
    );
    assert.deepEqual(
      listBrandBreakdownForScope(range, { department: "video" }).map((row) => row.brand_name),
      ["Marka A"],
    );
  });

  it("departmanın gecikmiş / yaklaşan / son tamamlanan görev listelerini veriyor", () => {
    const db = getDb();
    seedDepartments(db);
    seedTasks(db);

    assert.deepEqual(
      listOverdueTasksByDepartment("design", today).map((task) => task.id),
      ["d3"],
    );
    assert.deepEqual(listOverdueTasksByDepartment("video", today), []);
    // Atanmamış "x1" (10 Temmuz teslimli) hiçbir departmanda çıkmamalı.
    assert.deepEqual(
      listOverdueTasksByDepartment("other", today).map((task) => task.id),
      ["o2"],
    );

    // 25 Temmuz + 7 gün → v1 (27 Temmuz) girer, d3 (20 Temmuz, gecikmiş) girmez.
    assert.deepEqual(
      listUpcomingTasksByDepartment("video", today, 7).map((task) => task.id),
      ["v1"],
    );
    assert.deepEqual(listUpcomingTasksByDepartment("design", today, 7), []);

    assert.deepEqual(
      listCompletedTasksByDepartment("design", 5).map((task) => task.id),
      ["d2", "d1"],
    );
    assert.deepEqual(listCompletedTasksByDepartment("video", 5), []);
  });
});
