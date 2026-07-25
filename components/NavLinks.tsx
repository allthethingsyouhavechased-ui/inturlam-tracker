"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAIN_NAV } from "@/lib/nav";

// Masaüstü bölüm menüsü. 7 link dar ekranda header'ı taşırıp sayfaya yatay
// kaydırma ekliyordu; `md`nin altında gizleniyor ve aynı linkler mobilde
// off-canvas panelin üstünde çıkıyor (components/Sidebar.tsx).
export default function NavLinks() {
  const pathname = usePathname();

  return (
    <span className="hidden items-center gap-1 md:flex">
      {MAIN_NAV.map((link) => {
        const active = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`border-b-2 px-2.5 py-1.5 text-sm transition-colors ${
              active
                ? "border-brand-600 font-medium text-zinc-900 dark:border-brand-400 dark:text-white"
                : "border-transparent text-zinc-600 hover:border-black/20 hover:text-zinc-900 dark:text-zinc-300 dark:hover:border-white/30 dark:hover:text-white"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </span>
  );
}
