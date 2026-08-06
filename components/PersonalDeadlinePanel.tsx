import Link from "next/link";
import PersonalTargetPlanner from "@/components/PersonalTargetPlanner";
import { TASK_PRIORITY_ICON, TASK_PRIORITY_LABEL } from "@/lib/constants";
import { formatDateShort, shiftISODate } from "@/lib/date";
import type { TaskWithPersonalTarget } from "@/lib/types";

const PREVIEW_LIMIT = 5;

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "danger" | "warning" | "neutral";
}) {
  const toneClass = {
    danger: "text-rose-700 dark:text-rose-300",
    warning: "text-amber-700 dark:text-amber-300",
    neutral: "text-zinc-700 dark:text-zinc-200",
  }[tone];

  return (
    <div className="min-w-20">
      <div className={`text-2xl font-semibold tabular-nums tracking-tight ${toneClass}`}>
        {value}
      </div>
      <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </div>
    </div>
  );
}

function attentionDate(task: TaskWithPersonalTarget): string | null {
  const dates = [task.due_date, task.personal_target_date].filter(
    (date): date is string => date !== null,
  );
  dates.sort();
  return dates[0] ?? null;
}

function timingLabel(task: TaskWithPersonalTarget, today: string): string {
  const date = attentionDate(task);
  if (!date) return "Tarih yok";
  const isPersonal = date === task.personal_target_date;
  const prefix = isPersonal ? "Hedef" : "Teslim";
  if (date < today) return `${prefix} gecikti`;
  if (date === today) return `${prefix} bugün`;
  return `${prefix} ${formatDateShort(date)}`;
}

