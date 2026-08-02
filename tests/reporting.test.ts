import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { after, beforeEach, describe, it } from "node:test";

const TMP_DB = path.join(os.tmpdir(), `inturlam-test-reporting-${process.pid}.db`);
process.env.INTURLAM_DB_PATH = TMP_DB;

const { getDb } = await import("@/lib/db/client");
const {
  getCycleTimeReport,
  getReportSummary,
  getTrendReport,
  listBrandReport,
  listDueHealthReport,
  listPersonBrandBreakdown,
  listPersonReport,
  listWorkflowReport,
} = await import("@/lib/repositories/reports");
const { bulkUpdateTaskStatus, listAllTasks, updateTaskDetails, updateTaskStatus } =
  await import("@/lib/repositories/tasks");

function resetDb(): void {
  globalThis.__inturlamDb?.close();
  globalThis.__inturlamDb = undefined;
  for (const suffix of ["", "-wal", "-shm"]) {
    fs.rmSync(TMP_DB + suffix, { force: true });
  }
}

function seedBase(db: DatabaseSync): void {
  db.prepare("INSERT INTO brands (id, name, cluster) VALUES (?, ?, ?)").run(
    "b1",
    "Test Marka",
    "tek",
  );
  db.prepare("INSERT INTO people (id, name, avatar_path) VALUES (?, ?, ?)").run(
    "p1",
    "Ayşe",
    "/uploads/people/ayse.png",
  );
  db.prepare("INSERT INTO people (id, name) VALUES (?, ?)").run("p2", "Bora");
  db.prepare(
    `INSERT INTO content_items
      (id, brand_id, title, type, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run("c1", "b1", "Temmuz İçeriği", "Reel", "2026-07-05 09:00:00");
}

function insertTask(
  db: DatabaseSync,
  input: {
    id: string;
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
     VALUES (?, 'c1', ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    input.id,
    `Görev ${input.id}`,
    input.status,
    input.assigneeId ?? "p1",
    input.dueDate ?? null,
    input.completedAt ?? null,
    input.createdAt,
    input.completedAt ?? input.createdAt,
  );
}

beforeEach(resetDb);
after(resetDb);

describe("raporlama migrationı", () => {
  it("eski yayınlanmış görevleri kaybetmeden tamamlanma alanlarını ekliyor", () => {
    const legacy = new DatabaseSync(TMP_DB);
    legacy.exec(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE brands (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, cluster TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0, archived INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE people (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1
      );
      CREATE TABLE content_items (
        id TEXT PRIMARY KEY,
        brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('Reel','Foto','Kampanya','Video','Carousel','KurumsalKimlik','Diger')),
        target_date TEXT,
        status TEXT NOT NULL DEFAULT 'Planlandi' CHECK (status IN ('Planlandi','Uretimde','Tamamlandi','IptalEdildi')),
        assignee_id TEXT REFERENCES people(id) ON DELETE SET NULL,
        archived INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE tasks (
        id TEXT PRIMARY KEY,
        content_item_id TEXT NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Beklemede' CHECK (status IN ('Beklemede','DevamEdiyor','Incelemede','Onaylandi','Yayinlandi')),
        priority TEXT NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Dusuk','Normal','Yuksek','Acil')),
        assignee_id TEXT REFERENCES people(id) ON DELETE SET NULL,
        due_date TEXT,
        notes TEXT,
        repeat_days INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    legacy.prepare("INSERT INTO brands (id, name, cluster) VALUES ('b1', 'Marka', 'tek')").run();
    legacy.prepare("INSERT INTO people (id, name) VALUES ('p1', 'Ayşe')").run();
    legacy
      .prepare(
        "INSERT INTO content_items (id, brand_id, title, type) VALUES ('c1', 'b1', 'İçerik', 'Reel')",
      )
      .run();
    legacy
      .prepare(
        `INSERT INTO tasks
          (id, content_item_id, title, status, assignee_id, updated_at)
         VALUES ('t1', 'c1', 'Yayın', 'Yayinlandi', 'p1', '2026-07-20 12:30:00')`,
      )
      .run();
    legacy.close();

    const db = getDb();
    const row = db
      .prepare("SELECT status, completed_at, completed_by FROM tasks WHERE id = 't1'")
      .get() as {
      status: string;
      completed_at: string | null;
      completed_by: string | null;
    };

    assert.equal(row.status, "Yayinlandi");
    assert.equal(row.completed_at, "2026-07-20 12:30:00");
    assert.equal(row.completed_by, null);
    assert.ok(
      db
        .prepare(
          "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'task_status_events'",
        )
        .get(),
    );
    assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
  });
});

describe("görev durum geçmişi", () => {
  it("tamamlama ve yeniden açma bilgilerini atomik kaydediyor", () => {
    const db = getDb();
    seedBase(db);
    insertTask(db, {
      id: "t1",
      status: "Incelemede",
      createdAt: "2026-07-01 00:00:00",
      dueDate: "2026-07-10",
    });

    assert.equal(updateTaskStatus("t1", "Yayinlandi", "p1"), true);
    const completed = db
      .prepare(
        "SELECT status, completed_at, completed_by FROM tasks WHERE id = 't1'",
      )
      .get() as {
      status: string;
      completed_at: string | null;
      completed_by: string | null;
    };
    assert.equal(completed.status, "Yayinlandi");
    assert.ok(completed.completed_at);
    assert.equal(completed.completed_by, "p1");

    assert.equal(updateTaskStatus("t1", "Yayinlandi", "p1"), false);
    assert.equal(
      (
        db
          .prepare("SELECT COUNT(*) AS count FROM task_status_events WHERE task_id = 't1'")
          .get() as { count: number }
      ).count,
      1,
      "aynı duruma tekrar basmak ikinci olay üretmemeli",
    );

    updateTaskStatus("t1", "Incelemede", "p2");
    const reopened = db
      .prepare(
        "SELECT status, completed_at, completed_by FROM tasks WHERE id = 't1'",
      )
      .get() as {
      status: string;
      completed_at: string | null;
      completed_by: string | null;
    };
    assert.deepEqual({ ...reopened }, {
      status: "Incelemede",
      completed_at: null,
      completed_by: null,
    });
    assert.equal(
      (
        db
          .prepare("SELECT COUNT(*) AS count FROM task_status_events WHERE task_id = 't1'")
          .get() as { count: number }
      ).count,
      2,
    );
  });

  it("toplu durum değişikliğinde her görevin geçmişini kaydediyor", () => {
    const db = getDb();
    seedBase(db);
    insertTask(db, {
      id: "t1",
      status: "Beklemede",
      createdAt: "2026-07-01 00:00:00",
    });
    insertTask(db, {
      id: "t2",
      status: "DevamEdiyor",
      createdAt: "2026-07-02 00:00:00",
    });

    assert.equal(
      bulkUpdateTaskStatus(["t1", "t2"], "Yayinlandi", "p2"),
      2,
    );

    assert.equal(
      (
        db
          .prepare("SELECT COUNT(*) AS count FROM tasks WHERE completed_by = 'p2'")
          .get() as { count: number }
      ).count,
      2,
    );
    assert.equal(
      (
        db.prepare("SELECT COUNT(*) AS count FROM task_status_events").get() as {
          count: number;
        }
      ).count,
      2,
    );
  });
});

describe("görev detay düzenleme", () => {
  it("başlık, teslim tarihi ve notları birlikte güncelliyor", () => {
    const db = getDb();
    seedBase(db);
    insertTask(db, {
      id: "t-edit",
      status: "Beklemede",
      createdAt: "2026-07-01 00:00:00",
    });

    updateTaskDetails({
      id: "t-edit",
      title: "Revize görev başlığı",
      dueDate: "2026-08-10",
      notes: "Yeni brief notu",
    });

    const stored = db
      .prepare("SELECT title, due_date, notes FROM tasks WHERE id = 't-edit'")
      .get();
    assert.deepEqual({ ...(stored as Record<string, unknown>) }, {
      title: "Revize görev başlığı",
      due_date: "2026-08-10",
      notes: "Yeni brief notu",
    });
  });
});

describe("görev atanan profili", () => {
  it("atanan kişinin profil fotoğrafını görev bağlamına taşıyor", () => {
    const db = getDb();
    seedBase(db);
    insertTask(db, {
      id: "t-avatar",
      status: "Beklemede",
      createdAt: "2026-07-01 00:00:00",
    });

    const task = listAllTasks().find((row) => row.id === "t-avatar");
    assert.ok(task);
    assert.equal(task.assignee_name, "Ayşe");
    assert.equal(task.assignee_avatar_path, "/uploads/people/ayse.png");
  });
});

describe("rapor hesapları", () => {
  it("dönemi tamamlanma tarihine göre, iş yükünü bugünkü duruma göre hesaplıyor", () => {
    const db = getDb();
    seedBase(db);
    insertTask(db, {
      id: "t1",
      status: "Yayinlandi",
      createdAt: "2026-07-01 00:00:00",
      completedAt: "2026-07-10 00:00:00",
      dueDate: "2026-07-11",
    });
    insertTask(db, {
      id: "t2",
      status: "Yayinlandi",
      createdAt: "2026-06-01 00:00:00",
      completedAt: "2026-07-15 00:00:00",
      dueDate: "2026-07-10",
    });
    insertTask(db, {
      id: "t3",
      status: "Incelemede",
      createdAt: "2026-07-20 00:00:00",
      dueDate: "2026-07-25",
    });
    insertTask(db, {
      id: "t4",
      status: "Beklemede",
      createdAt: "2026-06-01 00:00:00",
      dueDate: "2026-08-01",
    });

    const range = { start: "2026-07-01", end: "2026-07-31" };
    const summary = getReportSummary(range, "2026-07-30");
    assert.deepEqual(summary, {
      opened_tasks: 2,
      completed_tasks: 2,
      open_tasks: 2,
      overdue_tasks: 1,
      on_time_rate: 50,
      average_cycle_days: 26.5,
    });

    const person = listPersonReport(range, "2026-07-30").find(
      (row) => row.person_id === "p1",
    );
    assert.ok(person);
    assert.equal(person.total_tasks, 2);
    assert.equal(person.completed_tasks, 2);
    assert.equal(person.open_tasks, 2);
    assert.equal(person.overdue_tasks, 1);
    assert.equal(person.on_time_rate, 50);

    const brand = listBrandReport(range, "2026-07-30").find(
      (row) => row.brand_id === "b1",
    );
    assert.ok(brand);
    assert.equal(brand.total_content, 1);
    assert.equal(brand.completed_tasks, 2);
    assert.equal(brand.open_tasks, 2);

    assert.deepEqual(
      listWorkflowReport().map(({ status, task_count }) => [status, task_count]),
      [
        ["Beklemede", 1],
        ["DevamEdiyor", 0],
        ["Incelemede", 1],
        ["Onaylandi", 0],
      ],
    );

    const breakdown = listPersonBrandBreakdown(range).find(
      (row) => row.person_id === "p1" && row.brand_id === "b1",
    );
    assert.deepEqual(breakdown, {
      person_id: "p1",
      brand_id: "b1",
      brand_name: "Test Marka",
      total_tasks: 2,
      completed_tasks: 2,
      open_tasks: 2,
    });

    const trend = getTrendReport(range);
    assert.equal(trend.granularity, "day");
    assert.equal(trend.points.length, 31);
    assert.deepEqual(
      trend.points.find((point) => point.key === "2026-07-01"),
      {
        key: "2026-07-01",
        label: "1 Tem",
        opened_tasks: 1,
        completed_tasks: 0,
      },
    );
    assert.equal(
      trend.points.find((point) => point.key === "2026-07-15")?.completed_tasks,
      1,
    );
    const allTrend = getTrendReport(null);
    assert.equal(allTrend.granularity, "week");
    assert.ok(allTrend.points.some((point) => point.opened_tasks > 0));
    assert.ok(allTrend.points.some((point) => point.completed_tasks > 0));

    assert.deepEqual(getCycleTimeReport(range), {
      sample_size: 2,
      average_days: 26.5,
      median_days: 26.5,
      p75_days: 35.3,
      buckets: [
        { key: "one_day", label: "0–1 gün", task_count: 0 },
        { key: "two_three", label: "2–3 gün", task_count: 0 },
        { key: "four_seven", label: "4–7 gün", task_count: 0 },
        { key: "eight_fourteen", label: "8–14 gün", task_count: 1 },
        { key: "fifteen_plus", label: "15+ gün", task_count: 1 },
      ],
    });

    assert.deepEqual(listDueHealthReport("2026-07-30"), [
      { bucket: "overdue", label: "Gecikmiş", task_count: 1 },
      { bucket: "today", label: "Bugün", task_count: 0 },
      { bucket: "next_seven", label: "Önümüzdeki 7 gün", task_count: 1 },
      { bucket: "later", label: "Daha sonra", task_count: 0 },
      { bucket: "unscheduled", label: "Tarihsiz", task_count: 0 },
    ]);
  });
});
