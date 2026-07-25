// Kategori (küme) yardımcıları. `slugifyCluster` Türkçe karakterleri elle
// çeviriyor (bağımlılık eklememek için) — bozulursa yeni kategoriler bozuk
// id'lerle oluşur. `groupBrandsByCluster` ise sahipsiz markaları "Kategorisiz"
// altında toplamazsa markalar arayüzden kaybolur; ikisi de sessiz hata sınıfı.

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, describe, it } from "node:test";

const TMP_DB = path.join(os.tmpdir(), `inturlam-test-clusters-${process.pid}.db`);
process.env.INTURLAM_DB_PATH = TMP_DB;

const { UNKNOWN_CLUSTER_LABEL } = await import("@/lib/constants");
const {
  createCluster,
  getCluster,
  groupBrandsByCluster,
  listClusters,
  slugifyCluster,
} = await import("@/lib/repositories/clusters");

after(() => {
  globalThis.__inturlamDb?.close();
  globalThis.__inturlamDb = undefined;
  for (const suffix of ["", "-wal", "-shm"]) {
    fs.rmSync(TMP_DB + suffix, { force: true });
  }
});

describe("slugifyCluster", () => {
  it("Türkçe karakterleri ASCII'ye çeviriyor", () => {
    assert.equal(slugifyCluster("Balık & Deniz"), "balik-deniz");
    assert.equal(slugifyCluster("Çiğdem Şişli Öğün Ürün"), "cigdem-sisli-ogun-urun");
    assert.equal(slugifyCluster("İnşaat"), "insaat");
  });

  it("baştaki/sondaki ayraçları temizliyor, boşlukları tekilleştiriyor", () => {
    assert.equal(slugifyCluster("  --Kahve   &   Gıda--  "), "kahve-gida");
  });

  it("yalnızca a-z0-9- üretiyor (form'daki __new__ ile çakışamaz)", () => {
    const slug = slugifyCluster("B2B / Yapı!! (2026)");
    assert.match(slug, /^[a-z0-9-]+$/);
    assert.notEqual(slug, "__new__");
  });

  it("40 karakterle sınırlı", () => {
    assert.ok(slugifyCluster("a".repeat(80)).length <= 40);
  });
});

describe("createCluster", () => {
  it("aynı etiket iki kez eklenince id çakışmıyor", () => {
    const first = createCluster("Test Kategori");
    const second = createCluster("Test Kategori");
    assert.equal(first, "test-kategori");
    assert.equal(second, "test-kategori-2");
    assert.ok(getCluster(first));
    assert.ok(getCluster(second));
  });

  it("yeni kategori listenin sonuna ekleniyor", () => {
    const id = createCluster("En Sondaki");
    const all = listClusters();
    assert.equal(all.at(-1)?.id, id);
  });
});

describe("groupBrandsByCluster", () => {
  const clusters = [
    { id: "balik-deniz", label: "Balık & Deniz", sort_order: 10, created_at: "" },
    { id: "hamam", label: "Hamam", sort_order: 20, created_at: "" },
  ];

  it("markaları kategori sırasına göre grupluyor", () => {
    const groups = groupBrandsByCluster(
      [
        { id: "a", cluster: "hamam" },
        { id: "b", cluster: "balik-deniz" },
        { id: "c", cluster: "balik-deniz" },
      ],
      clusters,
    );
    assert.deepEqual(
      groups.map((g) => [g.id, g.items.map((i) => i.id)]),
      [
        ["balik-deniz", ["b", "c"]],
        ["hamam", ["a"]],
      ],
    );
  });

  it("kategorisi silinmiş marka kaybolmuyor, Kategorisiz altında toplanıyor", () => {
    const groups = groupBrandsByCluster(
      [
        { id: "a", cluster: "hamam" },
        { id: "kayip", cluster: "silinmis-kategori" },
      ],
      clusters,
    );
    const unknown = groups.at(-1);
    assert.equal(unknown?.id, "__unknown");
    assert.equal(unknown?.label, UNKNOWN_CLUSTER_LABEL);
    assert.deepEqual(unknown?.items.map((i) => i.id), ["kayip"]);

    const total = groups.reduce((n, g) => n + g.items.length, 0);
    assert.equal(total, 2, "hiçbir marka düşmemeli");
  });

  it("sahipsiz marka yoksa Kategorisiz grubu hiç eklenmiyor", () => {
    const groups = groupBrandsByCluster([{ id: "a", cluster: "hamam" }], clusters);
    assert.ok(!groups.some((g) => g.id === "__unknown"));
  });
});
