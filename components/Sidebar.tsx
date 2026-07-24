import { CLUSTERS } from "@/lib/constants";
import { listBrandsWithOpenCounts } from "@/lib/repositories/brands";
import { listAllContentSummaries } from "@/lib/repositories/content";
import SidebarBrandGroup from "./SidebarBrandGroup";

export default function Sidebar() {
  const brands = listBrandsWithOpenCounts();
  const contents = listAllContentSummaries();

  const contentsByBrand = new Map<string, typeof contents>();
  for (const c of contents) {
    const arr = contentsByBrand.get(c.brand_id);
    if (arr) arr.push(c);
    else contentsByBrand.set(c.brand_id, [c]);
  }

  return (
    <aside className="h-full w-64 overflow-y-auto border-r border-black/10 bg-zinc-50 md:h-auto md:w-60 md:bg-transparent dark:border-white/10 dark:bg-zinc-950 dark:md:bg-transparent">
      <nav className="sticky top-[57px] max-h-[calc(100vh-57px)] space-y-4 overflow-y-auto p-3">
        {CLUSTERS.map((cluster) => {
          const inCluster = brands.filter((b) => b.cluster === cluster.id);
          if (inCluster.length === 0) return null;
          return (
            <div key={cluster.id} className="space-y-1">
              <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {cluster.label}
              </h3>
              <div className="space-y-0.5">
                {inCluster.map((brand) => (
                  <SidebarBrandGroup
                    key={brand.id}
                    brand={brand}
                    contents={contentsByBrand.get(brand.id) ?? []}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
