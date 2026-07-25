import Link from "next/link";
import AutoRefresh from "@/components/AutoRefresh";
import TaskBoard from "@/components/TaskBoard";
import TaskGridCard from "@/components/TaskGridCard";
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

const BADGE_OVERDUE: TaskCardBadge = {
  label: "Gecikmiş",
  className: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
};
const BADGE_THIS_WEEK: TaskCardBadge = {
  label: "Bu hafta",
  className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
};

export default async function PanomPage() {
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

  // Panom = "benim board'um": ANA board YALNIZCA bana atanmış açık görevleri
  // gösterir. Rozetler bu yüzden "neden buradayım"ı değil aciliyeti anlatır
  // (Gecikmiş / Bu hafta) — hepsi zaten benim olduğu için "Benim" rozeti yok.
  // Rozetler sunucuda düz veri olarak task'a iliştirilir: Server Component'ten
  // Client Component'e fonksiyon geçirilemediği için (RSC kısıtı) callback
  // yerine bunu tercih ediyoruz.
  function badgesFor(taskId: string): TaskCardBadge[] {
    const badges: TaskCardBadge[] = [];
    if (overdueIds.has(taskId)) badges.push(BADGE_OVERDUE);
    if (thisWeekIds.has(taskId)) badges.push(BADGE_THIS_WEEK);
    return badges;
  }

  const myBoardTasks: TaskWithContext[] = myTasks.map((t) => ({
    ...t,
    badges: badgesFor(t.id),
  }));

  // İkinci bölüm: bana atanmamış ama portföyde gecikmiş / bu hafta teslim olan
  // görevler. Ayrı ve açıkça etiketli duruyor ki üstteki board'un "bana
  // atanmış" vaadini bulandırmasın — sürüklenebilir değil, sadece görünürlük.
  const othersMap = new Map<string, TaskWithContext>();
  for (const t of [...overdue, ...thisWeek]) {
    if (myIds.has(t.id)) continue;
    othersMap.set(t.id, { ...t, badges: badgesFor(t.id) });
  }
  const otherTasks = [...othersMap.values()].sort((a, b) =>
    (a.due_date ?? "").localeCompare(b.due_date ?? ""),
  );

  return (
    <div className="space-y-8">
      <AutoRefresh />
      <h1 className="text-xl font-semibold tracking-tight">
        Panom{" "}
        {me && <span className="text-sm font-normal text-zinc-500">· {me.name}</span>}
      </h1>

      {!me && (
        <section className="rounded-xl border border-black/10 bg-white p-4 text-sm text-zinc-600 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300">
          Panom sana atanmış görevleri gösterir — önce{" "}
          <Link href="/whoami" className="font-medium text-indigo-600">
            kim olduğunu seç
          </Link>
          . Ekipte gecikmiş ve bu hafta teslim olacak görevler zaten aşağıda.
        </section>
      )}

      {me && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Bana atanmış açık görevler{" "}
            {myBoardTasks.length > 0 && <span>({myBoardTasks.length})</span>}
          </h2>
          {myBoardTasks.length === 0 ? (
            <p className="text-sm text-zinc-500">Sana atanmış açık görev yok. 🎉</p>
          ) : (
            <TaskBoard tasks={myBoardTasks} boardId="panom" />
          )}
        </section>
      )}

      {otherTasks.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Ekipte gecikmiş / bu hafta teslim ({otherTasks.length})
          </h2>
          <p className="text-xs text-zinc-500">
            Bu görevler başkalarına atanmış ya da hiç atanmamış — takip için burada.
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {otherTasks.map((t) => (
              <TaskGridCard key={t.id} task={t} badges={t.badges} />
            ))}
          </div>
        </section>
      )}

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
