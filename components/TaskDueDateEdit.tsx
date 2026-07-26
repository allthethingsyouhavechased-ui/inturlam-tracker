"use client";

import { useState, useTransition } from "react";
import { setTaskDueDateAction } from "@/lib/actions/tasks";
import { formatDateShort, isOverdue } from "@/lib/date";

export default function TaskDueDateEdit({
  taskId,
  dueDate,
}: {
  taskId: string;
  dueDate: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  if (editing) {
    return (
      <input
        type="date"
        autoFocus
        defaultValue={dueDate ?? ""}
        disabled={pending}
        onBlur={() => setEditing(false)}
        onChange={(e) => {
          const next = e.target.value || null;
          startTransition(() => setTaskDueDateAction(taskId, next));
          setEditing(false);
        }}
        className="rounded-md border border-black/10 bg-white px-1.5 py-0.5 text-xs outline-none focus:border-brand-500 disabled:opacity-50 dark:border-white/15 dark:bg-zinc-900"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      disabled={pending}
      title="Teslim tarihini değiştir"
      className={`tabular-nums text-xs underline decoration-dotted underline-offset-2 hover:decoration-solid disabled:opacity-50 ${
        dueDate && isOverdue(dueDate)
          ? "font-medium text-rose-600 dark:text-rose-400"
          : "text-zinc-500 dark:text-zinc-400"
      }`}
    >
      {dueDate ? formatDateShort(dueDate) : "—"}
    </button>
  );
}
