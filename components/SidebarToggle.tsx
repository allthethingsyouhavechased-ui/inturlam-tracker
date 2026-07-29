"use client";

import { useSidebar } from "./SidebarContext";

// Masaüstünde sidebar'ı daraltır/genişletir. Mobilde gizli — orada sidebar
// zaten off-canvas panel ve `MobileMenuButton` ile açılıyor.
export default function SidebarToggle() {
  const { collapsed, toggleCollapsed } = useSidebar();

  return (
    <button
      type="button"
      onClick={toggleCollapsed}
      aria-label={collapsed ? "Marka panelini genişlet" : "Marka panelini daralt"}
      title={collapsed ? "Marka panelini genişlet" : "Marka panelini daralt"}
      aria-expanded={!collapsed}
      aria-controls="app-sidebar"
      className="hidden h-10 w-10 items-center justify-center rounded-xl text-zinc-600 transition-colors hover:bg-black/5 active:scale-95 md:inline-flex dark:text-zinc-300 dark:hover:bg-white/10"
    >
      <svg viewBox="0 0 20 20" className="h-5 w-5 fill-current">
        {/* Panel ikonu: dış çerçeve + sol sütun. Daraltılmışken sütun boş
            kalır, açıkken dolu — hangi yöne gideceği tek bakışta belli olsun. */}
        <path
          fillRule="evenodd"
          d="M3 3.5A1.5 1.5 0 0 1 4.5 2h11A1.5 1.5 0 0 1 17 3.5v13a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 16.5v-13Zm1.5 0v13H8v-13H4.5Zm5 0v13h6v-13h-6Z"
          clipRule="evenodd"
          opacity={collapsed ? 0.55 : 1}
        />
        {!collapsed && <rect x="4.5" y="3.5" width="3.5" height="13" />}
      </svg>
    </button>
  );
}
