"use client";

import { useRef, useState, useTransition } from "react";
import { addCommentAction } from "@/lib/actions/comments";
import { getActionErrorMessage } from "@/lib/errorMessage";

interface PendingImage {
  file: File;
  url: string;
}

export default function CommentForm({ taskId }: { taskId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<PendingImage[]>([]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function addFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const next = Array.from(fileList).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...next]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((_, i) => i !== index);
    });
  }

  function reset() {
    formRef.current?.reset();
    setImages((prev) => {
      for (const img of prev) URL.revokeObjectURL(img.url);
      return [];
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData();
        fd.set("taskId", taskId);
        fd.set("body", bodyRef.current?.value ?? "");
        for (const { file } of images) fd.append("images", file);
        startTransition(async () => {
          try {
            await addCommentAction(fd);
            reset();
          } catch (err) {
            setError(getActionErrorMessage(err));
          }
        });
      }}
      className="flex flex-col gap-2"
    >
      <textarea
        ref={bodyRef}
        name="body"
        rows={2}
        placeholder="Bir not ekle…"
        className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-white/15 dark:bg-zinc-900"
      />
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, i) => (
            <div key={img.url} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.file.name}
                className="h-16 w-16 rounded-md border border-black/10 object-cover dark:border-white/15"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                aria-label="Görseli kaldır"
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-xs leading-none text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      {error && <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
      <div className="flex items-center justify-between gap-2">
        <label className="cursor-pointer text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 dark:hover:text-brand-400">
          📎 Görsel ekle
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-500 disabled:opacity-50"
        >
          {pending ? "…" : "Yorum ekle"}
        </button>
      </div>
    </form>
  );
}
