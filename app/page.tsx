import Link from "next/link";
import ActivityFeed from "@/components/ActivityFeed";
import Logo from "@/components/Logo";
import PersonAvatar from "@/components/PersonAvatar";
import { TASK_PRIORITY_LABEL } from "@/lib/constants";
import { currentWeekRange, formatDateShort, todayISO } from "@/lib/date";
import { getCurrentPerson } from "@/lib/identity";
import { listRecentActivity } from "@/lib/repositories/activity";
import { listBrandsWithOpenCounts } from "@/lib/repositories/brands";
import {
  listAllTasks,
  listOverdueTasks,
  listTasksDueThisWeek,
} from "@/lib/repositories/tasks";
import type { TaskWithContext } from "@/lib/types";

export const dynamic = "force-dynamic";

// Listelerde kaç satır gösterilecek. Ana sayfa bir özet — tamamı /tasks'ta.
const PREVIEW = 6;

const ACCENT = {
  default: "text-zinc-900 dark:text-white",
  rose: "text-rose-600 dark:text-rose-400",
  amber: "text-amber-600 dark:text-amber-400",
} as const;

// İstatistik kartı artık link: sayıyı görüp "peki hangileri?" diye sorunca
// tıklanacak bir şey olsun. Gecikmiş/bu hafta aynı sayfadaki listeye çapayla
// iner, marka ve açık görev ilgili sayfaya gider.
function StatCard({
  href,
  label,
  value,
  accent = "default",
}: {
  href: string;
  label: string;
  value: number;
  accent?: keyof typeof ACCENT;
}) {
  return (
    <Link
      href={href}
      className="group relative min-w-0 overflow-hidden rounded-2xl border border-black/5 bg-white p-4 shadow-sm transition-[transform,box-shadow,border-color] hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md sm:p-5 dark:border-white/5 dark:bg-zinc-900 dark:hover:border-brand-900"
    >
      <div className="relative z-10 min-w-0">
        <div className={`text-3xl font-bold tabular-nums tracking-tight ${ACCENT[accent]}`}>
          {value}
        </div>
        <div className="mt-1 truncate text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {label}
        </div>
      </div>
      <div
        className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-brand-500/[0.045] transition-transform group-hover:scale-125"
        aria-hidden="true"
      />
    </Link>
  );
}

