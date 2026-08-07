"use client";

import Link from "next/link";
import { BRAND_VIEW_COOKIE } from "@/lib/constants";

// Kart/Liste tercihi bir ÇEREZDE saklanıyor (localStorage değil): sayfa
// sunucuda render edildiği için tercih ilk boyamada elde olmalı — istemcide
// okunsaydı sayfa önce kart görünümüyle çizilip sonra listeye atlardı.
// URL'deki `?view=` hâlâ önceliklidir; paylaşılan bir link ne diyorsa o açılır.
const ONE_YEAR = 60 * 60 * 24 * 365;

function remember(view: "card" | "list") {
  try {
    document.cookie = `${BRAND_VIEW_COOKIE}=${view}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
  } catch {
    // Çerez yazılamıyorsa tercih kalıcı olmaz; görünüm yine de değişir.
  }
}

export default function BrandViewToggle({ listView }: { listView: boolean }) {
  return (
    <div
      role="group"
      className="inline-flex rounded-xl border border-black/10 bg-white p-0.5 text-xs shadow-sm dark:border-white/15 dark:bg-zinc-900"
      aria-label="Marka görünümü"
    >
      <Link
        href="/brands?view=card"
        onClick={() => remember("card")}
        aria-current={!listView ? "page" : undefined}
        className={`ui-press inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 font-medium ${
          !listView
            ? "bg-brand-600 text-white"
            : "text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
        }`}
      >
        <svg viewBox="0 0 20 20" fill="none" className="size-4" aria-hidden="true">
          <rect x="3" y="3" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
          <rect x="11.5" y="3" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
          <rect x="3" y="11.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
          <rect x="11.5" y="11.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
        </svg>
        Kart
      </Link>
      <Link
        href="/brands?view=list"
        onClick={() => remember("list")}
        aria-current={listView ? "page" : undefined}
        className={`ui-press inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 font-medium ${
          listView
            ? "bg-brand-600 text-white"
            : "text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
        }`}
      >
        <svg viewBox="0 0 20 20" fill="none" className="size-4" aria-hidden="true">
          <path d="M4 5h12M4 10h12M4 15h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        Liste
      </Link>
    </div>
  );
}
