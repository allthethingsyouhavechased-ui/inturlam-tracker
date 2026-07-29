import BrandLogo from "@/components/BrandLogo";
import ArchiveBrandButton from "@/components/ArchiveBrandButton";
import ClusterManager from "@/components/ClusterManager";
import DeleteBrandButton from "@/components/DeleteBrandButton";
import NewBrandForm from "@/components/NewBrandForm";
import Link from "next/link";
import { listArchivedBrands, listBrandsWithOpenCounts } from "@/lib/repositories/brands";
import { groupBrandsByCluster, listClusters } from "@/lib/repositories/clusters";

export const dynamic = "force-dynamic";

export default function BrandsPage() {
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
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Markalar</h1>

      <section className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-semibold">Yeni marka ekle</h2>
        <NewBrandForm clusters={clusters} />
      </section>

      <ClusterManager
        clusters={clusters.map((c) => ({
          id: c.id,
          label: c.label,
          brandCount: brandCountByCluster.get(c.id) ?? 0,
        }))}
      />

      {groups.map((group) => {
        const inCluster = group.items;
        if (inCluster.length === 0) return null;
        return (
          <section key={group.id} className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {group.label}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {inCluster.map((brand) => (
                <div
                  key={brand.id}
                  className="group relative flex min-w-0 flex-col gap-4 rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition-[transform,box-shadow,border-color] hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md dark:border-white/5 dark:bg-zinc-900 dark:hover:border-brand-900"
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <Link
                      href={`/brands/${brand.id}`}
                      className="flex min-w-0 items-center gap-3"
                    >
                      <BrandLogo name={brand.name} logoPath={brand.logo_path} size="lg" />
                      <span className="min-w-0">
                        <span className="block truncate font-bold text-zinc-800 transition-colors group-hover:text-brand-700 dark:text-zinc-200 dark:group-hover:text-brand-300">
                          {brand.name}
                        </span>
                        <span className="block truncate text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                          {group.label}
                        </span>
                      </span>
                    </Link>
                    <div className="shrink-0 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                      <ArchiveBrandButton brandId={brand.id} />
                    </div>
                  </div>

                  <div className="mt-auto flex items-end justify-between border-t border-black/5 pt-4 dark:border-white/5">
                    <span>
                      <span className="block text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                        Açık görev
                      </span>
                      <span
                        className={`block text-xl font-bold tabular-nums ${
                          brand.open_count > 0
                            ? "text-brand-700 dark:text-brand-300"
                            : "text-zinc-300 dark:text-zinc-700"
                        }`}
                      >
                        {brand.open_count}
                      </span>
                    </span>
                    <Link
                      href={`/brands/${brand.id}`}
                      aria-label={`${brand.name} detayına git`}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-50 text-zinc-500 transition-colors hover:bg-brand-50 hover:text-brand-700 dark:bg-white/5 dark:text-zinc-400 dark:hover:bg-brand-950 dark:hover:text-brand-300"
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
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
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
