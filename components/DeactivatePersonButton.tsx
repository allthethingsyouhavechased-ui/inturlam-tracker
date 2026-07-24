"use client";

import { useTransition } from "react";
import { deactivatePersonAction, reactivatePersonAction } from "@/lib/actions/people";

export default function DeactivatePersonButton({
  personId,
  active = true,
}: {
  personId: string;
  active?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (!active) {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={(e) => {
          e.preventDefault();
          startTransition(() => reactivatePersonAction(personId));
        }}
        className="text-xs font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
      >
        {pending ? "…" : "Yeniden aktifleştir"}
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
            "Bu kişi ekipten çıkarılsın mı? Geçmiş atamaları/yorumları saklanır ama yeni görev atamalarında görünmez; istenirse geri aktifleştirilebilir.",
          )
        ) {
          startTransition(() => deactivatePersonAction(personId));
        }
      }}
      className="text-xs font-medium text-zinc-400 hover:text-rose-600 disabled:opacity-50"
    >
      {pending ? "…" : "Çıkar"}
    </button>
  );
}
