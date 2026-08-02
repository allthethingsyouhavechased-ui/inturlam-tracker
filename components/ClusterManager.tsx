"use client";

import { useRef, useState, useTransition } from "react";
import {
  createClusterAction,
  deleteClusterAction,
  renameClusterAction,
} from "@/lib/actions/clusters";
import { getActionErrorMessage } from "@/lib/errorMessage";
import SubmitButton from "./SubmitButton";

const inputClass =
  "min-h-11 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-white/15 dark:bg-zinc-900";

interface ClusterItem {
  id: string;
  label: string;
  brandCount: number;
}

function ClusterRow({
  cluster,
  onError,
}: {
  cluster: ClusterItem;
  onError: (message: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  if (editing) {
    return (
      <form
        action={async (fd) => {
          onError(null);
          try {
            await renameClusterAction(fd);
            setEditing(false);
          } catch (e) {
            onError(getActionErrorMessage(e));
          }
        }}
        className="flex items-center gap-2"
      >
        <input type="hidden" name="clusterId" value={cluster.id} />
        <input
          name="label"
          required
          autoFocus
          defaultValue={cluster.label}
          className={inputClass}
        />
        <SubmitButton>Kaydet</SubmitButton>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          Vazgeç
        </button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]">
      <span className="flex-1 truncate text-sm">{cluster.label}</span>
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{cluster.brandCount} marka</span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 dark:hover:text-brand-400"
      >
        Yeniden adlandır
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          onError(null);
          if (!confirm(`“${cluster.label}” kategorisi silinsin mi?`)) return;
          startTransition(async () => {
            try {
              await deleteClusterAction(cluster.id);
            } catch (e) {
              onError(getActionErrorMessage(e));
            }
          });
        }}
        className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-50"
      >
        {pending ? "…" : "Sil"}
      </button>
    </div>
  );
}

export default function ClusterManager({ clusters }: { clusters: ClusterItem[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const newFormRef = useRef<HTMLFormElement>(null);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={`ui-press flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors ${
          open
            ? "border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-800 dark:bg-brand-950/35 dark:text-brand-300"
            : "border-black/10 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-white/[0.06]"
        }`}
      >
        <svg
          viewBox="0 0 16 16"
          className={`h-3 w-3 fill-current text-zinc-500 dark:text-zinc-400 transition-transform ${open ? "rotate-90" : ""}`}
          aria-hidden="true"
        >
          <path d="M4 2l8 6-8 6V2z" />
        </svg>
        Kategoriler
        <span className="rounded-full bg-black/5 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-zinc-500 dark:bg-white/10 dark:text-zinc-400">
          {clusters.length}
        </span>
      </button>

      {open && (
        <div className="ui-enter absolute right-0 top-[calc(100%+0.5rem)] z-30 w-[min(36rem,calc(100vw-2rem))] space-y-2 rounded-2xl border border-black/10 bg-white p-4 shadow-xl dark:border-white/10 dark:bg-zinc-900">
          <div className="mb-2">
            <p className="text-sm font-semibold">Kategori yönetimi</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Marka gruplarını yeniden adlandır, sil veya yenisini ekle.
            </p>
          </div>
          <div className="space-y-0.5">
            {clusters.map((c) => (
              <ClusterRow key={c.id} cluster={c} onError={setError} />
            ))}
          </div>

          <form
            ref={newFormRef}
            action={async (fd) => {
              setError(null);
              try {
                await createClusterAction(fd);
                newFormRef.current?.reset();
              } catch (e) {
                setError(getActionErrorMessage(e));
              }
            }}
            className="flex items-center gap-2 border-t border-black/10 pt-3 dark:border-white/10"
          >
            <input
              name="label"
              required
              placeholder="Yeni kategori adı"
              aria-label="Yeni kategori adı"
              className={inputClass}
            />
            <SubmitButton>Ekle</SubmitButton>
          </form>

          {error && <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
        </div>
      )}
    </div>
  );
}
