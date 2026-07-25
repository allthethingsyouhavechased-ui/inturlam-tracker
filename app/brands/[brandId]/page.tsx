import Link from "next/link";
import { notFound } from "next/navigation";
import ActivityFeed from "@/components/ActivityFeed";
import ArchiveContentButton from "@/components/ArchiveContentButton";
import AutoRefresh from "@/components/AutoRefresh";
import BrandLogo from "@/components/BrandLogo";
import EditBrandForm from "@/components/EditBrandForm";
import NewContentForm from "@/components/NewContentForm";
import {
  CONTENT_STATUS_BADGE,
  CONTENT_STATUS_LABEL,
  CONTENT_TYPE_LABEL,
  UNKNOWN_CLUSTER_LABEL,
} from "@/lib/constants";
import { daysAgoISO, formatDateShort } from "@/lib/date";
import { getCurrentPerson } from "@/lib/identity";
import { getBrand } from "@/lib/repositories/brands";
import { listActivityForBrand } from "@/lib/repositories/activity";
import { clusterLabelMap, listClusters } from "@/lib/repositories/clusters";
import { listArchivedContentByBrand, listContentByBrand } from "@/lib/repositories/content";
import { listActivePeople } from "@/lib/repositories/people";
import { listTemplates } from "@/lib/repositories/templates";

export const dynamic = "force-dynamic";

export default async function BrandPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  const brand = getBrand(brandId);
  if (!brand) notFound();

  const items = listContentByBrand(brandId);
  const archivedItems = listArchivedContentByBrand(brandId);
  const people = listActivePeople();
  const activity = listActivityForBrand(brandId);
  const clusters = listClusters();
  const clusterLabels = clusterLabelMap();
  const templates = listTemplates();
  const me = await getCurrentPerson();

  // Sayılar haftalık tazeleniyor; 7 günden eskiyse (ya da hiç girilmemişse)
  // "tazelenmeli" uyarısı çıkar. Tarihler 'YYYY-MM-DD' olduğu için düz metin
  // karşılaştırması kronolojik sıralamayı doğru verir.
  const staleStats = (brand.stats_updated_at ?? "") < daysAgoISO(7);

  return (
    <div className="space-y-6">
      <AutoRefresh />
      <div className="text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/brands" className="hover:text-zinc-800 dark:hover:text-zinc-200">
          Markalar
        </Link>{" "}
        / <span className="text-zinc-800 dark:text-zinc-200">{brand.name}</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <BrandLogo name={brand.name} logoPath={brand.logo_path} size="lg" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{brand.name}</h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span>{clusterLabels[brand.cluster] ?? UNKNOWN_CLUSTER_LABEL}</span>
            {brand.instagram_handle && (
              <>
                <span>·</span>
                <a
                  href={`https://instagram.com/${brand.instagram_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 hover:text-brand-500 dark:text-brand-400"
                >
                  @{brand.instagram_handle}
                </a>
              </>
            )}
            {brand.tier && (
              <>
                <span>·</span>
                <span className="font-medium">Tier {brand.tier}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <EditBrandForm brand={brand} clusters={clusters} />

      {/* Marka künyesi. Eskiden burada "İlgili markalar" kartları, tam denetim
          raporunun markdown'ı, medyan Reel izlenmesi ve kapak testi rozeti de
          vardı — günlük iş takibinde kullanılmadıkları için kaldırıldı.
          Kalanlar: haftalık tazelenen iki sayı ve kısa bir bilgilendirme. */}
      {(brand.follower_count != null ||
        brand.post_count != null ||
        brand.key_finding) && (
        <section className="space-y-3 rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
          {(brand.follower_count != null || brand.post_count != null) && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              {brand.follower_count != null && (
                <span>
                  <b className="tabular-nums">
                    {brand.follower_count.toLocaleString("tr-TR")}
                  </b>{" "}
                  <span className="text-zinc-500 dark:text-zinc-400">takipçi</span>
                </span>
              )}
              {brand.post_count != null && (
                <span>
                  <b className="tabular-nums">
                    {brand.post_count.toLocaleString("tr-TR")}
                  </b>{" "}
                  <span className="text-zinc-500 dark:text-zinc-400">gönderi</span>
                </span>
              )}
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {brand.stats_updated_at
                  ? `Son güncelleme: ${formatDateShort(brand.stats_updated_at)}`
                  : "Henüz güncellenmedi"}
                {staleStats && (
                  <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    tazelenmeli
                  </span>
                )}
              </span>
            </div>
          )}

          {brand.key_finding && (
            <p className="whitespace-pre-line border-t border-black/10 pt-3 text-sm text-zinc-700 dark:border-white/10 dark:text-zinc-300">
              {brand.key_finding}
            </p>
          )}
        </section>
      )}

      <section className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-semibold">Yeni içerik / proje</h2>
        <NewContentForm
          brandId={brand.id}
          people={people}
          templates={templates}
          defaultAssigneeId={me?.id ?? null}
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          İçerikler ({items.length})
        </h2>
        {items.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Bu markada henüz içerik yok. Yukarıdan ekle.
          </p>
        ) : (
          <ul className="grid gap-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-black/10 bg-white px-4 py-3 transition-colors hover:border-brand-300 hover:bg-brand-50/50 dark:border-white/10 dark:bg-zinc-900 dark:hover:border-brand-800 dark:hover:bg-brand-950/30"
              >
                <Link
                  href={`/brands/${brand.id}/content/${item.id}`}
                  className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-1"
                >
                  <span className="font-medium">{item.title}</span>
                  <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                    {CONTENT_TYPE_LABEL[item.type]}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${CONTENT_STATUS_BADGE[item.status]}`}
                  >
                    {CONTENT_STATUS_LABEL[item.status]}
                  </span>
                  <span className="ml-auto flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                    {item.assignee_name && <span>{item.assignee_name}</span>}
                    {item.task_total > 0 && (
                      <span>
                        {item.task_open} açık / {item.task_total} görev
                      </span>
                    )}
                    {item.target_date && (
                      <span className="tabular-nums">
                        📅 {formatDateShort(item.target_date)}
                      </span>
                    )}
                  </span>
                </Link>
                <ArchiveContentButton contentId={item.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {archivedItems.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Arşivlenenler ({archivedItems.length})
          </h2>
          <ul className="grid gap-2">
            {archivedItems.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-dashed border-black/10 bg-white/60 px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400 dark:border-white/10 dark:bg-zinc-900/60"
              >
                <Link
                  href={`/brands/${brand.id}/content/${item.id}`}
                  className="flex-1"
                >
                  {item.title}
                </Link>
                <ArchiveContentButton contentId={item.id} archived />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Marka hareketleri
        </h2>
        <div className="rounded-xl border border-black/10 bg-white p-2 dark:border-white/10 dark:bg-zinc-900">
          <ActivityFeed
            entries={activity}
            emptyText="Bu markada henüz kayıtlı hareket yok."
          />
        </div>
      </section>
    </div>
  );
}
