"use client";

import { useState } from "react";
import { updateContentItemAction } from "@/lib/actions/content";
import { CONTENT_TYPES, CONTENT_TYPE_LABEL } from "@/lib/constants";
import { getActionErrorMessage } from "@/lib/errorMessage";
import type { ContentItem, Person } from "@/lib/types";
import SubmitButton from "./SubmitButton";

const inputClass =
  "w-full min-h-11 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition-[border-color,box-shadow] focus:border-brand-500 dark:border-white/15 dark:bg-zinc-900";

export default function EditContentForm({
  content,
  people,
}: {
  content: Pick<ContentItem, "id" | "title" | "type" | "target_date" | "assignee_id">;
  people: Person[];
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 dark:hover:text-brand-400"
      >
        Düzenle
      </button>
    );
  }

  return (
    <form
      action={async (fd) => {
        setError(null);
        try {
          await updateContentItemAction(fd);
          setEditing(false);
        } catch (e) {
          setError(getActionErrorMessage(e));
        }
      }}
      className="grid w-full gap-3 rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900 sm:grid-cols-[1fr_auto_auto_auto]"
    >
      <input type="hidden" name="contentId" value={content.id} />
      <label className="grid gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
        Başlık
        <input
          name="title"
          required
          defaultValue={content.title}
          className={inputClass}
        />
      </label>
      <label className="grid gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
        Tür
        <select name="type" defaultValue={content.type} className={inputClass}>
          {CONTENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {CONTENT_TYPE_LABEL[t]}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
        Atanan
        <select
          name="assigneeId"
          defaultValue={content.assignee_id ?? ""}
          className={inputClass}
        >
          <option value="">— kimse —</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
        Hedef tarih
        <input
          type="date"
          name="targetDate"
          defaultValue={content.target_date ?? ""}
          className={inputClass}
        />
      </label>
      <div className="flex items-center gap-3 sm:col-span-4">
        <SubmitButton>Kaydet</SubmitButton>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          Vazgeç
        </button>
        {error && <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
      </div>
    </form>
  );
}
