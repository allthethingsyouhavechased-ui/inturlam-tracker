"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import BrandLogo from "./BrandLogo";

interface ContentSummary {
  id: string;
  brand_id: string;
  title: string;
  status: string;
}

interface BrandSummary {
  id: string;
  name: string;
  logo_path: string | null;
  open_count: number;
}

export default function SidebarBrandGroup({
  brand,
  contents,
}: {
  brand: BrandSummary;
  contents: ContentSummary[];
}) {
  const pathname = usePathname();
  const isActiveBrand = pathname.startsWith(`/brands/${brand.id}`);

  // Kullanıcı elle daraltıp/genişletebilir, ama başka bir markanın sayfasına
  // geçince o markanın grubu otomatik açılsın isteriz — bunu bir prop yerine
  // "hangi marka aktif" değerinin değişimini render sırasında izleyerek
  // yapıyoruz (KanbanBoard.tsx'teki aynı desen: useEffect değil, render
  // içinde state senkronizasyonu).
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);
  const [prevActive, setPrevActive] = useState(isActiveBrand);
  if (isActiveBrand !== prevActive) {
    setPrevActive(isActiveBrand);
    setManualOpen(null);
  }
  const open = manualOpen ?? isActiveBrand;

  return (
    <div>
      <div
        className={`flex items-center gap-1 rounded-xl px-1.5 py-1.5 text-sm transition-colors ${
          isActiveBrand
            ? "bg-white shadow-sm ring-1 ring-black/5 dark:bg-zinc-800/70 dark:ring-white/5"
            : "hover:bg-black/5 dark:hover:bg-white/5"
        }`}
      >
        <button
          type="button"
          onClick={() => setManualOpen(!open)}
          className="touch-target shrink-0 rounded p-0.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          aria-label={open ? "Daralt" : "Genişlet"}
          aria-expanded={open}
          aria-controls={`sidebar-brand-${brand.id}`}
        >
          <svg
            viewBox="0 0 16 16"
            className={`h-3 w-3 fill-current transition-transform ${open ? "rotate-90" : ""}`}
            aria-hidden="true"
          >
            <path d="M4 2l8 6-8 6V2z" />
          </svg>
        </button>
        <Link
          href={`/brands/${brand.id}`}
          className="flex min-w-0 flex-1 items-center gap-2 truncate"
        >
          <BrandLogo name={brand.name} logoPath={brand.logo_path} size="sm" />
          <span
            className={`truncate font-semibold tracking-tight ${
              isActiveBrand
                ? "text-brand-700 dark:text-brand-300"
                : "text-zinc-700 dark:text-zinc-300"
            }`}
          >
            {brand.name}
          </span>
        </Link>
        {brand.open_count > 0 && (
          <span className="inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
            {brand.open_count}
          </span>
        )}
      </div>

      {open && (
        <div
          id={`sidebar-brand-${brand.id}`}
          className="ml-6 space-y-0.5 border-l border-black/10 py-1 pl-2 dark:border-white/10"
        >
          {contents.length === 0 ? (
            <p className="px-1 py-1 text-xs text-zinc-500 dark:text-zinc-400">İçerik yok</p>
          ) : (
            contents.map((c) => {
              const href = `/brands/${brand.id}/content/${c.id}`;
              const isActiveContent = pathname === href;
              return (
                <Link
                  key={c.id}
                  href={href}
                  className={`block truncate rounded px-1.5 py-1 text-xs ${
                    isActiveContent
                      ? "bg-brand-100 font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                      : "text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/5"
                  }`}
                >
                  {c.title}
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
