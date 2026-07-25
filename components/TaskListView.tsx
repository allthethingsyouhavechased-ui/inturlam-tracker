"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import PersonAvatar from "@/components/PersonAvatar";
import {
  bulkDeleteTasksAction,
  bulkSetTaskAssigneeAction,
  bulkSetTaskPriorityAction,
  bulkSetTaskStatusAction,
} from "@/lib/actions/tasks";
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_BADGE,
  TASK_PRIORITY_FLAG_THRESHOLD,
  TASK_PRIORITY_ICON,
  TASK_PRIORITY_LABEL,
  TASK_STATUS_BADGE,
  TASK_STATUS_LABEL,
  TASK_STATUSES,
} from "@/lib/constants";
import { formatDateShort, isOverdue } from "@/lib/date";
import { getActionErrorMessage } from "@/lib/errorMessage";
import type { Person, TaskPriority, TaskStatus, TaskWithContext } from "@/lib/types";

const UNASSIGN = "__none__";

const barSelectClass =
  "rounded-md border border-black/10 bg-white px-2 py-1 text-xs outline-none focus:border-indigo-500 disabled:opacity-50 dark:border-white/15 dark:bg-zinc-900";

export default function TaskListView({
  tasks,
  people,
}: {
  tasks: TaskWithContext[];
  people: Person[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [prevTasks, setPrevTasks] = useState(tasks);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // tasks prop değişince (filtre değişimi ya da AutoRefresh) seçimi hâlâ var
  // olan görevlere buda — silinmiş/filtrelenmiş id'ler seçili kalmasın.
  if (tasks !== prevTasks) {
    setPrevTasks(tasks);
    const present = new Set(tasks.map((t) => t.id));
    setSelected((prev) => {
      const next = new Set([...prev].filter((id) => present.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }

  const allSelected = tasks.length > 0 && selected.size === tasks.length;
  const someSelected = selected.size > 0;
  const ids = useMemo(() => [...selected], [selected]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(tasks.map((t) => t.id)));
  }

  function run(fn: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
        setSelected(new Set());
      } catch (e) {
        setError(getActionErrorMessage(e));
      }
    });
  }

  return (
    <div className="space-y-3">
      {someSelected && (
        <div className="sticky top-[57px] z-10 flex flex-wrap items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/90 p-2 text-sm shadow-sm backdrop-blur dark:border-indigo-900/60 dark:bg-indigo-950/70">
          <span className="px-1 font-medium text-indigo-700 dark:text-indigo-300">
            {selected.size} seçili
          </span>

          <select
            aria-label="Toplu durum"
            disabled={pending}
            value=""
            onChange={(e) => {
              const v = e.target.value as TaskStatus;
              e.currentTarget.value = "";
              if (v) run(() => bulkSetTaskStatusAction(ids, v));
            }}
            className={barSelectClass}
          >
            <option value="" disabled>
              Durum değiştir…
            </option>
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {TASK_STATUS_LABEL[s]}
              </option>
            ))}
          </select>

          <select
            aria-label="Toplu öncelik"
            disabled={pending}
            value=""
            onChange={(e) => {
              const v = e.target.value as TaskPriority;
              e.currentTarget.value = "";
              if (v) run(() => bulkSetTaskPriorityAction(ids, v));
            }}
            className={barSelectClass}
          >
            <option value="" disabled>
              Öncelik değiştir…
            </option>
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {TASK_PRIORITY_LABEL[p]}
              </option>
            ))}
          </select>

          <select
            aria-label="Toplu atama"
            disabled={pending}
            value=""
            onChange={(e) => {
              const v = e.target.value;
              e.currentTarget.value = "";
              if (v) run(() => bulkSetTaskAssigneeAction(ids, v === UNASSIGN ? null : v));
            }}
            className={barSelectClass}
          >
            <option value="" disabled>
              Ata…
            </option>
            <option value={UNASSIGN}>— Atamayı kaldır —</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (
                confirm(
                  `${selected.size} görev kalıcı olarak silinsin mi? Bu işlem geri alınamaz.`,
                )
              ) {
                run(() => bulkDeleteTasksAction(ids));
              }
            }}
            className="rounded-md px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-100 disabled:opacity-50 dark:hover:bg-rose-950/40"
          >
            Sil
          </button>

          {pending && <span className="text-xs text-indigo-500">İşleniyor…</span>}

          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            Seçimi temizle
          </button>
        </div>
      )}

      {error && <p className="text-xs text-rose-600">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-xs uppercase tracking-wider text-zinc-400 dark:border-white/10">
              <th className="w-10 px-3 py-2">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Tümünü seç"
                  className="cursor-pointer accent-indigo-600"
                />
              </th>
              <th className="px-3 py-2 font-medium">Görev</th>
              <th className="px-3 py-2 font-medium">Marka</th>
              <th className="px-3 py-2 font-medium">Öncelik</th>
              <th className="px-3 py-2 font-medium">Durum</th>
              <th className="px-3 py-2 font-medium">Atanan</th>
              <th className="px-3 py-2 font-medium">Teslim</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => {
              const isSel = selected.has(t.id);
              return (
                <tr
                  key={t.id}
                  className={`border-b border-black/5 last:border-0 dark:border-white/5 ${
                    isSel ? "bg-indigo-50/60 dark:bg-indigo-950/20" : ""
                  }`}
                >
                  <td className="px-3 py-2 align-top">
                    <input
                      type="checkbox"
                      checked={isSel}
                      onChange={() => toggle(t.id)}
                      aria-label={`${t.title} seç`}
                      className="mt-0.5 cursor-pointer accent-indigo-600"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/tasks/${t.id}`}
                      className="font-medium hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      {TASK_PRIORITY_FLAG_THRESHOLD.includes(t.priority) && (
                        <span className="mr-1">{TASK_PRIORITY_ICON[t.priority]}</span>
                      )}
                      {t.title}
                    </Link>
                    <div className="text-xs text-zinc-400">{t.content_title}</div>
                  </td>
                  <td className="px-3 py-2 text-zinc-500">{t.brand_name}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${TASK_PRIORITY_BADGE[t.priority]}`}
                    >
                      {TASK_PRIORITY_LABEL[t.priority]}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${TASK_STATUS_BADGE[t.status]}`}
                    >
                      {TASK_STATUS_LABEL[t.status]}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {t.assignee_name ? (
                      <span className="flex items-center gap-1.5">
                        <PersonAvatar name={t.assignee_name} size="xs" />
                        <span className="text-zinc-600 dark:text-zinc-300">
                          {t.assignee_name}
                        </span>
                      </span>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {t.due_date ? (
                      <span
                        className={`tabular-nums text-xs ${
                          isOverdue(t.due_date)
                            ? "font-medium text-rose-600"
                            : "text-zinc-500"
                        }`}
                      >
                        {formatDateShort(t.due_date)}
                      </span>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
