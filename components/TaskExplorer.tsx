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
  "rounded-md border border-black/10 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand-500 dark:border-white/15 dark:bg-zinc-900";

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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Görev ara…"
          className={`${selectClass} w-full sm:w-48`}
        />
        <select
          aria-label="Marka"
          value={brandId}
          onChange={(e) => {
            setBrandId(e.target.value);
            setSortKey("marka");
          }}
          className={selectClass}
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
          className={selectClass}
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
          className={selectClass}
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
          className={selectClass}
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
            className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            Filtreleri temizle
          </button>
        )}
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
        <div className="inline-flex overflow-hidden rounded-md border border-black/10 text-xs dark:border-white/15">
          {(["pano", "liste"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`px-3 py-1 font-medium transition-colors ${
                view === v
                  ? "bg-brand-600 text-white"
                  : "bg-white text-zinc-600 hover:bg-black/5 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-white/10"
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
