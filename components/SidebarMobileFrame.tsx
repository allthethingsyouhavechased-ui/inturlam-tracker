"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSidebarMobile } from "./SidebarMobileContext";

// Sidebar sunucu component'i (marka verisi çeker); bu client sarmalayıcı
// sadece mobilde aç/kapa davranışını yönetir. Desktop'ta normal akışa
// dönüyor (md: class'ları ile), mobilde tam ekran off-canvas panel olur.
export default function SidebarMobileFrame({ children }: { children: React.ReactNode }) {
  const { open, close } = useSidebarMobile();
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
        className={`fixed inset-y-0 left-0 z-30 w-64 -translate-x-full bg-zinc-50 transition-transform md:static md:z-auto md:w-60 md:translate-x-0 md:bg-transparent md:transition-none dark:bg-zinc-950 ${
          open ? "translate-x-0" : ""
        }`}
      >
        {children}
      </div>
    </>
  );
}
