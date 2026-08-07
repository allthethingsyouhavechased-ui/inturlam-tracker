"use client";

// Açılıp kapanan kartların (rapor panelleri, Panom'un kişisel teslim radarı)
// ortak tercih deposu. Bir dönem yalnızca `CollapsiblePanel` içinde yaşıyordu;
// ikinci kullanıcı çıkınca buraya alındı — aynı `localStorage` anahtarını
// paylaşıyorlar, eski tercihler olduğu gibi geçerli.
//
// Depoda YALNIZCA varsayılandan sapan kartlar durur: varsayılan durum yer
// tutmadığı için ileride eklenen bir kart eski bir kayıtla sessizce yanlış
// tarafta açılmaz.
//
// Neden `useSyncExternalStore` de `useEffect` + `setState` değil: depo/prop
// senkronizasyonu için efekt yazmak `react-hooks/set-state-in-effect` kuralına
// takılıyor ve fazladan bir render turu demek (bkz. CLAUDE.md, Sidebar notu).
// Sunucu anlık görüntüsü her zaman varsayılan olduğu için ilk boyama SSR ile
// aynı; sapan kartlar hydration'dan hemen sonra yerine oturuyor.

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "inturlam.reportPanels";

type PanelState = Record<string, boolean>;

let cache: PanelState | null = null;
const listeners = new Set<() => void>();

function readState(): PanelState {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    cache = parsed && typeof parsed === "object" ? (parsed as PanelState) : {};
  } catch {
    // Gizli sekme / depolama kapalı: tercih saklanmaz, kartlar varsayılanla çalışır.
    cache = {};
  }
  return cache;
}

function writeState(key: string, open: boolean, defaultOpen: boolean): void {
  const next = { ...readState() };
  if (open === defaultOpen) delete next[key];
  else next[key] = open;
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Yazamıyorsak da ekran güncel kalsın; sadece kalıcılık kaybolur.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Başka bir sekmede değiştirilen tercih bu sekmede de geçerli olsun.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return;
    cache = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * `panelKey` tercihin saklandığı ad — aynı anahtarı kullanan kartlar (ör. kişi
 * ve departman raporundaki "Teslim sağlığı") tek bir tercihi paylaşır, bilinçli.
 */
export function usePanelOpen(panelKey: string, defaultOpen: boolean) {
  const open = useSyncExternalStore(
    subscribe,
    () => readState()[panelKey] ?? defaultOpen,
    () => defaultOpen,
  );
  const toggle = useCallback(() => {
    writeState(panelKey, !(readState()[panelKey] ?? defaultOpen), defaultOpen);
  }, [panelKey, defaultOpen]);
  return { open, toggle };
}
