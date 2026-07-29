"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
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
  const panelRef = useRef<HTMLDivElement>(null);

  // Mobilde bir markaya/içeriğe tıklayıp gezinince off-canvas menü açık
  // kalmasın — rota değişiminde otomatik kapat.
  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const closeWhenDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) close();
    };
    desktop.addEventListener("change", closeWhenDesktop);
    return () => desktop.removeEventListener("change", closeWhenDesktop);
  }, [close]);

  // Açık mobil drawer bir modal gezinme yüzeyi gibi davranır: sayfanın arkası
  // kaymaz, Escape kapatır, ilk odak kapatma düğmesine gider ve kapanınca
  // kullanıcının önceki odağı geri gelir.
  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Görünürlük/transform geçişi aynı commit'te başladığı için ilk odak bir
    // sonraki frame'den sonra güvenilir şekilde kabul ediliyor.
    const focusTimer = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>("[data-sidebar-close]")?.focus();
    }, 100);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [open, close]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-zinc-950/55 backdrop-blur-[2px] md:hidden"
          onClick={close}
          aria-hidden
        />
      )}
      <div
        ref={panelRef}
        id="app-sidebar"
        // `md:w-*` sınıfları burada YOK: masaüstü genişliğini globals.css'teki
        // `html[data-sidebar]` kuralı veriyor. Sebep, sayfa ilk boyanmadan
        // önce (React çalışmadan) doğru genişlikte çizilmesi gerektiği.
        inert={collapsed && !open ? true : undefined}
        role={open ? "dialog" : undefined}
        aria-modal={open ? true : undefined}
        aria-label={open ? "Gezinme menüsü" : undefined}
        className={`sidebar-panel invisible fixed inset-y-0 left-0 z-50 w-72 -translate-x-full bg-zinc-50 shadow-2xl transition-[transform,visibility] duration-200 md:visible md:static md:z-auto md:w-auto md:translate-x-0 md:bg-transparent md:shadow-none md:transition-[width] dark:bg-zinc-950 ${
          open ? "visible translate-x-0" : ""
        }`}
      >
        <div className="flex h-[var(--header-h)] items-center justify-between border-b border-black/5 px-4 md:hidden dark:border-white/5">
          <span className="text-sm font-semibold tracking-tight">Gezinme</span>
          {open && (
            <button
              type="button"
              onClick={close}
              autoFocus
              data-sidebar-close
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 hover:bg-black/5 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Menüyü kapat"
            >
              <svg viewBox="0 0 20 20" className="h-5 w-5 fill-current" aria-hidden="true">
                <path d="m5.2 4.15 4.8 4.8 4.8-4.8 1.05 1.05-4.8 4.8 4.8 4.8-1.05 1.05-4.8-4.8-4.8 4.8-1.05-1.05 4.8-4.8-4.8-4.8L5.2 4.15Z" />
              </svg>
            </button>
          )}
        </div>
        {children}
      </div>
    </>
  );
}
