import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, beforeEach, describe, it } from "node:test";

const TMP_DB = path.join(os.tmpdir(), `inturlam-test-active-work-${process.pid}.db`);
process.env.INTURLAM_DB_PATH = TMP_DB;

const { getDb } = await import("@/lib/db/client");
const { listActiveWorkSelections, setPersonActiveBrand } =
  await import("@/lib/repositories/activeWork");

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
    "INSERT INTO brands (id, name, cluster, archived) VALUES ('b1', 'Marka Bir', 'tek', 0)",
  ).run();
  db.prepare(
    "INSERT INTO brands (id, name, cluster, archived) VALUES ('b2', 'Marka İki', 'tek', 0)",
  ).run();
  db.prepare(
    "INSERT INTO brands (id, name, cluster, archived) VALUES ('b3', 'Arşiv Marka', 'tek', 1)",
  ).run();
}

beforeEach(() => {
  resetDb();
  seedBase();
});
after(resetDb);

describe("aktif marka kanbanı", () => {
  it("kişi başına tek marka tutuyor ve yeni seçim eskisini değiştiriyor", () => {
    setPersonActiveBrand("p1", "b1");
    assert.deepEqual(
      listActiveWorkSelections().map(({ person_id, brand_id, brand_name }) => ({
        person_id,
        brand_id,
        brand_name,
      })),
      [{ person_id: "p1", brand_id: "b1", brand_name: "Marka Bir" }],
    );

    setPersonActiveBrand("p1", "b2");
    const selections = listActiveWorkSelections();
    assert.equal(selections.length, 1);
    assert.equal(selections[0].brand_id, "b2");
  });

  it("müsait seçimi kaydı kaldırıyor", () => {
    setPersonActiveBrand("p1", "b1");
    setPersonActiveBrand("p1", null);
    assert.deepEqual(listActiveWorkSelections(), []);
  });

  it("arşivlenmiş marka aktif çalışma olarak seçilemiyor", () => {
    assert.throws(
      () => setPersonActiveBrand("p1", "b3"),
      /bulunamadı veya arşivlenmiş/,
    );
  });
});
