"use client";

import { useRef, useState } from "react";
import { createContentItemAction } from "@/lib/actions/content";
import { applyTemplateAction } from "@/lib/actions/templates";
import { CONTENT_TYPES, CONTENT_TYPE_LABEL } from "@/lib/constants";
import { getActionErrorMessage } from "@/lib/errorMessage";
import type { ContentType, Person, TaskTemplate } from "@/lib/types";
import SubmitButton from "./SubmitButton";

const inputClass =
  "w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-white/15 dark:bg-zinc-900";

export default function NewContentForm({
  brandId,
  people,
  templates,
  defaultAssigneeId,
}: {
  brandId: string;
  people: Person[];
  templates: TaskTemplate[];
  defaultAssigneeId?: string | null;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  // Şablon listesi seçilen türe göre daralsın: Reel açarken "Kampanya akışı"
  // önerilmesin. Türü olmayan şablonlar (content_type NULL) hep görünür.
  const [type, setType] = useState<ContentType>("Reel");
  const visibleTemplates = templates.filter(
    (t) => t.content_type === null || t.content_type === type,
  );

  return (
    <form
      ref={ref}
      action={async (fd) => {
        setError(null);
        try {
          const contentId = await createContentItemAction(fd);
          // Şablon ayrı bir adım değil: içerik oluşur oluşmaz görevleri de açılır.
          const templateId = String(fd.get("templateId") ?? "");
          if (templateId) {
            await applyTemplateAction(
              templateId,
              contentId,
              String(fd.get("assigneeId") ?? "") || null,
            );
          }
          ref.current?.reset();
          setType("Reel");
        } catch (e) {
          setError(getActionErrorMessage(e));
        }
      }}
      className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto_auto_auto] sm:items-end"
    >
      <input type="hidden" name="brandId" value={brandId} />
      <label className="grid gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
        Başlık
        <input
          name="title"
          required
          placeholder="Örn. Ağustos Reels paketi"
          className={inputClass}
        />
      </label>
      <label className="grid gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
        Tür
        <select
          name="type"
          className={inputClass}
          value={type}
          onChange={(e) => setType(e.target.value as ContentType)}
        >
          {CONTENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {CONTENT_TYPE_LABEL[t]}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
        Şablon
        <select name="templateId" className={inputClass} defaultValue="">
          <option value="">— görev açma —</option>
          {visibleTemplates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
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
      <label className="grid gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
        Hedef tarih
        <input type="date" name="targetDate" className={inputClass} />
      </label>
      <SubmitButton>Ekle</SubmitButton>
      {error && <p role="alert" className="text-xs text-rose-600 dark:text-rose-400 sm:col-span-6">{error}</p>}
    </form>
  );
}
