export default function ReportsLoading() {
  return (
    <div className="animate-pulse space-y-7" aria-hidden>
      <div className="h-8 w-32 rounded-lg bg-black/10 dark:bg-white/10" />
      <div className="h-16 rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900" />
      <div className="grid grid-cols-5 gap-px overflow-hidden rounded-2xl border border-black/10 bg-black/10 dark:border-white/10 dark:bg-white/10">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-28 bg-white dark:bg-zinc-900" />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-24 rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900"
          />
        ))}
      </div>
      <div className="h-64 rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900" />
      <span className="sr-only">Raporlar yükleniyor…</span>
    </div>
  );
}
