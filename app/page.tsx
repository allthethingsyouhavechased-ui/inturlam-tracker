import Link from "next/link";
import { CLUSTERS } from "@/lib/constants";
import { listBrandsWithOpenCounts } from "@/lib/repositories/brands";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const brands = listBrandsWithOpenCounts();

  return (
    <div className="space-y-8">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Markalar</h1>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Panom →
        </Link>
      </div>

      {CLUSTERS.map((cluster) => {
        const inCluster = brands.filter((b) => b.cluster === cluster.id);
        if (inCluster.length === 0) return null;
        return (
          <section key={cluster.id} className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {cluster.label}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {inCluster.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/brands/${brand.id}`}
                  className="group flex items-center justify-between rounded-xl border border-black/10 bg-white px-4 py-3 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-white/10 dark:bg-zinc-900 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/30"
                >
                  <span className="font-medium">{brand.name}</span>
                  {brand.open_count > 0 ? (
                    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-indigo-100 px-2 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {brand.open_count}
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-400">boş</span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      {brands.length === 0 && (
        <p className="text-sm text-zinc-500">
          Henüz marka yok. Seed komutunu çalıştır:{" "}
          <code className="rounded bg-black/5 px-1 dark:bg-white/10">
            npm run db:seed
          </code>
        </p>
      )}
    </div>
  );
}
