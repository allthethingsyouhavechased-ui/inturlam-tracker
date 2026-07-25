"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSidebar } from "./SidebarContext";

// Sidebar sunucu component'i (marka verisi çeker); bu client sarmalayıcı
// sadece aç/kapa davranışını yönetir. Mobilde tam ekran off-canvas panel,
// masaüstünde normal akışta duran ve daraltılabilen bir sütun.
//
// Masaüstü daraltmasında `display:none` DEĞİL genişlik sıfırlanıyor: panel
// DOM'da kalsın ki geri açıldığında marka ağacının açık/kapalı durumu
// (SidebarBrandGroup'un kendi state'i) sıfırlanmasın.
export default function SidebarMobileFrame({ children }: { children: React.ReactNode }) {
  const { open, close, collapsed } = useSidebar();
  const pathname = usePathname();

  // Mobilde bir markaya/içeriğe tıklayıp gezinince off-canvas menü açık
  // kalmasın — rota değişiminde otomatik kapat.
  useEffect(() => {
    close();
  }, [pathname, close]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
          onClick={close}
          aria-hidden
        />
      )}
      <div
        // `md:w-*` sınıfları burada YOK: masaüstü genişliğini globals.css'teki
        // `html[data-sidebar]` kuralı veriyor. Sebep, sayfa ilk boyanmadan
        // önce (React çalışmadan) doğru genişlikte çizilmesi gerektiği.
        inert={collapsed ? true : undefined}
        className={`sidebar-panel fixed inset-y-0 left-0 z-30 w-64 -translate-x-full bg-zinc-50 transition-transform md:static md:z-auto md:translate-x-0 md:bg-transparent md:transition-[width] md:duration-200 dark:bg-zinc-950 ${
          open ? "translate-x-0" : ""
        }`}
      >
        {children}
      </div>
    </>
  );
}
