"use client";

import { useSidebar } from "./SidebarContext";

export default function MobileMenuButton() {
  const { open, toggle } = useSidebar();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
      aria-expanded={open}
      aria-controls="app-sidebar"
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-zinc-600 transition-colors hover:bg-black/5 active:scale-95 dark:text-zinc-300 dark:hover:bg-white/10 md:hidden"
    >
      <svg viewBox="0 0 20 20" className="h-5 w-5 fill-current" aria-hidden="true">
        {open ? (
          <path d="m5.2 4.15 4.8 4.8 4.8-4.8 1.05 1.05-4.8 4.8 4.8 4.8-1.05 1.05-4.8-4.8-4.8 4.8-1.05-1.05 4.8-4.8-4.8-4.8L5.2 4.15Z" />
        ) : (
          <path d="M2 5h16v1.5H2V5Zm0 4.25h16v1.5H2v-1.5Zm0 4.25h16V15H2v-1.5Z" />
        )}
      </svg>
    </button>
  );
}
