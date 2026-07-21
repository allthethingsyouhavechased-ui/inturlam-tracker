import Link from "next/link";
import { TASK_STATUS_DOT, TASK_STATUS_LABEL } from "@/lib/constants";
import { currentWeekRange, formatDateShort, isOverdue, todayISO } from "@/lib/date";
import { getCurrentPerson } from "@/lib/identity";
import { listBrandsWithOpenCounts } from "@/lib/repositories/brands";
import {
  listOpenTasksByAssignee,
  listOverdueTasks,
  listTasksDueThisWeek,
} from "@/lib/repositories/tasks";
import type { TaskWithContext } from "@/lib/types";

export const dynamic = "force-dynamic";

function TaskLine({ task }: { task: TaskWithContext }) {
  return (
    <Link
      href={`/tasks/${task.id}`}
      className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-white/10 dark:bg-zinc-900 dark:hover:border-indigo-800"
    >
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${TASK_STATUS_DOT[task.status]}`}
        title={TASK_STATUS_LABEL[task.status]}
      />
      <span className="font-medium">{task.title}</span>
      <span className="text-xs text-zinc-500">
        {task.brand_name} · {task.content_title}
      </span>
      <span className="ml-auto flex items-center gap-3 text-xs">
        {task.assignee_name && (
          <span className="text-zinc-500">{task.assignee_name}</span>
        )}
        {task.due_date && (
          <span
            className={
              isOverdue(task.due_date)
                ? "font-medium text-rose-600"
                : "text-zinc-500"
            }
          >
            📅 {formatDateShort(task.due_date)}
          </span>
        )}
      </span>
    </Link>
  );
}

function Section({
  title,
  tasks,
  empty,
}: {
  title: string;
  tasks: TaskWithContext[];
  empty: string;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
        {title} {tasks.length > 0 && <span>({tasks.length})</span>}
      </h2>
      {tasks.length === 0 ? (
        <p className="text-sm text-zinc-500">{empty}</p>
      ) : (
        <div className="grid gap-2">
          {tasks.map((t) => (
            <TaskLine key={t.id} task={t} />
          ))}
        </div>
      )}
    </section>
  );
}

export default async function DashboardPage() {
  const me = await getCurrentPerson();
  const today = todayISO();
  const weekEnd = currentWeekRange().end;

  const myTasks = me ? listOpenTasksByAssignee(me.id) : [];
  const overdue = listOverdueTasks(today);
  const thisWeek = listTasksDueThisWeek(today, weekEnd);
  const brands = listBrandsWithOpenCounts();

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold tracking-tight">Panom</h1>

      {me ? (
        <Section
          title={`Benim görevlerim · ${me.name}`}
          tasks={myTasks}
          empty="Sana atanmış açık görev yok. 🎉"
        />
      ) : (
        <section className="rounded-xl border border-black/10 bg-white p-4 text-sm text-zinc-600 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300">
          Kendi görevlerini görmek için{" "}
          <Link href="/whoami" className="font-medium text-indigo-600">
            kim olduğunu seç
          </Link>
          .
        </section>
      )}

      <Section
        title="Gecikmiş"
        tasks={overdue}
        empty="Gecikmiş görev yok."
      />

      <Section
        title="Bu hafta teslim"
        tasks={thisWeek}
        empty="Bu hafta teslim edilecek görev yok."
      />

      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Markalara göre açık görevler
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {brands
            .filter((b) => b.open_count > 0)
            .map((b) => (
              <Link
                key={b.id}
                href={`/brands/${b.id}`}
                className="flex items-center justify-between rounded-lg border border-black/10 bg-white px-3 py-2 text-sm transition-colors hover:border-indigo-300 dark:border-white/10 dark:bg-zinc-900 dark:hover:border-indigo-800"
              >
                <span className="font-medium">{b.name}</span>
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-indigo-100 px-2 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {b.open_count}
                </span>
              </Link>
            ))}
        </div>
        {brands.every((b) => b.open_count === 0) && (
          <p className="text-sm text-zinc-500">Hiç açık görev yok.</p>
        )}
      </section>
    </div>
  );
}
