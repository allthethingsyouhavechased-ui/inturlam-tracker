import Link from "next/link";
import { notFound } from "next/navigation";
import ArchiveContentButton from "@/components/ArchiveContentButton";
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
          <span className="text-xs text-zinc-500">
            👤 {content.assignee_name}
          </span>
        )}
        {content.target_date && (
          <span className="text-xs text-zinc-500">
            📅 Hedef: {formatDateShort(content.target_date)}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <EditContentForm content={content} people={people} />
        <ArchiveContentButton contentId={content.id} archived={content.archived === 1} />
        <DeleteContentButton contentId={content.id} />
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
        <p className="mb-2 text-xs text-zinc-400">
          Bir kartı tutup başka bir sütuna sürükleyerek durumunu değiştirebilirsin.
        </p>
        <KanbanBoard tasks={tasks} people={people} />
      </section>
    </div>
  );
}
