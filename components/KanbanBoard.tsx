"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import Link from "next/link";
import { useState, useTransition } from "react";
import AssigneeSelect from "@/components/AssigneeSelect";
import PersonAvatar from "@/components/PersonAvatar";
import TaskPrioritySelect from "@/components/TaskPrioritySelect";
import TaskStatusSelect from "@/components/TaskStatusSelect";
import { setTaskStatusAction } from "@/lib/actions/tasks";
import {
  TASK_PRIORITY_BORDER,
  TASK_PRIORITY_FLAG_THRESHOLD,
  TASK_PRIORITY_ICON,
  TASK_STATUS_BORDER_TOP,
  TASK_STATUS_DOT,
  TASK_STATUS_LABEL,
  TASK_STATUSES,
} from "@/lib/constants";
import { formatDateShort, isOverdue } from "@/lib/date";
import type { Person, TaskStatus, TaskWithContext } from "@/lib/types";

function TaskCard({
  task,
  people,
  overlay = false,
}: {
  task: TaskWithContext;
  people: Person[];
  overlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  });

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      {...(overlay ? {} : listeners)}
      {...(overlay ? {} : attributes)}
      className={`touch-none space-y-2 rounded-lg border border-l-4 border-black/10 bg-white p-3 shadow-sm transition-shadow dark:border-white/10 dark:bg-zinc-900 ${TASK_PRIORITY_BORDER[task.priority]} ${overlay ? "cursor-grabbing shadow-lg" : "cursor-grab hover:shadow-md"} ${isDragging && !overlay ? "opacity-30" : ""}`}
    >
      <Link
        href={`/tasks/${task.id}`}
        className="block text-sm font-medium hover:text-indigo-600 dark:hover:text-indigo-400"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {TASK_PRIORITY_FLAG_THRESHOLD.includes(task.priority) && (
          <span className="mr-1">{TASK_PRIORITY_ICON[task.priority]}</span>
        )}
        {task.title}
      </Link>
      {task.due_date && (
        <div
          className={`text-xs ${isOverdue(task.due_date) ? "font-medium text-rose-600" : "text-zinc-500"}`}
        >
          📅 {formatDateShort(task.due_date)}
        </div>
      )}
      <div
        className="flex flex-wrap items-center gap-1.5"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {task.assignee_name && <PersonAvatar name={task.assignee_name} size="xs" />}
        <AssigneeSelect taskId={task.id} assigneeId={task.assignee_id} people={people} />
        <TaskStatusSelect taskId={task.id} status={task.status} />
        <TaskPrioritySelect taskId={task.id} priority={task.priority} />
      </div>
    </div>
  );
}

function Column({
  status,
  tasks,
  people,
}: {
  status: TaskStatus;
  tasks: TaskWithContext[];
  people: Person[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`space-y-2 rounded-xl border-t-2 bg-slate-50/60 p-2 transition-colors dark:bg-white/[0.02] ${TASK_STATUS_BORDER_TOP[status]} ${isOver ? "bg-indigo-50/60 dark:bg-indigo-950/20" : ""}`}
    >
      <div className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        <span className={`h-2 w-2 rounded-full ${TASK_STATUS_DOT[status]}`} />
        {TASK_STATUS_LABEL[status]}
        <span className="text-zinc-300 dark:text-zinc-600">{tasks.length}</span>
      </div>
      <div className="min-h-16 space-y-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} people={people} />
        ))}
        {tasks.length === 0 && (
          <div className="rounded-lg border border-dashed border-black/10 py-3 text-center text-xs text-zinc-300 dark:border-white/10 dark:text-zinc-600">
            —
          </div>
        )}
      </div>
    </div>
  );
}

export default function KanbanBoard({
  tasks: initialTasks,
  people,
}: {
  tasks: TaskWithContext[];
  people: Person[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [prevInitialTasks, setPrevInitialTasks] = useState(initialTasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Sunucudan yeni `tasks` geldiğinde (AutoRefresh, başka bir action) yerel
  // state'i senkronize et — bunu useEffect yerine render sırasında yapmak
  // (React'in "adjusting state when a prop changes" deseni) ekstra bir
  // render turu yaratmıyor.
  if (initialTasks !== prevInitialTasks) {
    setPrevInitialTasks(initialTasks);
    setTasks(initialTasks);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const newStatus = over.id as TaskStatus;
    const taskId = active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    );
    startTransition(() => setTaskStatusAction(taskId, newStatus));
  }

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  return (
    <DndContext
      id="content-kanban"
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-4 lg:grid-cols-5">
        {TASK_STATUSES.map((status) => (
          <Column
            key={status}
            status={status}
            tasks={tasks.filter((t) => t.status === status)}
            people={people}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} people={people} overlay />}
      </DragOverlay>
    </DndContext>
  );
}
