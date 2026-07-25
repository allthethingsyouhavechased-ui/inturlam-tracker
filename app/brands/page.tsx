import BrandLogo from "@/components/BrandLogo";
import ArchiveBrandButton from "@/components/ArchiveBrandButton";
import ClusterManager from "@/components/ClusterManager";
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

      <section className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
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
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {inCluster.map((brand) => (
                <div
                  key={brand.id}
                  className="group flex items-center justify-between gap-2 rounded-xl border border-black/10 bg-white px-4 py-3 transition-colors hover:border-brand-300 hover:bg-brand-50/50 dark:border-white/10 dark:bg-zinc-900 dark:hover:border-brand-800 dark:hover:bg-brand-950/30"
                >
                  <Link
                    href={`/brands/${brand.id}`}
                    className="flex flex-1 items-center gap-2.5"
                  >
                    <BrandLogo name={brand.name} logoPath={brand.logo_path} size="sm" />
                    <span className="font-medium">{brand.name}</span>
                  </Link>
                  <div className="flex items-center gap-2">
                    {brand.open_count > 0 ? (
                      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-100 px-2 text-xs font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                        {brand.open_count}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">boş</span>
                    )}
                    <ArchiveBrandButton brandId={brand.id} />
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
                <ArchiveBrandButton brandId={brand.id} archived />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
