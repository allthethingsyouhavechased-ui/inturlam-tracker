import Link from "next/link";
import { TASK_PRIORITY_ICON, TASK_PRIORITY_LABEL } from "@/lib/constants";
import { formatDateShort } from "@/lib/date";
import type { TaskWithContext } from "@/lib/types";

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

function timingLabel(task: TaskWithContext, today: string): string {
  if (!task.due_date) return "Tarih yok";
  if (task.due_date < today) return "Gecikmiş";
  if (task.due_date === today) return "Bugün";
  return formatDateShort(task.due_date);
}

export default function PersonalDeadlinePanel({
  personId,
  overdueTasks,
  upcomingTasks,
  today,
  horizonDays,
}: {
  personId: string;
  overdueTasks: TaskWithContext[];
  upcomingTasks: TaskWithContext[];
  today: string;
  horizonDays: number;
}) {
  const dueToday = upcomingTasks.filter((task) => task.due_date === today);
  const dueSoon = upcomingTasks.filter((task) => task.due_date !== today);
  const priorityTasks = [...overdueTasks, ...dueToday, ...dueSoon];
  const hasImmediateRisk = overdueTasks.length > 0 || dueToday.length > 0;

  const summary = overdueTasks.length > 0
    ? `${overdueTasks.length} gecikmiş iş önce ilgilenmeni bekliyor.`
    : dueToday.length > 0
      ? `Bugün ${dueToday.length} işin teslim tarihi.`
      : dueSoon.length > 0
        ? `Sıradaki teslim ${formatDateShort(dueSoon[0]?.due_date ?? null)}.`
        : `Önümüzdeki ${horizonDays} gün için zaman baskısı görünmüyor.`;

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
          <div className="flex items-start justify-between gap-3">
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
          </div>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
            <Metric label="Geciken" value={overdueTasks.length} tone="danger" />
            <Metric label="Bugün" value={dueToday.length} tone="warning" />
            <Metric label={`Sonraki ${horizonDays} gün`} value={dueSoon.length} tone="neutral" />
          </div>
        </div>

        <div className="min-w-0 border-t border-black/[0.07] p-2 sm:p-3 lg:border-l lg:border-t-0 dark:border-white/[0.08]">
          <div className="flex items-center justify-between gap-3 px-2 py-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Öncelik sırası
            </p>
            <Link
              href={`/tasks?assignee=${encodeURIComponent(personId)}`}
              className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
            >
              Tüm görevlerim →
            </Link>
          </div>

          {priorityTasks.length === 0 ? (
            <div className="flex min-h-24 items-center px-2 py-4 text-sm text-zinc-500 dark:text-zinc-400">
              Yakın teslim görünmüyor. Tarihi olmayan görevler bu radara dahil edilmez.
            </div>
          ) : (
            <ul className="divide-y divide-black/[0.06] dark:divide-white/[0.07]">
              {priorityTasks.slice(0, PREVIEW_LIMIT).map((task) => {
                const overdue = task.due_date !== null && task.due_date < today;
                const todayTask = task.due_date === today;
                return (
                  <li key={task.id}>
                    <Link
                      href={`/tasks/${task.id}`}
                      className="group grid min-h-12 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-black/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 dark:hover:bg-white/5"
                    >
                      <span
                        className={`size-2 rounded-full ${
                          overdue ? "bg-rose-500" : todayTask ? "bg-amber-500" : "bg-zinc-300 dark:bg-zinc-600"
                        }`}
                        aria-hidden="true"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-zinc-800 group-hover:text-brand-700 dark:text-zinc-200 dark:group-hover:text-brand-300">
                          {task.title}
                        </span>
                        <span className="block truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                          {task.brand_name} · {TASK_PRIORITY_ICON[task.priority]} {TASK_PRIORITY_LABEL[task.priority]}
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
                    </Link>
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
