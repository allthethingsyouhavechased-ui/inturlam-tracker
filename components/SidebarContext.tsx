"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

// Sidebar'ın iki ayrı durumu var ve bilinçli olarak birbirinden bağımsızlar:
//
// - `open`  → MOBİL off-canvas panel. Kalıcı değil; rota değişiminde kapanır.
// - `collapsed` → MASAÜSTÜ daraltma. Kalıcı (localStorage), çünkü kullanıcı
//   geniş tablo/pano ekranlarında sidebar'ı kapatıp öyle çalışmak isteyebilir
//   ve bu tercihin her sayfada tekrar verilmesi gerekmez.
//
// `collapsed` React state'inde DEĞİL, <html data-sidebar> özniteliğinde yaşıyor:
// layout'taki no-FOUC script'i onu ilk boyamadan ÖNCE yazıyor ve genişliği CSS
// oradan okuyor (globals.css). React state'i olsaydı sayfa bir kare açık
// sidebar'la çizilip sonra kapanırdı. Öznitelik React'in dışında bir "store"
// olduğu için doğru okuma yolu `useSyncExternalStore` — useEffect + setState
// gereksiz bir ekstra render turu demek olurdu.
const STORAGE_KEY = "sidebar-collapsed";
const EVENT = "inturlam:sidebar-collapsed";

function subscribe(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  // Başka bir sekmede değiştirilirse burada da güncellensin.
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readCollapsed(): boolean {
  return document.documentElement.dataset.sidebar === "collapsed";
}

interface SidebarState {
  open: boolean;
  toggle: () => void;
  close: () => void;
  collapsed: boolean;
  toggleCollapsed: () => void;
}

const Ctx = createContext<SidebarState | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  // Sunucuda öznitelik okunamaz; sunucu anlık görüntüsü daima "açık". Bu bir
  // hidrasyon uyuşmazlığı yaratmaz çünkü `collapsed` yalnızca düğmenin
  // etiketini/ikonunu etkiliyor — genişlik zaten CSS'ten geliyor.
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, () => false);

  const toggle = useCallback(() => setOpen((o) => !o), [setOpen]);
  const close = useCallback(() => setOpen(false), [setOpen]);

  const toggleCollapsed = useCallback(() => {
    const next = !readCollapsed();
    document.documentElement.dataset.sidebar = next ? "collapsed" : "";
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // Gizli sekmede localStorage yazılamayabilir — tercih kalıcı olmaz,
      // uygulama yine de çalışır.
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const value = useMemo(
    () => ({ open, toggle, close, collapsed, toggleCollapsed }),
    [open, toggle, close, collapsed, toggleCollapsed],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSidebar(): SidebarState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSidebar, SidebarProvider içinde kullanılmalı.");
  return ctx;
}
