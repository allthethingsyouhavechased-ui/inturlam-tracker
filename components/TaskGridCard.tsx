import Link from "next/link";
import CommentIcon from "@/components/CommentIcon";
import PersonAvatar from "@/components/PersonAvatar";
import TaskStatusSelect from "@/components/TaskStatusSelect";
import { hashColor } from "@/lib/colorHash";
import {
  TASK_PRIORITY_BADGE,
  TASK_PRIORITY_BORDER,
  TASK_PRIORITY_ICON,
  TASK_PRIORITY_LABEL,
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
      className={`flex min-w-0 flex-col gap-2.5 rounded-xl border-2 bg-white p-3 shadow-sm transition-[box-shadow,transform] duration-200 hover:shadow-md dark:bg-zinc-900 ${TASK_PRIORITY_BORDER[task.priority]}`}
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
        className="text-sm font-semibold leading-snug text-zinc-900 hover:text-brand-600 dark:text-zinc-100 dark:hover:text-brand-400"
      >
        {task.title}
      </Link>

      <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {task.brand_name}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-black/[0.06] pt-2 dark:border-white/[0.08]">
        {task.due_date ? (
          <span
            className={`text-xs ${isOverdue(task.due_date) ? "font-medium text-rose-600 dark:text-rose-400" : "text-zinc-500 dark:text-zinc-400"}`}
          >
            📅 {formatDateShort(task.due_date)}
          </span>
        ) : (
          <span className="text-xs text-zinc-400 dark:text-zinc-500">Tarih yok</span>
        )}
        <span className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${TASK_PRIORITY_BADGE[task.priority]}`}
          >
            <span aria-hidden="true">{TASK_PRIORITY_ICON[task.priority]}</span>
            {TASK_PRIORITY_LABEL[task.priority]}
          </span>
          {task.assignee_name && (
            <PersonAvatar
              name={task.assignee_name}
              avatarPath={task.assignee_avatar_path}
              size="xs"
            />
          )}
        </span>
      </div>

      {/* Son yorum. Kartı açmadan "burada bir konuşma dönüyor mu, ne konuşuldu"
          sorusuna cevap verir; tamamı görev detayında. Yorum yoksa hiç yer
          kaplamaz — kartların yüksekliği gereksiz yere şişmesin. */}
      {task.comment_count > 0 && (
        <Link
          href={`/tasks/${task.id}`}
          className="-mx-1 -mb-1 block rounded-md border-t border-black/10 px-1 pt-2 transition-colors hover:bg-black/[0.03] dark:border-white/10 dark:hover:bg-white/5"
        >
          <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            <CommentIcon />
            {task.comment_count}
            {task.last_comment_author && (
              <span className="truncate font-normal">· {task.last_comment_author}</span>
            )}
          </span>
          {task.last_comment_body && (
            <span className="mt-0.5 line-clamp-2 block text-xs text-zinc-600 dark:text-zinc-300">
              {task.last_comment_body}
            </span>
          )}
        </Link>
      )}
    </div>
  );
}
