"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { setPersonalTaskTargetAction } from "@/lib/actions/tasks";
import { formatDateShort } from "@/lib/date";
import { getActionErrorMessage } from "@/lib/errorMessage";

export interface PersonalTargetOption {
  id: string;
  title: string;
  dueDate: string | null;
  targetDate: string | null;
}

export default function PersonalTargetPlanner({
  personId,
  tasks,
  today,
}: {
  personId: string;
  tasks: PersonalTargetOption[];
  today: string;
}) {
  const [open, setOpen] = useState(false);
  const [taskId, setTaskId] = useState(tasks[0]?.id ?? "");
  const initialTask = tasks.find((task) => task.id === taskId);
  const [targetDate, setTargetDate] = useState(initialTask?.targetDate ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selectedTask = tasks.find((task) => task.id === taskId);

  function changeTask(nextTaskId: string) {
    const nextTask = tasks.find((task) => task.id === nextTaskId);
    setTaskId(nextTaskId);
    setTargetDate(nextTask?.targetDate ?? "");
    setError(null);
  }

  function save(nextTarget: string | null) {
    if (!taskId) return;
    setError(null);
    startTransition(async () => {
      try {
        await setPersonalTaskTargetAction(taskId, nextTarget);
        if (nextTarget === null) setTargetDate("");
        setOpen(false);
      } catch (cause) {
        setError(getActionErrorMessage(cause));
      }
    });
  }

  return (
    <div className="border-b border-black/[0.07] px-2 py-2 dark:border-white/[0.08]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Öncelik sırası
        </p>
        <div className="flex items-center gap-3">
          {tasks.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setOpen((value) => !value);
                setError(null);
              }}
              aria-expanded={open}
              className="inline-flex min-h-9 items-center rounded-lg px-2 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950/40"
            >
              {open ? "Vazgeç" : "+ Kişisel hedef belirle"}
            </button>
          )}
          <Link
            href={`/tasks?assignee=${encodeURIComponent(personId)}`}
            className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            Tüm görevlerim →
          </Link>
        </div>
      </div>

      {open && (
        <div className="mt-2 rounded-xl bg-zinc-50 p-3 dark:bg-white/[0.035]">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(9rem,0.45fr)_auto] sm:items-end">
            <label className="min-w-0 text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Görev
              <select
                value={taskId}
                onChange={(event) => changeTask(event.target.value)}
                disabled={pending}
                className="mt-1 block min-h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 disabled:opacity-50 dark:border-white/15 dark:bg-zinc-900"
              >
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Bitirmeyi hedeflediğim tarih
              <input
                type="date"
                min={today}
                value={targetDate}
                onChange={(event) => setTargetDate(event.target.value)}
                disabled={pending}
                className="mt-1 block min-h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 disabled:opacity-50 dark:border-white/15 dark:bg-zinc-900"
              />
            </label>

            <button
              type="button"
              onClick={() => save(targetDate || null)}
              disabled={pending || !taskId || !targetDate}
              className="min-h-11 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Kaydediliyor…" : "Hedefi kaydet"}
            </button>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {selectedTask?.dueDate
                ? `Resmi teslim: ${formatDateShort(selectedTask.dueDate)}. Kişisel hedef resmi tarihi değiştirmez.`
                : "Bu görevin resmi teslim tarihi yok; kişisel hedef yine de belirlenebilir."}
            </p>
            {selectedTask?.targetDate && (
              <button
                type="button"
                onClick={() => save(null)}
                disabled={pending}
                className="min-h-9 rounded-lg px-2 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
              >
                Hedefi kaldır
              </button>
            )}
          </div>

          {error && (
            <p role="alert" className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-400">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
