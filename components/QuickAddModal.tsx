"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { createContentItemAction } from "@/lib/actions/content";
import { createTaskAction } from "@/lib/actions/tasks";
import {
  CONTENT_TYPES,
  CONTENT_TYPE_LABEL,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABEL,
} from "@/lib/constants";
import { getActionErrorMessage } from "@/lib/errorMessage";
import type { Person } from "@/lib/types";

const NEW_CONTENT = "__new__";

interface BrandOption {
  id: string;
  name: string;
}

interface ContentOption {
  id: string;
  brand_id: string;
  title: string;
}

const inputClass =
  "w-full min-h-11 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition-[border-color,box-shadow] focus:border-brand-500 dark:border-white/15 dark:bg-zinc-900";

export default function QuickAddModal({
  brands,
  contents,
  people,
  defaultAssigneeId,
}: {
  brands: BrandOption[];
  contents: ContentOption[];
  people: Person[];
  defaultAssigneeId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [brandId, setBrandId] = useState(brands[0]?.id ?? "");
  const [contentId, setContentId] = useState<string>("");
  const [newContentTitle, setNewContentTitle] = useState("");
  const [newContentType, setNewContentType] = useState(CONTENT_TYPES[0]);
  const [taskTitle, setTaskTitle] = useState("");
  const [priority, setPriority] = useState(TASK_PRIORITIES[1]);
  const [assigneeId, setAssigneeId] = useState(defaultAssigneeId ?? "");
  const [dueDate, setDueDate] = useState("");

  const contentsForBrand = useMemo(
    () => contents.filter((c) => c.brand_id === brandId),
    [contents, brandId],
  );

  const effectiveContentId =
    contentId && contentsForBrand.some((c) => c.id === contentId)
      ? contentId
      : (contentsForBrand[0]?.id ?? NEW_CONTENT);

  // Modal açıkken Escape ile kapat + arka planın scroll'unu kilitle.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !pending) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, pending]);

  function reset() {
    setContentId("");
    setNewContentTitle("");
    setTaskTitle("");
    setPriority(TASK_PRIORITIES[1]);
    setAssigneeId(defaultAssigneeId ?? "");
    setDueDate("");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!taskTitle.trim()) {
      setError("Görev başlığı zorunlu.");
      return;
    }
    if (effectiveContentId === NEW_CONTENT && !newContentTitle.trim()) {
      setError("Yeni içerik için başlık zorunlu.");
      return;
    }

    startTransition(async () => {
      try {
        let targetContentId = effectiveContentId;
        if (targetContentId === NEW_CONTENT) {
          const fd = new FormData();
          fd.set("brandId", brandId);
          fd.set("title", newContentTitle.trim());
          fd.set("type", newContentType);
          targetContentId = await createContentItemAction(fd);
        }

        const fd2 = new FormData();
        fd2.set("contentItemId", targetContentId);
        fd2.set("title", taskTitle.trim());
        fd2.set("priority", priority);
        if (assigneeId) fd2.set("assigneeId", assigneeId);
        if (dueDate) fd2.set("dueDate", dueDate);
        await createTaskAction(fd2);

        reset();
        setOpen(false);
      } catch (e) {
        setError(getActionErrorMessage(e));
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-500"
      >
        + Yeni
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-16 sm:pt-24">
          <div
            className="absolute inset-0"
            onClick={() => !pending && setOpen(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="quickadd-title"
            className="relative w-full max-w-md rounded-xl border border-black/10 bg-white p-4 shadow-lg dark:border-white/10 dark:bg-zinc-900"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 id="quickadd-title" className="text-sm font-semibold">
                Hızlı görev ekle
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                aria-label="Kapat"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="grid gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Marka
                <select
                  value={brandId}
                  onChange={(e) => {
                    setBrandId(e.target.value);
                    setContentId("");
                  }}
                  className={inputClass}
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                İçerik / proje
                <select
                  value={effectiveContentId}
                  onChange={(e) => setContentId(e.target.value)}
                  className={inputClass}
                >
                  {contentsForBrand.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                  <option value={NEW_CONTENT}>+ Yeni içerik oluştur</option>
                </select>
              </label>

              {effectiveContentId === NEW_CONTENT && (
                <div className="grid gap-3 rounded-lg border border-dashed border-black/10 p-3 sm:grid-cols-[1fr_auto] dark:border-white/15">
                  <label className="grid gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Yeni içerik başlığı
                    <input
                      value={newContentTitle}
                      onChange={(e) => setNewContentTitle(e.target.value)}
                      placeholder="Örn. Ağustos Reels paketi"
                      className={inputClass}
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Tür
                    <select
                      value={newContentType}
                      onChange={(e) => setNewContentType(e.target.value as (typeof CONTENT_TYPES)[number])}
                      className={inputClass}
                    >
                      {CONTENT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {CONTENT_TYPE_LABEL[t]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

              <label className="grid gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Görev başlığı
                <input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Örn. Kapak görseli hazırla"
                  className={inputClass}
                  autoFocus
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="grid gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Öncelik
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as (typeof TASK_PRIORITIES)[number])}
                    className={inputClass}
                  >
                    {TASK_PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {TASK_PRIORITY_LABEL[p]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Atanan
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
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
                  Teslim tarihi
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={inputClass}
                  />
                </label>
              </div>

              {error && <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={pending || brands.length === 0}
                  className="inline-flex items-center justify-center rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-500 disabled:opacity-50"
                >
                  {pending ? "Oluşturuluyor…" : "Oluştur"}
                </button>
              </div>
            </form>
          </div>
          </div>,
          document.body,
        )}
    </>
  );
}
