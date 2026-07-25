import Link from "next/link";
import PersonAvatar from "@/components/PersonAvatar";
import TaskStatusSelect from "@/components/TaskStatusSelect";
import { hashColor } from "@/lib/colorHash";
import {
  TASK_PRIORITY_BORDER,
  TASK_PRIORITY_FLAG_THRESHOLD,
  TASK_PRIORITY_ICON,
} from "@/lib/constants";
import { formatDateShort, isOverdue } from "@/lib/date";
import type { TaskCardBadge, TaskWithContext } from "@/lib/types";

export type { TaskCardBadge };

// Jira'daki "epic" etiketi gibi — görevin bağlı olduğu içerik/projenin adı,
// içeriğe göre sabit renkte küçük bir rozet olarak gösterilir.
export default function TaskGridCard({
  task,
  showStatus = true,
  badges,
}: {
  task: TaskWithContext;
  // Durum sütunlarına göre gruplanmış görünümlerde (Görevler board'u) durum
  // zaten kolon başlığından belli olduğu için seçici tekrar gösterilmez —
  // dar kolonlarda seçiciyle yer çakışıp etiketin "D.." diye kısalmasını önler.
  showStatus?: boolean;
  // Panom'un birleşik board'unda bir kartın "neden burada" olduğunu gösteren
  // küçük rozetler (Benim/Gecikmiş/Bu hafta gibi) — başka bağlamlarda kullanılmaz.
  badges?: TaskCardBadge[];
}) {
  // `min-w-0`: kart bir grid hücresinde duruyor ve grid çocuklarının varsayılan
  // `min-width: auto` değeri, içindeki <select>'in en uzun seçeneği
  // ("Devam Ediyor") kadar genişlemesine yol açıyor — telefonda sayfa yatay
  // kayıyordu.
  return (
    <div
      className={`flex min-w-0 flex-col gap-2 rounded-lg border border-l-4 border-black/10 bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:border-white/10 dark:bg-zinc-900 ${TASK_PRIORITY_BORDER[task.priority]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`inline-block min-w-0 flex-1 truncate rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${hashColor(task.content_title)}`}
          title={task.content_title}
        >
          {task.content_title}
        </span>
        {showStatus && <TaskStatusSelect taskId={task.id} status={task.status} />}
      </div>

      {badges && badges.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {badges.map((b) => (
            <span
              key={b.label}
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${b.className}`}
            >
              {b.label}
            </span>
          ))}
        </div>
      )}

      <Link
        href={`/tasks/${task.id}`}
        className="text-sm font-medium leading-snug hover:text-brand-600 dark:hover:text-brand-400 dark:hover:text-brand-400"
      >
        {TASK_PRIORITY_FLAG_THRESHOLD.includes(task.priority) && (
          <span className="mr-1">{TASK_PRIORITY_ICON[task.priority]}</span>
        )}
        {task.title}
      </Link>

      <div className="text-xs text-zinc-500 dark:text-zinc-400">{task.brand_name}</div>

      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        {task.due_date ? (
          <span
            className={`text-xs ${isOverdue(task.due_date) ? "font-medium text-rose-600 dark:text-rose-400" : "text-zinc-500 dark:text-zinc-400"}`}
          >
            📅 {formatDateShort(task.due_date)}
          </span>
        ) : (
          <span />
        )}
        {task.assignee_name && <PersonAvatar name={task.assignee_name} size="xs" />}
      </div>
    </div>
  );
}
