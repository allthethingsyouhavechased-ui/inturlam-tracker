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
    <div className="space-y-0.5 border-b border-black/10 pb-3 md:hidden dark:border-white/10">
      {MAIN_NAV.map((link) => {
        const active = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`block rounded-md px-2 py-2 text-sm transition-colors ${
              active
                ? "bg-brand-50 font-medium text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"
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
