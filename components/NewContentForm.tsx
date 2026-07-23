"use client";

import { useRef } from "react";
import { createContentItemAction } from "@/lib/actions/content";
import { CONTENT_TYPES, CONTENT_TYPE_LABEL } from "@/lib/constants";
import type { Person } from "@/lib/types";
import SubmitButton from "./SubmitButton";

const inputClass =
  "w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/15 dark:bg-zinc-900";

export default function NewContentForm({
  brandId,
  people,
  defaultAssigneeId,
}: {
  brandId: string;
  people: Person[];
  defaultAssigneeId?: string | null;
}) {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={ref}
      action={async (fd) => {
        await createContentItemAction(fd);
        ref.current?.reset();
      }}
      className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto_auto] sm:items-end"
    >
      <input type="hidden" name="brandId" value={brandId} />
      <label className="grid gap-1 text-xs font-medium text-zinc-500">
        Başlık
        <input
          name="title"
          required
          placeholder="Örn. Ağustos Reels paketi"
          className={inputClass}
        />
      </label>
      <label className="grid gap-1 text-xs font-medium text-zinc-500">
        Tür
        <select name="type" className={inputClass} defaultValue="Reel">
          {CONTENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {CONTENT_TYPE_LABEL[t]}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-xs font-medium text-zinc-500">
        Atanan
        <select
          name="assigneeId"
          className={inputClass}
          defaultValue={defaultAssigneeId ?? ""}
        >
          <option value="">— kimse —</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-xs font-medium text-zinc-500">
        Hedef tarih
        <input type="date" name="targetDate" className={inputClass} />
      </label>
      <SubmitButton>Ekle</SubmitButton>
    </form>
  );
}
