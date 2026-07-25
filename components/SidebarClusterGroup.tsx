"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

export default function SidebarClusterGroup({
  label,
  brandIds,
  children,
}: {
  label: string;
  brandIds: string[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = brandIds.some((id) => pathname.startsWith(`/brands/${id}`));

  // Kategoriler varsayılan olarak AÇIK (markalar tam tersi — bkz.
  // SidebarBrandGroup). Kullanıcı elle kapatabilir; ama bu kategorideki bir
  // markanın sayfasına geçilirse kategori tekrar açılsın istiyoruz. Bunu
  // useEffect yerine render sırasında state senkronizasyonuyla yapıyoruz
  // (React 19 `set-state-in-effect` kuralı).
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);
  const [prevActive, setPrevActive] = useState(isActive);
  if (isActive !== prevActive) {
    setPrevActive(isActive);
    if (isActive) setManualOpen(null);
  }
  const open = manualOpen ?? true;

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setManualOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-1 rounded-md px-1.5 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 hover:bg-black/5 hover:text-zinc-600 dark:hover:bg-white/5 dark:hover:text-zinc-200"
      >
        <svg
          viewBox="0 0 16 16"
          className={`h-3 w-3 shrink-0 fill-current transition-transform ${open ? "rotate-90" : ""}`}
        >
          <path d="M4 2l8 6-8 6V2z" />
        </svg>
        <span className="truncate">{label}</span>
        <span className="ml-auto shrink-0 font-normal normal-case tracking-normal text-zinc-500 dark:text-zinc-400">
          {brandIds.length}
        </span>
      </button>
      {open && <div className="space-y-0.5">{children}</div>}
    </div>
  );
}
