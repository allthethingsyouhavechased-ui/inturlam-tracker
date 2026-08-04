import Link from "next/link";
import { notFound } from "next/navigation";
import ApplyTemplateForm from "@/components/ApplyTemplateForm";
import ArchiveContentButton from "@/components/ArchiveContentButton";
import ArchiveTaskButton from "@/components/ArchiveTaskButton";
import AutoRefresh from "@/components/AutoRefresh";
import ContentStatusSelect from "@/components/ContentStatusSelect";
import DeleteContentButton from "@/components/DeleteContentButton";
import EditContentForm from "@/components/EditContentForm";
import KanbanBoard from "@/components/KanbanBoard";
import NewTaskForm from "@/components/NewTaskForm";
import { CONTENT_TYPE_LABEL } from "@/lib/constants";
import { formatDateShort } from "@/lib/date";
import { getCurrentPerson } from "@/lib/identity";
import { getBrand } from "@/lib/repositories/brands";
import { getContentItem } from "@/lib/repositories/content";
import { listActivePeople } from "@/lib/repositories/people";
import {
  listArchivedTasksByContent,
  listTasksByContent,
  sweepArchivablePublishedTasks,
} from "@/lib/repositories/tasks";
import { listTemplates } from "@/lib/repositories/templates";
import { ARCHIVE_AFTER_DAYS } from "@/lib/taskArchive";

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

  sweepArchivablePublishedTasks();
  const tasks = listTasksByContent(contentId);
  const archivedTasks = listArchivedTasksByContent(contentId);
  const people = listActivePeople();
  const me = await getCurrentPerson();
  // Bu içerik türüne uyan şablonlar + her türe uyanlar.
  const templates = listTemplates().filter(
    (t) => t.content_type === null || t.content_type === content.type,
  );

  return (
    <div className="space-y-6">
      <AutoRefresh />
      <div className="text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/brands" className="hover:text-zinc-800 dark:hover:text-zinc-200">
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
        <h1 className="text-2xl font-semibold tracking-tight">{content.title}</h1>
        <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
          {CONTENT_TYPE_LABEL[content.type]}
        </span>
        <ContentStatusSelect contentId={content.id} status={content.status} />
        {content.assignee_name && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            👤 {content.assignee_name}
          </span>
        )}
        {content.target_date && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            📅 Hedef: {formatDateShort(content.target_date)}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <EditContentForm content={content} people={people} />
        <ArchiveContentButton contentId={content.id} archived={content.archived === 1} />
        <DeleteContentButton contentId={content.id} />
      </div>

      <section className="space-y-3 rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold">Yeni görev</h2>
        <NewTaskForm
          contentItemId={content.id}
          people={people}
          defaultAssigneeId={me?.id ?? null}
        />
        <div className="border-t border-black/10 pt-3 dark:border-white/10">
          <ApplyTemplateForm
            contentItemId={content.id}
            templates={templates}
            defaultAssigneeId={me?.id ?? null}
          />
        </div>
      </section>

      <section>
        <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
          Bir kartı tutup başka bir sütuna sürükleyerek durumunu değiştirebilirsin.
          Yayınlananlar {ARCHIVE_AFTER_DAYS} gün panoda kalır, sonra aşağıdaki
          arşive düşer.
        </p>
        <KanbanBoard tasks={tasks} people={people} />
      </section>

      {/* Arşiv panoyu şişirmesin diye katlanmış geliyor. Kayıtlar silinmedi:
          başlık linki görev detayına gider, düğme tek tıkla panoya geri koyar. */}
      {archivedTasks.length > 0 && (
        <details className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
          <summary className="cursor-pointer text-sm font-semibold">
            Arşiv ({archivedTasks.length})
          </summary>
          <ul className="mt-3 divide-y divide-black/5 dark:divide-white/5">
            {archivedTasks.map((task) => (
              <li
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2"
              >
                <Link
                  href={`/tasks/${task.id}`}
                  className="min-w-0 text-sm hover:text-brand-600 dark:hover:text-brand-400"
                >
                  <span className="block truncate font-medium">{task.title}</span>
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                    {task.assignee_name ?? "Atanmamış"} ·{" "}
                    {formatDateShort(task.completed_at?.slice(0, 10) ?? null)} tarihinde
                    tamamlandı
                  </span>
                </Link>
                <ArchiveTaskButton taskId={task.id} archived />
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
