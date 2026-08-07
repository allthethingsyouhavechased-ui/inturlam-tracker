// Sessizlik kararının kilit noktaları. Bu testlerin varlık sebebi tek bir
// yanlış alarm senaryosu: sağlayıcı patladığında 19 markanın hepsi birden
// "hiç paylaşım yok" gibi görünüp ekibe yanlış bildirim gitmesi.

import assert from "node:assert/strict";
import { describe, it } from "node:test";

const { classifySocial, daysBetween, shouldAlertSilence, silenceSummary } = await import(
  "@/lib/socialSilence"
);

const TODAY = "2026-08-07T09:00:00.000Z";

function row(overrides: {
  last_post_at?: string | null;
  last_checked_at?: string | null;
  last_status?: "ok" | "error" | null;
}) {
  return {
    last_post_at: null,
    last_checked_at: "2026-08-07T08:00:00.000Z",
    last_status: "ok" as "ok" | "error" | null,
    ...overrides,
  };
}

describe("daysBetween", () => {
  it("saat farkını yok sayıp tam gün sayar", () => {
    assert.equal(daysBetween("2026-08-01T23:59:00Z", "2026-08-07T00:01:00Z"), 6);
  });

  it("aynı gün için sıfır döner", () => {
    assert.equal(daysBetween("2026-08-07T01:00:00Z", TODAY), 0);
  });
});

describe("classifySocial", () => {
  it("eşiğin içinde paylaşım varsa aktif sayar", () => {
    const health = classifySocial(row({ last_post_at: "2026-08-05T10:00:00Z" }), 7, TODAY);
    assert.equal(health, "ok");
  });

  it("eşik AŞILDIĞINDA sessiz sayar (eşit gün henüz sessiz değil)", () => {
    assert.equal(classifySocial(row({ last_post_at: "2026-07-31T10:00:00Z" }), 7, TODAY), "ok");
    assert.equal(
      classifySocial(row({ last_post_at: "2026-07-30T10:00:00Z" }), 7, TODAY),
      "silent",
    );
  });

  it("hata durumu son paylaşım tarihinin ÖNÜNE geçer", () => {
    // Elimizdeki tarih bayat olabilir; "3 gündür sessiz" demek yanıltıcı olur.
    const health = classifySocial(
      row({ last_post_at: "2026-07-01T10:00:00Z", last_status: "error" }),
      7,
      TODAY,
    );
    assert.equal(health, "error");
  });

  it("hiç gönderi görülmediyse sessiz DEĞİL, bilinmiyor sayar", () => {
    assert.equal(classifySocial(row({ last_post_at: null }), 7, TODAY), "unknown");
  });

  it("hiç taranmamış hesabı ayrı sınıflandırır", () => {
    assert.equal(
      classifySocial(row({ last_checked_at: null, last_status: null }), 7, TODAY),
      "never-checked",
    );
  });
});

describe("shouldAlertSilence", () => {
  it("yalnızca gerçekten sessiz hesap için uyarır", () => {
    for (const health of ["ok", "unknown", "error", "never-checked"] as const) {
      assert.equal(
        shouldAlertSilence({ health, alertedAt: null, todayIso: TODAY, reAlertDays: 3 }),
        false,
        `${health} için uyarı üretilmemeli`,
      );
    }
  });

  it("ilk kez sessiz kalan hesabı bildirir", () => {
    assert.equal(
      shouldAlertSilence({ health: "silent", alertedAt: null, todayIso: TODAY, reAlertDays: 3 }),
      true,
    );
  });

  it("aynı marka için tekrar tekrar bildirmez", () => {
    assert.equal(
      shouldAlertSilence({
        health: "silent",
        alertedAt: "2026-08-06T09:00:00Z",
        todayIso: TODAY,
        reAlertDays: 3,
      }),
      false,
    );
  });

  it("tekrar aralığı dolunca yeniden bildirir", () => {
    assert.equal(
      shouldAlertSilence({
        health: "silent",
        alertedAt: "2026-08-04T09:00:00Z",
        todayIso: TODAY,
        reAlertDays: 3,
      }),
      true,
    );
  });
});

describe("silenceSummary", () => {
  it("marka adını ve gün sayısını içerir", () => {
    assert.equal(
      silenceSummary("Just Cafe", 9),
      "Just Cafe hesabında 9 gündür yeni paylaşım yok.",
    );
  });
});