export default function PersonalDeadlinePanel({
  personId,
  tasks,
  today,
  horizonDays,
}: {
  personId: string;
  tasks: TaskWithPersonalTarget[];
  today: string;
  horizonDays: number;
}) {
  const horizonEnd = shiftISODate(today, horizonDays);
  const scheduled = tasks
    .map((task) => ({ task, date: attentionDate(task) }))
    .filter((item): item is { task: TaskWithPersonalTarget; date: string } => item.date !== null)
    .sort((a, b) => a.date.localeCompare(b.date) || a.task.title.localeCompare(b.task.title, "tr"));
  const overdueTasks = scheduled.filter(({ date }) => date < today);
  const dueToday = scheduled.filter(({ date }) => date === today);
  const dueSoon = scheduled.filter(({ date }) => date > today && date <= horizonEnd);
  const personalTargetCount = tasks.filter((task) => task.personal_target_date !== null).length;
  const priorityTasks = scheduled
    .filter(({ task, date }) => task.personal_target_date !== null || date <= horizonEnd)
    .map(({ task }) => task);
  const hasImmediateRisk = overdueTasks.length > 0 || dueToday.length > 0;

  const summary = overdueTasks.length > 0
    ? `${overdueTasks.length} işte resmi teslim veya kişisel hedef geçmiş.`
    : dueToday.length > 0
      ? `Bugün ${dueToday.length} iş için hedef ya da teslim var.`
      : dueSoon.length > 0
        ? `Sıradaki kritik tarih ${formatDateShort(attentionDate(dueSoon[0].task))}.`
        : personalTargetCount > 0
          ? `${personalTargetCount} kişisel hedefin planlandı.`
          : `Önümüzdeki ${horizonDays} gün için zaman baskısı görünmüyor.`;

  const plannerTasks = tasks.map((task) => ({
    id: task.id,
    title: `${task.brand_name} · ${task.title}`,
    dueDate: task.due_date,
    targetDate: task.personal_target_date,
  }));

  return (
    <section
      aria-labelledby="personal-deadline-title"
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-zinc-900 ${
        overdueTasks.length > 0
          ? "border-rose-200 dark:border-rose-900/70"
          : hasImmediateRisk
            ? "border-amber-200 dark:border-amber-900/70"
            : "border-black/10 dark:border-white/10"
      }`}
    >
      <div className="grid min-w-0 lg:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.7fr)]">
        <div
          className={`p-4 sm:p-5 ${
            overdueTasks.length > 0
              ? "bg-rose-50/80 dark:bg-rose-950/20"
              : hasImmediateRisk
                ? "bg-amber-50/80 dark:bg-amber-950/20"
                : "bg-zinc-50/80 dark:bg-white/[0.025]"
          }`}
        >
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={`mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full ${
                overdueTasks.length > 0
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                  : hasImmediateRisk
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
              }`}
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24" fill="none" className="size-5">
                <path
                  d="M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div className="min-w-0">
              <h2 id="personal-deadline-title" className="font-semibold text-zinc-900 dark:text-zinc-100">
                Kişisel teslim radarı
              </h2>
              <p className="mt-1 text-sm leading-5 text-zinc-600 dark:text-zinc-300">
                {summary}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
            <Metric label="Geciken" value={overdueTasks.length} tone="danger" />
            <Metric label="Bugün" value={dueToday.length} tone="warning" />
            <Metric label={`Sonraki ${horizonDays} gün`} value={dueSoon.length} tone="neutral" />
          </div>
          <p className="mt-4 text-[11px] leading-4 text-zinc-500 dark:text-zinc-400">
            Kişisel hedef yalnızca sana görünür; resmi teslim tarihini değiştirmez veya gizlemez.
          </p>
        </div>

        <div className="min-w-0 border-t border-black/[0.07] p-2 sm:p-3 lg:border-l lg:border-t-0 dark:border-white/[0.08]">
          <PersonalTargetPlanner personId={personId} tasks={plannerTasks} today={today} />

          {priorityTasks.length === 0 ? (
            <div className="flex min-h-24 items-center px-2 py-4 text-sm text-zinc-500 dark:text-zinc-400">
              Yakın teslim görünmüyor. Yukarıdan herhangi bir görev için kişisel hedef belirleyebilirsin.
            </div>
          ) : (
            <ul className="divide-y divide-black/[0.06] dark:divide-white/[0.07]">
              {priorityTasks.slice(0, PREVIEW_LIMIT).map((task) => {
                const date = attentionDate(task);
                const overdue = date !== null && date < today;
                const todayTask = date === today;
                return (
                  <li key={task.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-2 py-2">
                    <span
                      className={`size-2 rounded-full ${
                        overdue ? "bg-rose-500" : todayTask ? "bg-amber-500" : "bg-zinc-300 dark:bg-zinc-600"
                      }`}
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <Link
                        href={`/tasks/${task.id}`}
                        className="block truncate text-sm font-medium text-zinc-800 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 dark:text-zinc-200 dark:hover:text-brand-300"
                      >
                        {task.title}
                      </Link>
                      <span className="block truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                        {task.brand_name} · {TASK_PRIORITY_ICON[task.priority]} {TASK_PRIORITY_LABEL[task.priority]}
                      </span>
                      <span className="mt-0.5 flex flex-wrap gap-x-2 text-[11px] tabular-nums">
                        {task.personal_target_date && (
                          <span className="font-medium text-brand-700 dark:text-brand-300">
                            Kişisel hedef {formatDateShort(task.personal_target_date)}
                          </span>
                        )}
                        {task.due_date && (
                          <span className={task.due_date < today ? "text-rose-600 dark:text-rose-400" : "text-zinc-500 dark:text-zinc-400"}>
                            Resmi teslim {formatDateShort(task.due_date)}
                          </span>
                        )}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 text-xs font-semibold tabular-nums ${
                        overdue
                          ? "text-rose-600 dark:text-rose-400"
                          : todayTask
                            ? "text-amber-700 dark:text-amber-300"
                            : "text-zinc-500 dark:text-zinc-400"
                      }`}
                    >
                      {timingLabel(task, today)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          {priorityTasks.length > PREVIEW_LIMIT && (
            <p className="px-2 pb-1 pt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
              İlk {PREVIEW_LIMIT} iş gösteriliyor · {priorityTasks.length - PREVIEW_LIMIT} iş daha var
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
