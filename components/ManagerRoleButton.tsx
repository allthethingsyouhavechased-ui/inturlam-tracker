"use client";

import { useTransition } from "react";
import { setManagerRoleAction } from "@/lib/actions/people";

export default function ManagerRoleButton({
  personId,
  isManager,
}: {
  personId: string;
  isManager: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const nextRole = !isManager;

  return (
    <button
      type="button"
      disabled={pending}
      onClick={(event) => {
        event.preventDefault();
        const question = isManager
          ? "Bu kişinin yönetici ve rapor erişimi kaldırılsın mı?"
          : "Bu kişi yönetici yapılsın ve raporlara erişebilsin mi?";
        if (confirm(question)) {
          startTransition(() => setManagerRoleAction(personId, nextRole));
        }
      }}
      className={`touch-target text-xs font-medium disabled:opacity-50 ${
        isManager
          ? "text-amber-700 hover:text-rose-600 dark:text-amber-400 dark:hover:text-rose-400"
          : "text-brand-600 hover:text-brand-500 dark:text-brand-400"
      }`}
    >
      {pending ? "…" : isManager ? "Yöneticiliği kaldır" : "Yönetici yap"}
    </button>
  );
}
