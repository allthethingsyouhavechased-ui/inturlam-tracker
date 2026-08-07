// Tarama zincirinin tamamı: sahte sağlayıcı → gönderi kaydı → marka durumu →
// sessizlik bildirimi. Ağa çıkmaz, gerçek veriye dokunmaz (geçici DB).

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, beforeEach, describe, it } from "node:test";

const TMP_DB = path.join(os.tmpdir(), `inturlam-test-social-${process.pid}.db`);
const TMP_MOCK = path.join(os.tmpdir(), `inturlam-test-social-${process.pid}.json`);

process.env.INTURLAM_DB_PATH = TMP_DB;
process.env.SOCIAL_PROVIDER = "mock";
process.env.SOCIAL_MOCK_FILE = TMP_MOCK;
process.env.SOCIAL_SILENCE_DAYS = "7";
process.env.SOCIAL_REALERT_DAYS = "3";

const { getDb } = await import("@/lib/db/client");
const { runInstagramSync } = await import("@/lib/social/sync");
const { listBrandSocialRows, getBrandSocialState, getLatestSyncRun } = await import(
  "@/lib/repositories/social"
);

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

function writeMock(data: {
  posts?: { handle: string; externalId: string; postedAt: string; permalink?: string }[];
  errorsByHandle?: Record<string, string>;
}): void {
  fs.writeFileSync(TMP_MOCK, JSON.stringify(data), "utf-8");
}

function resetDb(): void {
  globalThis.__inturlamDb?.close();
  globalThis.__inturlamDb = undefined;
  for (const suffix of ["", "-wal", "-shm"]) {
    fs.rmSync(TMP_DB + suffix, { force: true });
  }
  const db = getDb();
  db.exec(`
    INSERT INTO brands (id, name, cluster, instagram_handle) VALUES
      ('aktif',  'Aktif Marka',  'test', 'aktifhesap'),
      ('sessiz', 'Sessiz Marka', 'test', 'sessizhesap'),
      ('hatali', 'Hatalı Marka', 'test', 'hatalihesap'),
      ('adsiz',  'Hesapsız Marka', 'test', NULL);
    INSERT INTO people (id, name, is_manager, active, department) VALUES
      ('mudur',   'Müdür',   1, 1, 'management'),
      ('sosyal',  'Sosyalci', 0, 1, 'social'),
      ('tasarim', 'Tasarımcı', 0, 1, 'design'),
      ('pasif',   'Pasif Müdür', 1, 0, 'management');
  `);
}

function notificationCount(): number {
  const row = getDb().prepare("SELECT count(*) AS n FROM notifications").get() as { n: number };
  return row.n;
}

after(() => {
  globalThis.__inturlamDb?.close();
  for (const suffix of ["", "-wal", "-shm"]) fs.rmSync(TMP_DB + suffix, { force: true });
  fs.rmSync(TMP_MOCK, { force: true });
});

