"use client";

import { useTransition } from "react";
import { archiveContentItemAction, unarchiveContentItemAction } from "@/lib/actions/content";

export default function ArchiveContentButton({
  contentId,
  archived = false,
}: {
  contentId: string;
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
          startTransition(() => unarchiveContentItemAction(contentId));
        }}
        className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-500 disabled:opacity-50"
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
            "Bu içerik/proje arşivlensin mi? Listeden gizlenir ama tüm görev/yorum geçmişi saklanır; istenirse geri arşivden çıkarılabilir.",
          )
        ) {
          startTransition(() => archiveContentItemAction(contentId));
        }
      }}
      className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-50"
    >
      {pending ? "…" : "Arşivle"}
    </button>
  );
}
