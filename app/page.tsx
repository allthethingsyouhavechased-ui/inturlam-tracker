import Link from "next/link";
import Logo from "@/components/Logo";
import { currentWeekRange, todayISO } from "@/lib/date";
import { listBrandsWithOpenCounts } from "@/lib/repositories/brands";
import {
  listAllTasks,
  listOverdueTasks,
  listTasksDueThisWeek,
} from "@/lib/repositories/tasks";

export const dynamic = "force-dynamic";

const QUICK_LINKS = [
  { href: "/brands", label: "Markalar", desc: "Tüm markalar, içerikler ve denetim verileri" },
  { href: "/tasks", label: "Görevler", desc: "Portföydeki tüm görevler, filtrelenebilir" },
  { href: "/reports", label: "Raporlar", desc: "Kişi ve marka bazlı görev özetleri" },
  { href: "/activity", label: "Aktivite", desc: "Kim, ne zaman, ne yaptı — tüm hareketler" },
  { href: "/team", label: "Ekip", desc: "Ekip üyelerini ekle/çıkar" },
  { href: "/panom", label: "Panom", desc: "Bana atanmış, gecikmiş ve bu hafta teslim görevler" },
];

const ACCENT = {
  default: "text-zinc-900 dark:text-white",
  rose: "text-rose-600 dark:text-rose-400",
  amber: "text-amber-600 dark:text-amber-400",
} as const;

function StatCard({
  label,
  value,
  accent = "default",
}: {
  label: string;
  value: number;
  accent?: keyof typeof ACCENT;
}) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
      <div className={`text-2xl font-semibold tabular-nums ${ACCENT[accent]}`}>{value}</div>
      <div className="mt-0.5 text-xs text-zinc-500">{label}</div>
    </div>
  );
}

export default function HomePage() {
  const today = todayISO();
  const weekEnd = currentWeekRange().end;

  const brands = listBrandsWithOpenCounts();
  const allTasks = listAllTasks();
  const openTasks = allTasks.filter((t) => t.status !== "Yayinlandi");
  const overdue = listOverdueTasks(today);
  const thisWeek = listTasksDueThisWeek(today, weekEnd);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Logo className="h-11 w-11 shrink-0 text-zinc-800 dark:text-zinc-100" />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">İNTURLAM İş Takip</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Ajans genelinde marka, içerik ve görev takibi.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Marka" value={brands.length} />
        <StatCard label="Açık görev" value={openTasks.length} />
        <StatCard label="Gecikmiş görev" value={overdue.length} accent="rose" />
        <StatCard label="Bu hafta teslim" value={thisWeek.length} accent="amber" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-xl border border-black/10 bg-white p-4 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-white/10 dark:bg-zinc-900 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/30"
          >
            <div className="font-medium">{l.label}</div>
            <div className="mt-1 text-xs text-zinc-500">{l.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
