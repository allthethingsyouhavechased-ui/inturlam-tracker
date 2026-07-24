"use client";

import { useSidebarMobile } from "./SidebarMobileContext";

export default function MobileMenuButton() {
  const { toggle } = useSidebarMobile();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Menü"
      className="rounded-md p-1.5 text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10 md:hidden"
    >
      <svg viewBox="0 0 20 20" className="h-5 w-5 fill-current">
        <path d="M2 5h16v1.5H2V5zm0 4.25h16v1.5H2v-1.5zM2 13.5h16V15H2v-1.5z" />
      </svg>
    </button>
  );
}
