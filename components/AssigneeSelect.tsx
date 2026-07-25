"use client";

import { useTransition } from "react";
import { setTaskAssigneeAction } from "@/lib/actions/tasks";
import type { Person } from "@/lib/types";

const base =
  "cursor-pointer rounded-md border border-black/10 bg-white px-2 py-1 text-xs outline-none focus:border-brand-500 dark:border-white/15 dark:bg-zinc-900";

export default function AssigneeSelect({
  taskId,
  assigneeId,
  people,
}: {
  taskId: string;
  assigneeId: string | null;
  people: Person[];
}) {
  const [pending, startTransition] = useTransition();
  return (
    <select
      aria-label="Atanan"
      value={assigneeId ?? ""}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value || null;
        startTransition(() => setTaskAssigneeAction(taskId, next));
      }}
      className={`${base} ${pending ? "opacity-50" : ""}`}
    >
      <option value="">— kimse —</option>
      {people.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}
