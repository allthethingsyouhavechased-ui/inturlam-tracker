"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAIN_NAV } from "@/lib/nav";

// Mobil off-canvas panelin üstündeki bölüm linkleri. Header'daki NavLinks
// `md`nin altında gizlendiği için (7 link dar ekranda taşıyordu) bölümlere
// telefondan buradan geçiliyor. Masaüstünde gizli — orada header zaten var.
// Panel rota değişiminde kendiliğinden kapanır (SidebarMobileFrame).
export default function SidebarNavLinks() {
  const pathname = usePathname();

  return (
    <div className="mb-4 space-y-1 border-b border-black/5 pb-4 md:hidden dark:border-white/5">
      {MAIN_NAV.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-brand-600 text-white shadow-sm"
                : "text-zinc-700 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/5"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