describe("runInstagramSync", () => {
  beforeEach(() => {
    resetDb();
  });

  it("gönderileri kaydeder, ikinci taramada tekrar saymaz", async () => {
    writeMock({
      posts: [
        { handle: "aktifhesap", externalId: "p1", postedAt: daysAgoIso(1) },
        { handle: "aktifhesap", externalId: "p2", postedAt: daysAgoIso(4) },
      ],
    });

    const first = await runInstagramSync();
    assert.equal(first.newPosts, 2);
    assert.equal(first.failed, false);

    const second = await runInstagramSync();
    assert.equal(second.fetchedPosts, 2, "sağlayıcı aynı gönderileri tekrar döndürür");
    assert.equal(second.newPosts, 0, "ama yeni kayıt sayılmamalı");
  });

  it("Instagram kullanıcı adı olmayan markayı taramaz", async () => {
    writeMock({ posts: [] });
    const summary = await runInstagramSync();
    assert.equal(summary.accounts, 3);
    assert.ok(!listBrandSocialRows().some((row) => row.brand_id === "adsiz"));
  });

  it("eşiği aşan hesabı yöneticilere VE sosyal medya ekibine bildirir", async () => {
    writeMock({
      posts: [
        { handle: "aktifhesap", externalId: "p1", postedAt: daysAgoIso(1) },
        { handle: "sessizhesap", externalId: "p9", postedAt: daysAgoIso(20) },
      ],
    });

    const summary = await runInstagramSync();
    assert.deepEqual(summary.silent, ["Sessiz Marka"]);

    const recipients = (
      getDb().prepare("SELECT recipient_id FROM notifications ORDER BY recipient_id").all() as {
        recipient_id: string;
      }[]
    ).map((row) => row.recipient_id);
    // Yönetici + sosyal medya; tasarımcı ve PASİF yönetici listede yok.
    assert.deepEqual(recipients, ["mudur", "sosyal"]);
    assert.equal(summary.notified, 2);

    const notification = getDb()
      .prepare("SELECT brand_id, summary FROM notifications LIMIT 1")
      .get() as { brand_id: string; summary: string };
    assert.equal(notification.brand_id, "sessiz");
    assert.match(notification.summary, /Sessiz Marka/);
  });

  it("aynı sessiz hesap için her taramada yeniden bildirmez", async () => {
    writeMock({
      posts: [{ handle: "sessizhesap", externalId: "p9", postedAt: daysAgoIso(20) }],
    });

    await runInstagramSync();
    const afterFirst = notificationCount();
    await runInstagramSync();
    assert.equal(notificationCount(), afterFirst, "tekrar aralığı dolmadan ikinci bildirim olmamalı");
  });

  it("hesap bazlı hatayı sessizlik saymaz", async () => {
    writeMock({
      posts: [{ handle: "aktifhesap", externalId: "p1", postedAt: daysAgoIso(1) }],
      errorsByHandle: { hatalihesap: "Hesap gizli" },
    });

    const summary = await runInstagramSync();
    assert.equal(summary.accountErrors, 1);
    // "hatali" hiç gönderi döndürmedi ama SESSİZ olarak işaretlenmemeli.
    assert.ok(!summary.silent.includes("Hatalı Marka"));
    assert.equal(notificationCount(), 0);

    const state = getBrandSocialState("hatali");
    assert.equal(state?.last_status, "error");
    assert.equal(state?.last_error, "Hesap gizli");
  });

  it("sağlayıcı komple patlarsa hiç bildirim üretmez ve durumu hata olarak damgalar", async () => {
    fs.rmSync(TMP_MOCK, { force: true }); // sahte sağlayıcı dosyayı bulamayınca hata fırlatır

    const summary = await runInstagramSync();
    assert.equal(summary.failed, true);
    assert.equal(summary.notified, 0);
    assert.equal(notificationCount(), 0);

    for (const brandId of ["aktif", "sessiz", "hatali"]) {
      assert.equal(getBrandSocialState(brandId)?.last_status, "error", brandId);
    }
    assert.equal(getLatestSyncRun()?.status, "error");
  });

  it("son paylaşım tarihini en yeni gönderiden alır, 30 günlük sayımı pencereyle sınırlar", async () => {
    writeMock({
      posts: [
        // Pencere dışı (sayıma girmemeli) ama "son paylaşım"ı da belirlememeli.
        { handle: "aktifhesap", externalId: "cok-eski", postedAt: daysAgoIso(45) },
        { handle: "aktifhesap", externalId: "eski", postedAt: daysAgoIso(25) },
        { handle: "aktifhesap", externalId: "yeni", postedAt: daysAgoIso(2) },
      ],
    });

    await runInstagramSync();
    const row = listBrandSocialRows().find((item) => item.brand_id === "aktif");
    assert.equal(row?.days_silent, 2, "en yeni gönderiye göre");
    assert.equal(row?.post_count_30d, 2, "45 günlük gönderi 30 gün penceresine girmemeli");
  });
});
