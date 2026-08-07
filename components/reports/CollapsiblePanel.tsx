"use client";

// Rapor ekranlarındaki grafik/dağılım kartları uzun; kullanıcı ilgilenmediği
// kartı kapatabilsin ve bu tercih kalıcı olsun diye başlığından katlanıyorlar.
// Tercihin `localStorage` deposu artık `lib/usePanelOpen.ts`'te — Panom'un
// kişisel teslim radarı da aynı depoyu kullanıyor.

import { REPORT_SURFACE_CLASS } from "@/lib/constants";
import { usePanelOpen } from "@/lib/usePanelOpen";

/**
 * Başlığına tıklanınca açılıp kapanan rapor kartı. `panelKey` tercihin
 * saklandığı ad — aynı anahtarı kullanan kartlar (ör. kişi ve departman
 * raporundaki "Teslim sağlığı") tek bir tercihi paylaşır, bilinçli.
 */
export default function CollapsiblePanel({
  panelKey,
  title,
  description,
  meta,
  defaultOpen = true,
  bodyClassName = "px-5 pb-5",
  children,
}: {
  panelKey: string;
  title: string;
  description?: string;
  /** Başlığın sağındaki kısa bilgi (sayı, rozet). Kapalıyken de görünür. */
  meta?: React.ReactNode;
  defaultOpen?: boolean;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  const { open, toggle } = usePanelOpen(panelKey, defaultOpen);
  const bodyId = `panel-${panelKey}`;

  // `min-w-0`: kart bir grid çocuğu olduğunda taşmasın (bkz. CLAUDE.md).
  return (
    <section className={`${REPORT_SURFACE_CLASS} min-w-0`}>
      <h2>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={bodyId}
          className="ui-press flex w-full items-start justify-between gap-3 rounded-2xl p-5 text-left"
        >
          <span className="flex min-w-0 items-start gap-2.5">
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
              className={`mt-1 size-4 shrink-0 text-zinc-500 transition-transform duration-200 dark:text-zinc-400 ${
                open ? "rotate-90" : ""
              }`}
            >
              <path d="M7.21 14.77a.75.75 0 0 1 0-1.06L10.94 10 7.21 6.29a.75.75 0 1 1 1.06-1.06l4.25 4.24a.75.75 0 0 1 0 1.06l-4.25 4.24a.75.75 0 0 1-1.06 0Z" />
            </svg>
            <span className="min-w-0">
              <span className="block text-lg font-semibold">{title}</span>
              {description && (
                <span className="block text-sm font-normal text-zinc-500 dark:text-zinc-400">
                  {description}
                </span>
              )}
            </span>
          </span>
          {meta && <span className="shrink-0 text-sm font-medium">{meta}</span>}
        </button>
      </h2>
      {open && (
        <div id={bodyId} className={`ui-enter ${bodyClassName}`}>
          {children}
        </div>
      )}
    </section>
  );
}