// Kompakt görev satırı: marka + başlık solda, tarih/öncelik/atanan sağda.
// `overdue` yalnızca tarihin rengini değiştirir — bilgi sadece renkle
// verilmesin diye tarihin yanında "gecikmiş" anlamı zaten bölüm başlığında.
function TaskRow({ task, overdue }: { task: TaskWithContext; overdue?: boolean }) {
  return (
    <li className="group">
      <Link
        href={`/tasks/${task.id}`}
        className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-white/5"
      >
        <span
          className={`h-2 w-2 rounded-full ${
            overdue ? "bg-rose-500" : "bg-zinc-300 dark:bg-zinc-700"
          }`}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-zinc-800 transition-colors group-hover:text-brand-700 dark:text-zinc-200 dark:group-hover:text-brand-300">
            {task.title}
          </span>
          <span className="block truncate text-[11px] text-zinc-500 dark:text-zinc-400">
            {task.brand_name} · {task.content_title}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {task.priority !== "Normal" && (
            <span
              className={`hidden rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase sm:inline ${
                task.priority === "Acil"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
                  : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
              }`}
            >
              {TASK_PRIORITY_LABEL[task.priority]}
            </span>
          )}
          <span
            className={`text-[11px] tabular-nums sm:text-xs ${
              overdue ? "font-semibold text-rose-600 dark:text-rose-400" : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            {formatDateShort(task.due_date)}
          </span>
          {task.assignee_name ? (
            <PersonAvatar
              name={task.assignee_name}
              avatarPath={task.assignee_avatar_path}
              size="xs"
            />
          ) : (
            <span
              className="h-5 w-5 rounded-full border border-dashed border-zinc-300 dark:border-zinc-700"
              aria-hidden="true"
            />
          )}
        </span>
      </Link>
    </li>
  );
}

function TaskPanel({
  id,
  title,
  tasks,
  overdue,
  emptyText,
}: {
  id: string;
  title: string;
  tasks: TaskWithContext[];
  overdue?: boolean;
  emptyText: string;
}) {
  // `min-w-0` ŞART: grid çocuklarının varsayılan `min-width: auto` değeri,
  // kırpılmayan (nowrap) metnin TAM genişliğini alt sınır kabul eder — içeride
  // `truncate` olsa bile sütun en uzun görev başlığı kadar genişler ve telefonda
  // sayfaya yatay kaydırma ekler.
  return (
    <section id={id} className="min-w-0 space-y-3 scroll-mt-20">
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="flex min-w-0 items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          {overdue && <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500" aria-hidden="true" />}
          {title}
          <span className="text-xs font-normal tabular-nums text-zinc-400">
            ({tasks.length})
          </span>
        </h2>
        {tasks.length > PREVIEW && (
          <Link
            href="/tasks"
            className="shrink-0 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            Tümünü gör
          </Link>
        )}
      </div>
      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white p-1.5 shadow-sm dark:border-white/5 dark:bg-zinc-900">
        {tasks.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            {emptyText}
          </p>
        ) : (
          <ul className="divide-y divide-black/5 dark:divide-white/5">
            {tasks.slice(0, PREVIEW).map((t) => (
              <TaskRow key={t.id} task={t} overdue={overdue} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default async function HomePage() {
  const today = todayISO();
  const weekEnd = currentWeekRange().end;
  const me = await getCurrentPerson();

  const brands = listBrandsWithOpenCounts();
  const allTasks = listAllTasks();
  const openTasks = allTasks.filter((t) => t.status !== "Yayinlandi");
  const overdue = listOverdueTasks(today);
  const thisWeek = listTasksDueThisWeek(today, weekEnd);
  const activity = listRecentActivity(8);

  const mine = me
    ? openTasks.filter((t) => t.assignee_id === me.id)
    : [];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Logo className="h-11 w-11 shrink-0" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">İNTURLAM İş Takip</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Ajans genelinde marka, içerik ve görev takibi.
          </p>
        </div>
      </div>

      {/* Telefonda 2×2: tek sütunda 4 kart, ekranın tamamını yiyip altındaki
          asıl işi (gecikmiş görevler) kaydırma mesafesine itiyordu. */}
      <div className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard href="/brands" label="Aktif marka" value={brands.length} />
        <StatCard href="/tasks" label="Açık görev" value={openTasks.length} />
        <StatCard
          href="#gecikmis"
          label="Gecikmiş"
          value={overdue.length}
          accent="rose"
        />
        <StatCard
          href="#bu-hafta"
          label="Bu hafta"
          value={thisWeek.length}
          accent="amber"
        />
      </div>

      {/* Ana sayfa artık "nereye gideyim?" değil "bugün ne var?" sorusunu
          cevaplıyor. Eskiden burada üstteki nav'ı ve soldaki sidebar'ı
          tekrarlayan 6 link kartı vardı — üç kez aynı menü. */}
      <div className="grid min-w-0 gap-6">
        <div className="grid min-w-0 gap-6">
          <TaskPanel
            id="gecikmis"
            title="Kritik ve gecikmiş"
            tasks={overdue}
            overdue
            emptyText="Gecikmiş görev yok — portföy temiz."
          />
          <TaskPanel
            id="bu-hafta"
            title="Bu hafta teslim"
            tasks={thisWeek}
            emptyText="Bu hafta teslim edilecek görev yok."
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="min-w-0 space-y-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {me ? `Sende açık (${mine.length})` : "Sende açık"}
            </h2>
            <Link
              href="/panom"
              className="text-xs font-medium text-brand-600 dark:text-brand-400"
            >
              Panom →
            </Link>
          </div>
          <div className="rounded-xl border border-black/10 bg-white p-2 dark:border-white/10 dark:bg-zinc-900">
            {!me ? (
              <p className="px-2 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                Sana atanmış görevleri görmek için{" "}
                <Link href="/whoami" className="font-medium text-brand-600 dark:text-brand-400">
                  kim olduğunu seç
                </Link>
                .
              </p>
            ) : mine.length === 0 ? (
              <p className="px-2 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                Sana atanmış açık görev yok.
              </p>
            ) : (
              <ul className="space-y-0.5">
                {mine.slice(0, PREVIEW).map((t) => (
                  <TaskRow key={t.id} task={t} overdue={t.due_date !== null && t.due_date < today} />
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="min-w-0 space-y-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Son hareketler
            </h2>
            <Link
              href="/activity"
              className="text-xs font-medium text-brand-600 dark:text-brand-400"
            >
              Tümü →
            </Link>
          </div>
          <div className="rounded-xl border border-black/10 bg-white p-2 dark:border-white/10 dark:bg-zinc-900">
            <ActivityFeed entries={activity} />
          </div>
        </section>
      </div>
    </div>
  );
}
