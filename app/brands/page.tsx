import BrandLogo from "@/components/BrandLogo";
import ArchiveBrandButton from "@/components/ArchiveBrandButton";
import BrandViewToggle from "@/components/BrandViewToggle";
import ClusterManager from "@/components/ClusterManager";
import DeleteBrandButton from "@/components/DeleteBrandButton";
import NewBrandForm from "@/components/NewBrandForm";
import Link from "next/link";
import { cookies } from "next/headers";
import { listArchivedBrands, listBrandsWithOpenCounts } from "@/lib/repositories/brands";
import { groupBrandsByCluster, listClusters } from "@/lib/repositories/clusters";
import { BRAND_VIEW_COOKIE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function BrandsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string | string[] }>;
}) {
  const params = await searchParams;
  const requestedView = Array.isArray(params.view) ? params.view[0] : params.view;
  // URL > çerez > varsayılan (kart). Çerez, sayfaya her girişte tercihin
  // korunmasını sağlıyor; düğme tıklanınca istemcide yazılıyor
  // (bkz. components/BrandViewToggle.tsx).
  const rememberedView = (await cookies()).get(BRAND_VIEW_COOKIE)?.value;
  const listView = requestedView
    ? requestedView === "list"
    : rememberedView === "list";
  const brands = listBrandsWithOpenCounts();
  const archived = listArchivedBrands();
  const clusters = listClusters();
  const groups = groupBrandsByCluster(brands, clusters);

  // Kategori silinebilirliği arşivdekiler dahil tüm markalara bakar (silme
  // action'ı da öyle) — arşivdeki bir markanın kategorisi yanlışlıkla
  // silinebilir görünmesin diye.
  const brandCountByCluster = new Map<string, number>();
  for (const b of [...brands, ...archived]) {
    brandCountByCluster.set(b.cluster, (brandCountByCluster.get(b.cluster) ?? 0) + 1);
  }

  return (
    // İKİ görünüm de aynı genişlikte: 1600px'lik geniş kabukta liste, marka adı
    // ile sağdaki sayı arasında ekran boyu boşluk bırakıyordu; kart görünümü de
    // gereksiz büyüktü. Ortak, sınırlı genişlik sayesinde Kart↔Liste geçişi
    // sayfayı baştan aşağı değiştirmiyor.
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Markalar</h1>
        <div className="relative flex w-full min-w-0 flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end">
          <BrandViewToggle listView={listView} />

          <details open={brands.length === 0} className="group relative">
            <summary className="ui-press flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl bg-brand-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-brand-500 [&::-webkit-details-marker]:hidden">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
              </svg>
              Yeni marka
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true">
                <path fillRule="evenodd" d="M5.22 7.72a.75.75 0 0 1 1.06 0L10 11.44l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.78a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
            </summary>
            <div className="ui-enter absolute right-0 top-[calc(100%+0.5rem)] z-30 w-[min(60rem,calc(100vw-2rem))] rounded-2xl border border-black/10 bg-white p-4 shadow-xl dark:border-white/10 dark:bg-zinc-900">
              <div className="mb-3">
                <p className="text-sm font-semibold">Yeni marka oluştur</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Temel bilgileri ve logoyu ekleyerek markayı çalışma alanına dahil et.
                </p>
              </div>
              <NewBrandForm clusters={clusters} />
            </div>
          </details>

          <ClusterManager
            clusters={clusters.map((c) => ({
              id: c.id,
              label: c.label,
              brandCount: brandCountByCluster.get(c.id) ?? 0,
            }))}
          />
        </div>
      </div>

      {groups.map((group) => {
        const inCluster = group.items;
        if (inCluster.length === 0) return null;
        return (
          <section key={group.id} className="space-y-2.5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {group.label}
            </h2>
            {listView ? (
              <div className="divide-y divide-black/5 overflow-hidden rounded-xl border border-black/10 bg-white dark:divide-white/5 dark:border-white/10 dark:bg-zinc-900">
                {inCluster.map((brand) => (
                  // Kartla AYNI dil: logo + ad + açık görev sayısı. Tek fark
                  // düzenin kendisi (tek sütun / üç sütun) — Kart↔Liste geçişi
                  // böylece satırların yerini değiştiriyor, sayfayı değil.
                  <div
                    key={brand.id}
                    className="group flex min-h-14 min-w-0 items-center gap-2.5 px-3 py-2 transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.035]"
                  >
                    <Link
                      href={`/brands/${brand.id}`}
                      className="flex min-w-0 flex-1 items-center gap-2.5"
                    >
                      <BrandLogo name={brand.name} logoPath={brand.logo_path} size="sm" />
                      <span className="min-w-0 truncate text-sm font-semibold text-zinc-800 transition-colors group-hover:text-brand-700 dark:text-zinc-200 dark:group-hover:text-brand-300">
                        {brand.name}
                      </span>
                    </Link>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                        <ArchiveBrandButton brandId={brand.id} />
                      </span>
                      <span
                        title={`${brand.open_count} açık görev`}
                        className={`inline-flex size-7 items-center justify-center rounded-full text-xs font-bold tabular-nums ${
                          brand.open_count > 0
                            ? "bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                            : "bg-black/5 text-zinc-500 dark:bg-white/10 dark:text-zinc-400"
                        }`}
                      >
                        {brand.open_count}
                      </span>
                      <Link
                        href={`/brands/${brand.id}`}
                        aria-label={`${brand.name} detayına git`}
                        className="touch-target inline-flex size-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-brand-50 hover:text-brand-700 dark:text-zinc-400 dark:hover:bg-brand-950 dark:hover:text-brand-300"
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor" className="size-4" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Kompakt kart: logo + ad + açık görev sayısı tek satırda.
              // Eskiden iki katlı, 2xl'de 4 sütunlu büyük bir ızgaraydı —
              // liste görünümüne geçince ekran baştan aşağı değişiyordu.
              // Artık iki görünüm de aynı genişlikte ve aynı satır yüksekliğine
              // yakın duruyor, geçiş sıçrama gibi hissettirmiyor.
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {inCluster.map((brand) => (
                  <div
                    key={brand.id}
                    className="group relative flex min-h-14 min-w-0 items-center gap-2.5 rounded-xl border border-black/10 bg-white px-3 py-2 transition-colors hover:border-brand-300 dark:border-white/10 dark:bg-zinc-900 dark:hover:border-brand-800"
                  >
                    <Link
                      href={`/brands/${brand.id}`}
                      className="flex min-w-0 flex-1 items-center gap-2.5"
                    >
                      <BrandLogo name={brand.name} logoPath={brand.logo_path} size="sm" />
                      <span className="min-w-0 truncate text-sm font-semibold text-zinc-800 transition-colors group-hover:text-brand-700 dark:text-zinc-200 dark:group-hover:text-brand-300">
                        {brand.name}
                      </span>
                    </Link>

                    <span
                      title={`${brand.open_count} açık görev`}
                      className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums transition-opacity group-hover:opacity-0 ${
                        brand.open_count > 0
                          ? "bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                          : "bg-black/5 text-zinc-500 dark:bg-white/10 dark:text-zinc-400"
                      }`}
                    >
                      {brand.open_count}
                    </span>
                    {/* Arşivle yalnızca üzerine gelince: sayının yerini alıyor,
                        kart yüksekliği bundan etkilenmesin diye üst üste. */}
                    <div className="absolute right-2 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                      <ArchiveBrandButton brandId={brand.id} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}

      {brands.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Henüz marka yok. Yukarıdan yeni bir marka ekleyebilirsin.
        </p>
      )}

      {archived.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Arşivlenenler ({archived.length})
          </h2>
          <div className={listView ? "grid gap-2" : "grid gap-2 sm:grid-cols-2"}>
            {archived.map((brand) => (
              <div
                key={brand.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-black/10 bg-white/60 px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400 dark:border-white/10 dark:bg-zinc-900/60"
              >
                <span className="flex items-center gap-2.5">
                  <BrandLogo name={brand.name} logoPath={brand.logo_path} size="sm" />
                  <span>{brand.name}</span>
                </span>
                <div className="flex items-center gap-3">
                  <ArchiveBrandButton brandId={brand.id} archived />
                  <DeleteBrandButton brandId={brand.id} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
