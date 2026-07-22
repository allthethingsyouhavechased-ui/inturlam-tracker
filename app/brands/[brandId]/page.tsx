import Link from "next/link";
import { notFound } from "next/navigation";
import AutoRefresh from "@/components/AutoRefresh";
import NewContentForm from "@/components/NewContentForm";
import {
  CONTENT_STATUS_BADGE,
  CONTENT_STATUS_LABEL,
  CONTENT_TYPE_LABEL,
} from "@/lib/constants";
import { formatDateShort } from "@/lib/date";
import { getBrand } from "@/lib/repositories/brands";
import { listContentByBrand } from "@/lib/repositories/content";

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

  return (
    <div className="space-y-6">
      <AutoRefresh />
      <div className="text-sm text-zinc-500">
        <Link href="/" className="hover:text-zinc-800 dark:hover:text-zinc-200">
          Markalar
        </Link>{" "}
        / <span className="text-zinc-800 dark:text-zinc-200">{brand.name}</span>
      </div>

      <h1 className="text-xl font-semibold tracking-tight">{brand.name}</h1>

      <section className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-semibold">Yeni içerik / proje</h2>
        <NewContentForm brandId={brand.id} />
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
              <li key={item.id}>
                <Link
                  href={`/brands/${brand.id}/content/${item.id}`}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-black/10 bg-white px-4 py-3 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-white/10 dark:bg-zinc-900 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/30"
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
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
