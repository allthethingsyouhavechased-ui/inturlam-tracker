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
        className="text-xs font-medium text-brand-600 hover:text-brand-500 disabled:opacity-50"
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
      className="text-xs font-medium text-zinc-400 hover:text-rose-600 disabled:opacity-50"
    >
      {pending ? "…" : "Arşivle"}
    </button>
  );
}
