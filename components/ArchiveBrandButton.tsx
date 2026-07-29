"use client";

import { useTransition } from "react";
import { archiveBrandAction, unarchiveBrandAction } from "@/lib/actions/brands";

export default function ArchiveBrandButton({
  brandId,
  archived = false,
}: {
  brandId: string;
  archived?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (archived) {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={(e) => {
          e.preventDefault();
          startTransition(() => unarchiveBrandAction(brandId));
        }}
        className="touch-target text-xs font-medium text-brand-600 hover:text-brand-500 disabled:opacity-50 dark:text-brand-400"
      >
        {pending ? "…" : "Arşivden çıkar"}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        if (
          confirm(
            "Bu marka arşivlensin mi? Marka listeden gizlenir ama tüm içerik/görev geçmişi saklanır; istenirse geri arşivden çıkarılabilir.",
          )
        ) {
          startTransition(() => archiveBrandAction(brandId));
        }
      }}
      className="touch-target text-xs font-medium text-zinc-500 hover:text-rose-600 disabled:opacity-50 dark:text-zinc-400 dark:hover:text-rose-400"
    >
      {pending ? "…" : "Arşivle"}
    </button>
  );
}
