"use client";

import { useEffect, useId, useRef, useState } from "react";
import NewPersonForm from "@/components/NewPersonForm";

export default function NewPersonPopover() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function closeOnOutsideClick(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className="ui-press inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-brand-600 px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500"
      >
        <svg viewBox="0 0 20 20" fill="none" className="size-4" aria-hidden="true">
          <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        Yeni ekip üyesi
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-labelledby={`${panelId}-title`}
          className="ui-enter absolute right-0 z-20 mt-2 w-[min(26rem,calc(100vw-2rem))] rounded-2xl border border-black/10 bg-white p-4 shadow-lg dark:border-white/10 dark:bg-zinc-900"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h3 id={`${panelId}-title`} className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Yeni ekip üyesi ekle
              </h3>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                İsim, departman ve ilk giriş şifresini birlikte belirle.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Yeni ekip üyesi panelini kapat"
              className="touch-target rounded-lg p-1 text-lg leading-none text-zinc-400 transition-colors hover:bg-black/5 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-200"
            >
              ×
            </button>
          </div>
          <NewPersonForm onSuccess={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
