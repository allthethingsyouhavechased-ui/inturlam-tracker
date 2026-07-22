import Link from "next/link";
import { notFound } from "next/navigation";
import AssigneeSelect from "@/components/AssigneeSelect";
import AutoRefresh from "@/components/AutoRefresh";
import ContentStatusSelect from "@/components/ContentStatusSelect";
import NewTaskForm from "@/components/NewTaskForm";
import TaskStatusSelect from "@/components/TaskStatusSelect";
import {
  CONTENT_TYPE_LABEL,
  TASK_STATUS_DOT,
  TASK_STATUS_LABEL,
  TASK_STATUSES,
} from "@/lib/constants";
import { formatDateShort, isOverdue } from "@/lib/date";
import { getCurrentPerson } from "@/lib/identity";
import { getBrand } from "@/lib/repositories/brands";
import { getContentItem } from "@/lib/repositories/content";
import { listActivePeople } from "@/lib/repositories/people";
import { listTasksByContent } from "@/lib/repositories/tasks";

export const dynamic = "force-dynamic";

export default async function ContentPage({
  params,
}: {
  params: Promise<{ brandId: string; contentId: string }>;
}) {
  const { brandId, contentId } = await params;
  const content = getContentItem(contentId);
  const brand = getBrand(brandId);
  if (!content || !brand || content.brand_id !== brandId) notFound();

  const tasks = listTasksByContent(contentId);
  const people = listActivePeople();
  const me = await getCurrentPerson();

  return (
    <div className="space-y-6">
      <AutoRefresh />
      <div className="text-sm text-zinc-500">
        <Link href="/" className="hover:text-zinc-800 dark:hover:text-zinc-200">
          Markalar
        </Link>{" "}
        /{" "}
        <Link
          href={`/brands/${brand.id}`}
          className="hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          {brand.name}
        </Link>{" "}
        /{" "}
        <span className="text-zinc-800 dark:text-zinc-200">{content.title}</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight">{content.title}</h1>
        <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
          {CONTENT_TYPE_LABEL[content.type]}
        </span>
        <ContentStatusSelect contentId={content.id} status={content.status} />
        {content.target_date && (
          <span className="text-xs text-zinc-500">
            📅 Hedef: {formatDateShort(content.target_date)}
          </span>
        )}
      </div>

      <section className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-semibold">Yeni görev</h2>
        <NewTaskForm
          contentItemId={content.id}
          people={people}
          defaultAssigneeId={me?.id ?? null}
        />
      </section>

      <section>
        <div className="grid gap-4 lg:grid-cols-5">
          {TASK_STATUSES.map((status) => {
            const columnTasks = tasks.filter((t) => t.status === status);
            return (
              <div key={status} className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  <span
                    className={`h-2 w-2 rounded-full ${TASK_STATUS_DOT[status]}`}
                  />
                  {TASK_STATUS_LABEL[status]}
                  <span className="text-zinc-300 dark:text-zinc-600">
                    {columnTasks.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {columnTasks.map((task) => (
                    <div
                      key={task.id}
                      className="space-y-2 rounded-lg border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-zinc-900"
                    >
                      <Link
                        href={`/tasks/${task.id}`}
                        className="block text-sm font-medium hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        {task.title}
                      </Link>
                      {task.due_date && (
                        <div
                          className={`text-xs ${isOverdue(task.due_date) ? "font-medium text-rose-600" : "text-zinc-500"}`}
                        >
                          📅 {formatDateShort(task.due_date)}
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <AssigneeSelect
                          taskId={task.id}
                          assigneeId={task.assignee_id}
                          people={people}
                        />
                        <TaskStatusSelect taskId={task.id} status={task.status} />
                      </div>
                    </div>
                  ))}
                  {columnTasks.length === 0 && (
                    <div className="rounded-lg border border-dashed border-black/10 py-3 text-center text-xs text-zinc-300 dark:border-white/10 dark:text-zinc-600">
                      —
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
