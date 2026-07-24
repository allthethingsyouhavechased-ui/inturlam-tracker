import Link from "next/link";
import AutoRefresh from "@/components/AutoRefresh";
import TaskBoard from "@/components/TaskBoard";
import { currentWeekRange, todayISO } from "@/lib/date";
import { getCurrentPerson } from "@/lib/identity";
import { listBrandsWithOpenCounts } from "@/lib/repositories/brands";
import {
  listOpenTasksByAssignee,
  listOverdueTasks,
  listTasksDueThisWeek,
} from "@/lib/repositories/tasks";
import type { TaskCardBadge, TaskWithContext } from "@/lib/types";

export const dynamic = "force-dynamic";

const BADGE_MINE: TaskCardBadge = {
  label: "Benim",
  className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
};
const BADGE_OVERDUE: TaskCardBadge = {
  label: "Gecikmiş",
  className: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
};
const BADGE_THIS_WEEK: TaskCardBadge = {
  label: "Bu hafta",
  className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
};

export default async function HomePage() {
  const me = await getCurrentPerson();
  const today = todayISO();
  const weekEnd = currentWeekRange().end;

  const myTasks = me ? listOpenTasksByAssignee(me.id) : [];
  const overdue = listOverdueTasks(today);
  const thisWeek = listTasksDueThisWeek(today, weekEnd);
  const brands = listBrandsWithOpenCounts();

  const myIds = new Set(myTasks.map((t) => t.id));
  const overdueIds = new Set(overdue.map((t) => t.id));
  const thisWeekIds = new Set(thisWeek.map((t) => t.id));

  // Panom, Görevler'in aksine "her şeyi" değil, kişiye özel ("bana atanmış /
  // gecikmiş / bu hafta teslim") tek bir kürate edilmiş board gösterir — her
  // kart hangi nedenle/nedenlerle burada olduğunu rozetle taşır. Rozetler
  // sunucuda düz veri olarak her task'a iliştirilir — Server Component'ten
  // Client Component'e fonksiyon geçirilemediği için (RSC kısıtı) bir
  // callback yerine bunu tercih ediyoruz.
  function badgesFor(taskId: string): TaskCardBadge[] {
    const badges: TaskCardBadge[] = [];
    if (myIds.has(taskId)) badges.push(BADGE_MINE);
    if (overdueIds.has(taskId)) badges.push(BADGE_OVERDUE);
    if (thisWeekIds.has(taskId)) badges.push(BADGE_THIS_WEEK);
    return badges;
  }

  const merged = new Map<string, TaskWithContext>();
  for (const t of [...myTasks, ...overdue, ...thisWeek]) {
    merged.set(t.id, { ...t, badges: badgesFor(t.id) });
  }
  const relevantTasks = [...merged.values()];

  return (
    <div className="space-y-8">
      <AutoRefresh />
      <h1 className="text-xl font-semibold tracking-tight">Panom</h1>

      {!me && (
        <section className="rounded-xl border border-black/10 bg-white p-4 text-sm text-zinc-600 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300">
          Kendi görevlerin (“Benim” rozetiyle) burada da görünsün istersen{" "}
          <Link href="/whoami" className="font-medium text-indigo-600">
            kim olduğunu seç
          </Link>
          . Gecikmiş ve bu hafta teslim olacak görevler zaten aşağıda.
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          İlgilenmen gereken görevler{" "}
          {relevantTasks.length > 0 && <span>({relevantTasks.length})</span>}
        </h2>
        {relevantTasks.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Bana atanmış, gecikmiş ya da bu hafta teslim olacak açık görev yok. 🎉
          </p>
        ) : (
          <TaskBoard tasks={relevantTasks} boardId="panom" />
        )}
      </section>

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
