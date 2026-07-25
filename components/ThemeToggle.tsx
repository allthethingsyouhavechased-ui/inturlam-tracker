"use client";

import { useSyncExternalStore } from "react";

// Gerçek tema, layout'taki no-FOUC script'i ile <html>'e boyanmış `.dark`
// class'ında yaşar — yani bir "external system". Bu yüzden React state'i
// yerine useSyncExternalStore ile o class'ı okuyoruz: hem SSR/hydration
// güvenli (server snapshot = false), hem de effect içinde setState çağırmaya
// gerek kalmıyor (react-hooks/set-state-in-effect kuralına takılmaz).
function subscribe(callback: () => void): () => void {
  window.addEventListener("themechange", callback);
  return () => window.removeEventListener("themechange", callback);
}

function getSnapshot(): boolean {
  return document.documentElement.classList.contains("dark");
}

function getServerSnapshot(): boolean {
  return false;
}

export default function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // localStorage erişilemezse (gizli mod vb.) sessizce geç — tema yine
      // bu oturum için çalışır, sadece kalıcı olmaz.
    }
    window.dispatchEvent(new Event("themechange"));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Açık temaya geç" : "Koyu temaya geç"}
      title={dark ? "Açık tema" : "Koyu tema"}
      className="rounded-md p-1.5 text-zinc-500 hover:bg-black/5 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
    >
      {dark ? (
        // Güneş (koyu moddayken açığa dönme ikonu)
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        // Ay (açık moddayken koyuya dönme ikonu)
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
