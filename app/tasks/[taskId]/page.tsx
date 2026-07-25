import Link from "next/link";
import { notFound } from "next/navigation";
import ActivityFeed from "@/components/ActivityFeed";
import AssigneeSelect from "@/components/AssigneeSelect";
import AutoRefresh from "@/components/AutoRefresh";
import CommentForm from "@/components/CommentForm";
import CommentItem from "@/components/CommentItem";
import DeleteTaskButton from "@/components/DeleteTaskButton";
import TaskPrioritySelect from "@/components/TaskPrioritySelect";
import TaskStatusSelect from "@/components/TaskStatusSelect";
import { updateTaskDetailsAction } from "@/lib/actions/tasks";
import { getCurrentPerson } from "@/lib/identity";
import { listActivityForEntity } from "@/lib/repositories/activity";
import { listCommentsByTask } from "@/lib/repositories/comments";
import { listActivePeople } from "@/lib/repositories/people";
import { getTask } from "@/lib/repositories/tasks";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-white/15 dark:bg-zinc-900";

export default async function TaskPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  const task = getTask(taskId);
  if (!task) notFound();

  const people = listActivePeople();
  const comments = listCommentsByTask(taskId);
  const activity = listActivityForEntity("task", taskId);
  const me = await getCurrentPerson();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <AutoRefresh />
      <div className="text-sm text-zinc-500">
        <Link href="/brands" className="hover:text-zinc-800 dark:hover:text-zinc-200">
          Markalar
        </Link>{" "}
        /{" "}
        <Link
          href={`/brands/${task.brand_id}`}
          className="hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          {task.brand_name}
        </Link>{" "}
        /{" "}
        <Link
          href={`/brands/${task.brand_id}/content/${task.content_item_id}`}
          className="hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          {task.content_title}
        </Link>
      </div>

      <h1 className="text-xl font-semibold tracking-tight">{task.title}</h1>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
        <label className="flex items-center gap-2 text-sm text-zinc-500">
          Durum
          <TaskStatusSelect taskId={task.id} status={task.status} />
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-500">
          Atanan
          <AssigneeSelect
            taskId={task.id}
            assigneeId={task.assignee_id}
            people={people}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-500">
          Öncelik
          <TaskPrioritySelect taskId={task.id} priority={task.priority} />
        </label>
      </div>

      <form
        action={updateTaskDetailsAction}
        className="space-y-3 rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900"
      >
        <input type="hidden" name="taskId" value={task.id} />
        <label className="grid gap-1 text-xs font-medium text-zinc-500">
          Teslim tarihi
          <input
            type="date"
            name="dueDate"
            defaultValue={task.due_date ?? ""}
            className={`${inputClass} max-w-xs`}
          />
        </label>
        <label className="grid gap-1 text-xs font-medium text-zinc-500">
          Notlar
          <textarea
            name="notes"
            rows={3}
            defaultValue={task.notes ?? ""}
            placeholder="Brief, referans linkleri, hatırlatmalar…"
            className={inputClass}
          />
        </label>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Kaydet
          </button>
          <DeleteTaskButton taskId={task.id} />
        </div>
      </form>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Yorumlar ({comments.length})</h2>
        <ul className="space-y-2">
          {comments.map((c) => (
            <CommentItem key={c.id} comment={c} canEdit={me?.id === c.author_id} />
          ))}
          {comments.length === 0 && (
            <li className="text-sm text-zinc-500">Henüz yorum yok.</li>
          )}
        </ul>

        {me ? (
          <CommentForm taskId={task.id} />
        ) : (
          <p className="text-sm text-zinc-500">
            Yorum yazmak için{" "}
            <Link href="/whoami" className="font-medium text-indigo-600">
              kim olduğunu seç
            </Link>
            .
          </p>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Hareketler</h2>
        <div className="rounded-xl border border-black/10 bg-white p-2 dark:border-white/10 dark:bg-zinc-900">
          <ActivityFeed
            entries={activity}
            showLink={false}
            emptyText="Bu görevde henüz kayıtlı hareket yok."
          />
        </div>
      </section>
    </div>
  );
}
