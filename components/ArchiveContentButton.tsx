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
        className="text-xs font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
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
      className="text-xs font-medium text-zinc-400 hover:text-rose-600 disabled:opacity-50"
    >
      {pending ? "…" : "Arşivle"}
    </button>
  );
}
