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
import { useState, useTransition } from "react";
import TaskGridCard from "@/components/TaskGridCard";
import { setTaskStatusAction } from "@/lib/actions/tasks";
import {
  TASK_PRIORITY_LABEL,
  TASK_STATUS_BORDER_TOP,
  TASK_STATUS_DOT,
  TASK_STATUS_LABEL,
  TASK_STATUSES,
} from "@/lib/constants";
import type { TaskStatus, TaskWithContext } from "@/lib/types";

export type SortKey = "varsayilan" | "marka" | "durum" | "oncelik" | "atanan";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "varsayilan", label: "Varsayılan" },
  { key: "marka", label: "Marka" },
  { key: "oncelik", label: "Öncelik" },
  { key: "atanan", label: "Atanan" },
];

const collator = new Intl.Collator("tr");

// Hangi sıralama düğmesine tıklanırsa, kartlar o alanın değerine göre
// alfabetik sıralanır — durum sütunlarının kendisi hep sabit kalır, sadece
// bir sütunun İÇİNDEKİ kart sırası değişir.
function sortTasks(tasks: TaskWithContext[], key: SortKey): TaskWithContext[] {
  // "durum"a göre sıralamanın bir sütun içinde görünür etkisi yok (o sütundaki
  // her kart zaten aynı duruma sahip) — yine de tip bütünlüğü için ele alınıyor.
  if (key === "varsayilan" || key === "durum") return tasks;
  const valueOf = (t: TaskWithContext): string => {
    if (key === "marka") return t.brand_name;
    if (key === "oncelik") return TASK_PRIORITY_LABEL[t.priority];
    return t.assignee_name ?? "￿"; // atanmamışlar en sona
  };
  return [...tasks].sort((a, b) => collator.compare(valueOf(a), valueOf(b)));
}

function DraggableCard({ task }: { task: TaskWithContext }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`touch-none cursor-grab ${isDragging ? "opacity-30" : ""}`}
      onPointerDownCapture={(e) => {
        // Başlık linkine tıklamak sürüklemeyi tetiklemesin.
        if ((e.target as HTMLElement).closest("a")) e.stopPropagation();
      }}
    >
      <TaskGridCard task={task} showStatus={false} badges={task.badges} />
    </div>
  );
}

function Column({
  status,
  tasks,
}: {
  status: TaskStatus;
  tasks: TaskWithContext[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={`space-y-2 rounded-xl border-t-2 bg-slate-50/60 p-2 transition-colors dark:bg-white/[0.02] ${TASK_STATUS_BORDER_TOP[status]} ${isOver ? "bg-brand-50/60 dark:bg-brand-950/20" : ""}`}
    >
      <div className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        <span className={`h-2 w-2 rounded-full ${TASK_STATUS_DOT[status]}`} />
        {TASK_STATUS_LABEL[status]}
        <span className="text-zinc-500 dark:text-zinc-400">{tasks.length}</span>
      </div>
      <div className="min-h-16 space-y-2">
        {tasks.map((t) => (
          <DraggableCard key={t.id} task={t} />
        ))}
        {tasks.length === 0 && (
          <div className="rounded-lg border border-dashed border-black/10 py-3 text-center text-xs text-zinc-500 dark:border-white/10 dark:text-zinc-400">
            —
          </div>
        )}
      </div>
    </div>
  );
}

// 5 durum sütunlu, sürükle-bırak destekli, sıralanabilir görev board'u.
// Görevler sayfası ve Panom'un her bölümü bu component'i paylaşır.
//
// `sortKey` dışarıdan verilirse (Görevler'de filtre kutularının kendisi bu
// görevi görür) board kendi "Sırala:" düğmelerini göstermez — kontrol tamamen
// dışarıdadır. Verilmezse (Panom'da olduğu gibi, filtre kutuları yok) board
// kendi dahili düğmelerini gösterir.
//
// `boardId`: dnd-kit DndContext, erişilebilirlik açıklaması için otomatik
// artan bir sayaçla id üretir; bir sayfada (Panom'da olduğu gibi) birden
// fazla DndContext varsa sunucu ile istemcinin ulaştığı sayı farklı olabilir
// ve React hydration uyarısı verir. dnd-kit'in kendi önerisi: her instance'a
// sabit, benzersiz bir `id` vermek (bkz. dnd-kit SSR dokümantasyonu).
export default function TaskBoard({
  tasks,
  sortKey: externalSortKey,
  boardId,
}: {
  tasks: TaskWithContext[];
  sortKey?: SortKey;
  boardId: string;
}) {
  const [taskList, setTaskList] = useState(tasks);
  const [prevTasks, setPrevTasks] = useState(tasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [internalSortKey, setInternalSortKey] = useState<SortKey>("varsayilan");
  const [, startTransition] = useTransition();

  const isControlled = externalSortKey !== undefined;
  const sortKey = isControlled ? externalSortKey : internalSortKey;

  if (tasks !== prevTasks) {
    setPrevTasks(tasks);
    setTaskList(tasks);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const newStatus = over.id as TaskStatus;
    const taskId = active.id as string;
    const task = taskList.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    setTaskList((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    );
    startTransition(() => setTaskStatusAction(taskId, newStatus));
  }

  const activeTask = activeId ? taskList.find((t) => t.id === activeId) : null;

  return (
    <div className="space-y-2">
      {!isControlled && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-zinc-500 dark:text-zinc-400">Sırala:</span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setInternalSortKey(opt.key)}
              className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
                sortKey === opt.key
                  ? "bg-brand-600 text-white"
                  : "bg-black/5 text-zinc-600 hover:bg-black/10 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/20"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
      <DndContext
        id={boardId}
        sensors={sensors}
        onDragStart={(e: DragStartEvent) => setActiveId(e.active.id as string)}
        onDragEnd={handleDragEnd}
      >
        <div className="grid gap-3 lg:grid-cols-5">
          {TASK_STATUSES.map((s) => (
            <Column
              key={s}
              status={s}
              tasks={sortTasks(
                taskList.filter((t) => t.status === s),
                sortKey,
              )}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask && (
            <div className="shadow-lg">
              <TaskGridCard task={activeTask} showStatus={false} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
