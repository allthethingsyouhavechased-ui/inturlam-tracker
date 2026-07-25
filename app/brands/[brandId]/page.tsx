import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import ArchiveContentButton from "@/components/ArchiveContentButton";
import AutoRefresh from "@/components/AutoRefresh";
import BrandLogo from "@/components/BrandLogo";
import EditBrandForm from "@/components/EditBrandForm";
import NewContentForm from "@/components/NewContentForm";
import {
  CLUSTER_LABEL,
  CONTENT_STATUS_BADGE,
  CONTENT_STATUS_LABEL,
  CONTENT_TYPE_LABEL,
  COVER_TEST_BADGE,
  COVER_TEST_LABEL,
  RELATION_RISK_BADGE,
  RELATION_TYPE_LABEL,
} from "@/lib/constants";
import { formatDateShort } from "@/lib/date";
import { getCurrentPerson } from "@/lib/identity";
import {
  getBrand,
  getBrandAudit,
  listBrandRelations,
} from "@/lib/repositories/brands";
import { listArchivedContentByBrand, listContentByBrand } from "@/lib/repositories/content";
import { listActivePeople } from "@/lib/repositories/people";

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
  const relations = listBrandRelations(brandId);
  const audit = getBrandAudit(brandId);
  const people = listActivePeople();
  const me = await getCurrentPerson();

  return (
    <div className="space-y-6">
      <AutoRefresh />
      <div className="text-sm text-zinc-500">
        <Link href="/brands" className="hover:text-zinc-800 dark:hover:text-zinc-200">
          Markalar
        </Link>{" "}
        / <span className="text-zinc-800 dark:text-zinc-200">{brand.name}</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <BrandLogo name={brand.name} logoPath={brand.logo_path} size="lg" />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{brand.name}</h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span>{CLUSTER_LABEL[brand.cluster]}</span>
            {brand.instagram_handle && (
              <>
                <span>·</span>
                <a
                  href={`https://instagram.com/${brand.instagram_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
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

      <EditBrandForm brand={brand} />

      {(brand.follower_count != null ||
        brand.cover_test_verdict ||
        relations.length > 0 ||
        audit) && (
        <section className="space-y-3 rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
          {(brand.follower_count != null ||
            brand.post_count != null ||
            brand.median_reel_views ||
            brand.cover_test_verdict) && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            {brand.follower_count != null && (
              <span>
                <b className="tabular-nums">
                  {brand.follower_count.toLocaleString("tr-TR")}
                </b>{" "}
                <span className="text-zinc-500">takipçi</span>
              </span>
            )}
            {brand.post_count != null && (
              <span>
                <b className="tabular-nums">
                  {brand.post_count.toLocaleString("tr-TR")}
                </b>{" "}
                <span className="text-zinc-500">gönderi</span>
              </span>
            )}
            {brand.median_reel_views && (
              <span>
                <b>{brand.median_reel_views}</b>{" "}
                <span className="text-zinc-500">medyan Reel izlenmesi</span>
              </span>
            )}
            {brand.cover_test_verdict && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${COVER_TEST_BADGE[brand.cover_test_verdict]}`}
              >
                Kapak testi: {COVER_TEST_LABEL[brand.cover_test_verdict]}
                {brand.cover_test_note && ` (${brand.cover_test_note})`}
              </span>
            )}
          </div>
          )}

          {relations.length > 0 && (
            <div className="space-y-2 border-t border-black/10 pt-3 dark:border-white/10">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                İlgili Markalar
              </h3>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {relations.map((r) => (
                  <Link
                    key={r.id}
                    href={`/brands/${r.related_brand_id}`}
                    className="flex flex-wrap items-center gap-1.5 rounded-lg border border-black/10 px-3 py-2 text-xs transition-colors hover:border-indigo-300 dark:border-white/10 dark:hover:border-indigo-800"
                  >
                    <BrandLogo
                      name={r.related_brand_name}
                      logoPath={r.related_brand_logo_path}
                      size="sm"
                    />
                    <span className="font-medium">{r.related_brand_name}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 ${r.risk_level ? RELATION_RISK_BADGE[r.risk_level] : "bg-black/5 dark:bg-white/10"}`}
                    >
                      {RELATION_TYPE_LABEL[r.relation_type]}
                    </span>
                    <span className="w-full text-zinc-500">{r.note}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {audit && (
            <details className="border-t border-black/10 pt-3 dark:border-white/10">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Tam Denetim Raporu
              </summary>
              <div className="prose prose-sm prose-zinc mt-3 max-w-none dark:prose-invert prose-headings:font-semibold prose-a:text-indigo-600 dark:prose-a:text-indigo-400">
                <ReactMarkdown>{audit.body_markdown}</ReactMarkdown>
              </div>
            </details>
          )}
        </section>
      )}

      <section className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-semibold">Yeni içerik / proje</h2>
        <NewContentForm
          brandId={brand.id}
          people={people}
          defaultAssigneeId={me?.id ?? null}
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          İçerikler ({items.length})
        </h2>
        {items.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Bu markada henüz içerik yok. Yukarıdan ekle.
          </p>
        ) : (
          <ul className="grid gap-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-black/10 bg-white px-4 py-3 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-white/10 dark:bg-zinc-900 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/30"
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
                  <span className="ml-auto flex items-center gap-3 text-xs text-zinc-500">
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
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Arşivlenenler ({archivedItems.length})
          </h2>
          <ul className="grid gap-2">
            {archivedItems.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-dashed border-black/10 bg-white/60 px-4 py-3 text-sm text-zinc-500 dark:border-white/10 dark:bg-zinc-900/60"
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
    </div>
  );
}
