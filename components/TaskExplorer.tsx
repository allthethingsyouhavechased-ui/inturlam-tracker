"use client";

import { useMemo, useState } from "react";
import TaskBoard, { type SortKey } from "@/components/TaskBoard";
import TaskListView from "@/components/TaskListView";
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABEL,
  TASK_STATUS_LABEL,
  TASK_STATUSES,
} from "@/lib/constants";
import type { Person, TaskWithContext } from "@/lib/types";

const UNASSIGNED = "__unassigned__";

const SORT_LABEL: Record<SortKey, string> = {
  varsayilan: "Varsayılan",
  marka: "Marka",
  durum: "Durum",
  oncelik: "Öncelik",
  atanan: "Atanan",
};

const selectClass =
  "min-h-11 rounded-xl border border-black/5 bg-white px-3 py-2 text-sm shadow-sm outline-none transition-[border-color,box-shadow] focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 dark:border-white/10 dark:bg-zinc-900";

export default function TaskExplorer({
  tasks,
  brands,
  people,
}: {
  tasks: TaskWithContext[];
  brands: { id: string; name: string }[];
  people: Person[];
}) {
  const [brandId, setBrandId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priority, setPriority] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("varsayilan");
  const [view, setView] = useState<"pano" | "liste">("pano");

  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase("tr-TR");
    return tasks.filter((t) => {
      if (brandId && t.brand_id !== brandId) return false;
      if (statusFilter && t.status !== statusFilter) return false;
      if (priority && t.priority !== priority) return false;
      if (assigneeId === UNASSIGNED && t.assignee_id) return false;
      if (assigneeId && assigneeId !== UNASSIGNED && t.assignee_id !== assigneeId) return false;
      if (needle && !t.title.toLocaleLowerCase("tr-TR").includes(needle)) return false;
      return true;
    });
  }, [tasks, brandId, statusFilter, priority, assigneeId, q]);

  const hasFilter = Boolean(brandId || statusFilter || priority || assigneeId || q);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-black/5 bg-zinc-50/70 p-3 dark:border-white/5 dark:bg-white/[0.025] sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full sm:min-w-60 sm:flex-[2]">
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
              aria-hidden="true"
            >
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
            </svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Görev ara"
              placeholder="Görev başlığında ara…"
              className={`${selectClass} w-full pl-10`}
            />
          </div>
        <select
          aria-label="Marka"
          value={brandId}
          onChange={(e) => {
            setBrandId(e.target.value);
            setSortKey("marka");
          }}
          className={`${selectClass} w-full sm:min-w-36 sm:flex-1`}
        >
          <option value="">Tüm markalar</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Durum"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setSortKey("durum");
          }}
          className={`${selectClass} w-full sm:min-w-36 sm:flex-1`}
        >
          <option value="">Tüm durumlar</option>
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {TASK_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select
          aria-label="Öncelik"
          value={priority}
          onChange={(e) => {
            setPriority(e.target.value);
            setSortKey("oncelik");
          }}
          className={`${selectClass} w-full sm:min-w-36 sm:flex-1`}
        >
          <option value="">Tüm öncelikler</option>
          {TASK_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {TASK_PRIORITY_LABEL[p]}
            </option>
          ))}
        </select>
        <select
          aria-label="Atanan"
          value={assigneeId}
          onChange={(e) => {
            setAssigneeId(e.target.value);
            setSortKey("atanan");
          }}
          className={`${selectClass} w-full sm:min-w-36 sm:flex-1`}
        >
          <option value="">Herkes</option>
          <option value={UNASSIGNED}>Atanmamış</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {hasFilter && (
          <button
            type="button"
            onClick={() => {
              setBrandId("");
              setStatusFilter("");
              setPriority("");
              setAssigneeId("");
              setQ("");
              setSortKey("varsayilan");
            }}
            className="min-h-11 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wide text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-500/10"
          >
            Sıfırla
          </button>
        )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {filtered.length} / {tasks.length} görev
          {view === "pano" && sortKey !== "varsayilan" && (
            <span className="text-zinc-500 dark:text-zinc-400"> · sıralama: {SORT_LABEL[sortKey]}</span>
          )}
          {view === "liste" && (
            <span className="text-zinc-500 dark:text-zinc-400">
              {" "}
              · sütun başlığına tıklayıp sırala, satırları seçip toplu işlem yap
            </span>
          )}
        </p>
        <div className="inline-flex overflow-hidden rounded-xl border border-black/10 bg-white p-0.5 text-xs shadow-sm dark:border-white/15 dark:bg-zinc-900">
          {(["pano", "liste"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={`min-h-9 rounded-lg px-3 py-1 font-medium transition-colors ${
                view === v
                  ? "bg-brand-600 text-white"
                  : "text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
              }`}
            >
              {v === "pano" ? "Pano" : "Liste"}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Bu filtrelerle eşleşen görev yok.</p>
      ) : view === "pano" ? (
        <TaskBoard tasks={filtered} sortKey={sortKey} boardId="gorevler" />
      ) : (
        <TaskListView tasks={filtered} people={people} />
      )}
    </div>
  );
}
