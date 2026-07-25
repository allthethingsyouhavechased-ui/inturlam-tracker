import { listBrandsWithOpenCounts } from "@/lib/repositories/brands";
import { groupBrandsByCluster, listClusters } from "@/lib/repositories/clusters";
import { listAllContentSummaries } from "@/lib/repositories/content";
import SidebarBrandGroup from "./SidebarBrandGroup";
import SidebarClusterGroup from "./SidebarClusterGroup";

export default function Sidebar() {
  const brands = listBrandsWithOpenCounts();
  const contents = listAllContentSummaries();
  const groups = groupBrandsByCluster(brands, listClusters());

  const contentsByBrand = new Map<string, typeof contents>();
  for (const c of contents) {
    const arr = contentsByBrand.get(c.brand_id);
    if (arr) arr.push(c);
    else contentsByBrand.set(c.brand_id, [c]);
  }

  // `md:overflow-visible` ŞART: aside'da overflow-y-auto kalırsa içindeki
  // `sticky` nav için yeni bir kaydırma bağlamı oluşur ve sticky sayfaya göre
  // değil bu kutuya göre çalışır — yani hiç çalışmaz, sidebar sayfayla birlikte
  // yukarı kayıp altında boşluk bırakır. Masaüstünde kaydırma içerideki nav'ın
  // işi; mobilde (off-canvas panel) aside'ın kendisi kayar.
  return (
    <aside className="h-full w-64 overflow-y-auto border-r border-black/10 bg-zinc-50 md:w-60 md:overflow-visible md:bg-transparent dark:border-white/10 dark:bg-zinc-950 dark:md:bg-transparent">
      <nav className="space-y-3 p-3 md:sticky md:top-[var(--header-h)] md:max-h-[calc(100vh-var(--header-h))] md:overflow-y-auto">
        {groups.map((group) => {
          if (group.items.length === 0) return null;
          return (
            <SidebarClusterGroup
              key={group.id}
              label={group.label}
              brandIds={group.items.map((b) => b.id)}
            >
              {group.items.map((brand) => (
                <SidebarBrandGroup
                  key={brand.id}
                  brand={brand}
                  contents={contentsByBrand.get(brand.id) ?? []}
                />
              ))}
            </SidebarClusterGroup>
          );
        })}
      </nav>
    </aside>
  );
}
