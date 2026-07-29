"use client";

import { usePathname } from "next/navigation";
import { useId, useState } from "react";

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
  const contentId = useId();

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
        aria-controls={contentId}
        className="group flex min-h-10 w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 transition-colors hover:bg-black/5 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-200"
      >
        <svg
          viewBox="0 0 16 16"
          className={`h-2.5 w-2.5 shrink-0 fill-current transition-transform ${open ? "rotate-90" : ""}`}
          aria-hidden="true"
        >
          <path d="M4 2l8 6-8 6V2z" />
        </svg>
        <span className="truncate">{label}</span>
        <span className="ml-auto shrink-0 rounded-full bg-black/5 px-1.5 py-0.5 font-mono text-[9px] tracking-normal dark:bg-white/10">
          {brandIds.length}
        </span>
      </button>
      {open && (
        <div id={contentId} className="space-y-0.5">
          {children}
        </div>
      )}
    </div>
  );
}
