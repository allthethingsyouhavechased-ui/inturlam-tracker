import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, beforeEach, describe, it } from "node:test";

const TMP_DB = path.join(os.tmpdir(), `inturlam-test-personal-targets-${process.pid}.db`);
process.env.INTURLAM_DB_PATH = TMP_DB;

const { getDb } = await import("@/lib/db/client");
const {
  listPersonalTaskTargets,
  setPersonalTaskTarget,
} = await import("@/lib/repositories/personalTargets");
const { bulkUpdateTaskAssignee, updateTaskAssignee, updateTaskStatus } =
  await import("@/lib/repositories/tasks");

function resetDb(): void {
  globalThis.__inturlamDb?.close();
  globalThis.__inturlamDb = undefined;
  for (const suffix of ["", "-wal", "-shm"]) {
    fs.rmSync(TMP_DB + suffix, { force: true });
  }
}

function seedBase(): void {
  const db = getDb();
  db.prepare("INSERT INTO people (id, name) VALUES ('p1', 'Ayşe')").run();
  db.prepare("INSERT INTO people (id, name) VALUES ('p2', 'Bora')").run();
  db.prepare(
    "INSERT INTO brands (id, name, cluster) VALUES ('b1', 'Test Marka', 'tek')",
  ).run();
  db.prepare(
    "INSERT INTO content_items (id, brand_id, title, type) VALUES ('c1', 'b1', 'Test İçerik', 'Reel')",
  ).run();
  db.prepare(
    `INSERT INTO tasks (id, content_item_id, title, assignee_id, due_date)
     VALUES ('t1', 'c1', 'Kurgu', 'p1', '2026-08-10')`,
  ).run();
  db.prepare(
    `INSERT INTO tasks (id, content_item_id, title, assignee_id, due_date)
     VALUES ('t2', 'c1', 'Kapak', 'p2', '2026-08-09')`,
  ).run();
  db.prepare(
    `INSERT INTO tasks (id, content_item_id, title, status, assignee_id, due_date)
     VALUES ('t3', 'c1', 'Yayınlanmış', 'Yayinlandi', 'p1', '2026-08-08')`,
  ).run();
}

beforeEach(() => {
  resetDb();
  seedBase();
});
after(resetDb);

describe("kişisel task hedefleri", () => {
  it("kişinin kendi görevine hedef koymasını, güncellemesini ve kaldırmasını sağlar", () => {
    setPersonalTaskTarget("t1", "p1", "2026-08-08", "2026-08-06");
    const stored = listPersonalTaskTargets("p1");
    assert.equal(stored.length, 1);
    assert.deepEqual(
      {
        task_id: stored[0]?.task_id,
        person_id: stored[0]?.person_id,
        target_date: stored[0]?.target_date,
      },
      { task_id: "t1", person_id: "p1", target_date: "2026-08-08" },
    );
    assert.match(stored[0]?.updated_at ?? "", /^\d{4}-\d{2}-\d{2}/);

    setPersonalTaskTarget("t1", "p1", "2026-08-09", "2026-08-06");
    assert.equal(listPersonalTaskTargets("p1")[0]?.target_date, "2026-08-09");

    setPersonalTaskTarget("t1", "p1", null, "2026-08-06");
    assert.deepEqual(listPersonalTaskTargets("p1"), []);
  });

  it("başkasının ve tamamlanmış görevin hedefini değiştirmeyi reddeder", () => {
    assert.throws(
      () => setPersonalTaskTarget("t2", "p1", "2026-08-08", "2026-08-06"),
      /yalnızca sana atanmış/,
    );
    assert.throws(
      () => setPersonalTaskTarget("t3", "p1", "2026-08-08", "2026-08-06"),
      /Tamamlanmış/,
    );
  });

  it("bozuk ve geçmiş tarihi reddeder; gecikmiş işe toparlanma hedefi koyabilir", () => {
    assert.throws(
      () => setPersonalTaskTarget("t1", "p1", "2026-02-30", "2026-08-06"),
      /Geçersiz/,
    );
    assert.throws(
      () => setPersonalTaskTarget("t1", "p1", "2026-08-05", "2026-08-06"),
      /geçmiş/,
    );

    const db = getDb();
    db.prepare("UPDATE tasks SET due_date = '2026-08-05' WHERE id = 't1'").run();
    assert.doesNotThrow(() =>
      setPersonalTaskTarget("t1", "p1", "2026-08-07", "2026-08-06"),
    );
  });

  it("görev başka kişiye atanınca veya tamamlanınca eski kişisel hedefi temizler", () => {
    setPersonalTaskTarget("t1", "p1", "2026-08-08", "2026-08-06");
    updateTaskAssignee("t1", "p2");
    assert.deepEqual(listPersonalTaskTargets("p1"), []);

    updateTaskAssignee("t1", "p1");
    setPersonalTaskTarget("t1", "p1", "2026-08-09", "2026-08-06");
    updateTaskStatus("t1", "Yayinlandi", "p1");
    assert.deepEqual(listPersonalTaskTargets("p1"), []);
  });

  it("toplu atamada değişmeyen sahibin hedefini korur, değişeninkini temizler", () => {
    setPersonalTaskTarget("t1", "p1", "2026-08-08", "2026-08-06");
    bulkUpdateTaskAssignee(["t1"], "p1");
    assert.equal(listPersonalTaskTargets("p1").length, 1);

    bulkUpdateTaskAssignee(["t1"], "p2");
    assert.deepEqual(listPersonalTaskTargets("p1"), []);
  });
});
