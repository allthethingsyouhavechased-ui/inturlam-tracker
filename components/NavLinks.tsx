"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/brands", label: "Markalar" },
  { href: "/tasks", label: "Görevler" },
  { href: "/reports", label: "Raporlar" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {LINKS.map((link) => {
        const active = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`border-b-2 px-2.5 py-1.5 text-sm transition-colors ${
              active
                ? "border-indigo-600 font-medium text-zinc-900 dark:border-indigo-400 dark:text-white"
                : "border-transparent text-zinc-600 hover:border-black/20 hover:text-zinc-900 dark:text-zinc-300 dark:hover:border-white/30 dark:hover:text-white"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}
