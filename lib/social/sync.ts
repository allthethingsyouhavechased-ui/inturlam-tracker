import {
  SOCIAL_FETCH_TIMEOUT_MS,
  SOCIAL_POSTS_PER_ACCOUNT,
  SOCIAL_SILENCE_DAYS,
  resolveSocialProvider,
} from "@/lib/social";
import { createNotification } from "@/lib/repositories/notifications";
import { listSocialAlertRecipients } from "@/lib/repositories/people";
import {
  finishSyncRun,
  getBrandSocialState,
  insertPostsIfNew,
  listBrandSocialRows,
  listTrackedBrands,
  markSilenceAlerted,
  startSyncRun,
  updateBrandSocialState,
  type IncomingPost,
} from "@/lib/repositories/social";
import { classifySocial, shouldAlertSilence, silenceSummary } from "@/lib/socialSilence";

// Taramanın tamamı. Script (db/sync-instagram.mts) bunu çağırır; ileride bir
// route handler'dan da tetiklenebilsin diye burada duruyor.
//
// Tasarımın taşıyıcı kuralı: BAŞARISIZ tarama sessizlik uyarısı ÜRETMEZ.
// Sağlayıcı patladığında her hesap "hiç paylaşım yok" gibi görünür ve sistem
// 19 markayı birden yanlışlıkla suçlar — bu yüzden hata durumu markanın
// durumuna yazılır, uyarı zinciri orada kesilir (bkz. lib/socialSilence.ts).

/** Aynı marka için sessizlik bildirimi tekrarı arasındaki en az gün. */
const RE_ALERT_DAYS = Number(process.env.SOCIAL_REALERT_DAYS ?? 3);

export interface SyncSummary {
  provider: string;
  accounts: number;
  fetchedPosts: number;
  newPosts: number;
  accountErrors: number;
  silent: string[];
  notified: number;
  failed: boolean;
  error: string | null;
}

export async function runInstagramSync(
  log: (message: string) => void = () => {},
): Promise<SyncSummary> {
  const brands = listTrackedBrands();
  const provider = resolveSocialProvider();
  const runId = startSyncRun(provider.name);
  const checkedAt = new Date().toISOString();

  const summary: SyncSummary = {
    provider: provider.name,
    accounts: brands.length,
    fetchedPosts: 0,
    newPosts: 0,
    accountErrors: 0,
    silent: [],
    notified: 0,
    failed: false,
    error: null,
  };

  if (brands.length === 0) {
    finishSyncRun({ id: runId, status: "ok", accounts: 0, newPosts: 0, error: null });
    log("Takip edilecek Instagram hesabı yok (markalarda kullanıcı adı girilmemiş).");
    return summary;
  }

  log(`${brands.length} hesap taranıyor — sağlayıcı: ${provider.name}`);

  try {
    const result = await provider.fetchRecentPosts(
      brands.map((brand) => brand.handle),
      { perAccount: SOCIAL_POSTS_PER_ACCOUNT, timeoutMs: SOCIAL_FETCH_TIMEOUT_MS },
    );
    summary.fetchedPosts = result.posts.length;

    const brandByHandle = new Map(brands.map((brand) => [brand.handle, brand]));
    const incoming: IncomingPost[] = [];
    for (const post of result.posts) {
      const brand = brandByHandle.get(post.handle);
      if (!brand) continue; // sağlayıcı istemediğimiz bir hesabı döndürdüyse yok say
      incoming.push({
        brandId: brand.id,
        externalId: post.externalId,
        postedAt: post.postedAt,
        permalink: post.permalink,
        mediaType: post.mediaType,
        caption: post.caption,
      });
    }

    summary.newPosts = insertPostsIfNew(incoming);

    for (const brand of brands) {
      const accountError = result.errorsByHandle[brand.handle] ?? null;
      if (accountError) summary.accountErrors += 1;
      updateBrandSocialState({
        brandId: brand.id,
        handle: brand.handle,
        status: accountError ? "error" : "ok",
        error: accountError,
        checkedAt,
      });
    }

    finishSyncRun({
      id: runId,
      status: "ok",
      accounts: brands.length,
      newPosts: summary.newPosts,
      error: null,
    });
    log(`Tarama bitti: ${summary.fetchedPosts} gönderi görüldü, ${summary.newPosts} yeni kayıt.`);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    summary.failed = true;
    summary.error = message;
    // Tarama komple başarısızsa hepsi için "hata" damgası: ekranda "sessiz"
    // değil "veri gelmiyor" görünsün, uyarı da üretilmesin.
    for (const brand of brands) {
      updateBrandSocialState({
        brandId: brand.id,
        handle: brand.handle,
        status: "error",
        error: message,
        checkedAt,
      });
    }
    finishSyncRun({
      id: runId,
      status: "error",
      accounts: brands.length,
      newPosts: 0,
      error: message,
    });
    log(`Tarama başarısız: ${message}`);
    return summary;
  }

  // —— Sessizlik uyarıları ——
  const todayIso = new Date().toISOString();
  const recipients = listSocialAlertRecipients();
  const rows = listBrandSocialRows();

  for (const row of rows) {
    const health = classifySocial(row, SOCIAL_SILENCE_DAYS, todayIso);
    if (health !== "silent") continue;
    summary.silent.push(row.brand_name);

    if (
      !shouldAlertSilence({
        health,
        // Uyarı damgası ekranların işine yaramadığı için birleşik satırda
        // taşınmıyor; yalnızca burada okunuyor.
        alertedAt: getBrandSocialState(row.brand_id)?.alerted_at ?? null,
        todayIso,
        reAlertDays: RE_ALERT_DAYS,
      })
    ) {
      continue;
    }

    const days = row.days_silent ?? SOCIAL_SILENCE_DAYS;
    for (const recipient of recipients) {
      createNotification({
        recipientId: recipient.id,
        recipientName: recipient.name,
        actorId: null,
        actorName: "Otomatik takip",
        taskId: null,
        brandId: row.brand_id,
        summary: silenceSummary(row.brand_name, days),
      });
      summary.notified += 1;
    }
    markSilenceAlerted(row.brand_id, todayIso);
  }

  if (summary.silent.length > 0) {
    log(`Sessiz hesaplar (${SOCIAL_SILENCE_DAYS}+ gün): ${summary.silent.join(", ")}`);
  } else {
    log("Sessiz hesap yok.");
  }
  if (summary.notified > 0) log(`${summary.notified} bildirim üretildi.`);

  return summary;
}
