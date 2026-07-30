export default function TasksLoading() {
  return (
    <div className="animate-pulse space-y-5" aria-hidden>
      <div className="h-8 w-36 rounded-lg bg-black/10 dark:bg-white/10" />
      <div className="flex gap-2 rounded-2xl border border-black/10 p-3 dark:border-white/10">
        <div className="h-11 flex-1 rounded-xl bg-black/[0.07] dark:bg-white/10" />
        <div className="h-11 w-28 rounded-xl bg-black/[0.07] dark:bg-white/10" />
        <div className="h-11 w-24 rounded-xl bg-black/[0.07] dark:bg-white/10" />
      </div>
      <div className="grid gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, column) => (
          <div
            key={column}
            className="min-h-64 space-y-3 rounded-2xl border border-black/10 bg-zinc-50/70 p-3 dark:border-white/10 dark:bg-white/[0.025]"
          >
            <div className="h-10 rounded-lg bg-black/[0.07] dark:bg-white/10" />
            {Array.from({ length: column % 2 === 0 ? 2 : 1 }).map((__, card) => (
              <div
                key={card}
                className="h-32 rounded-xl border-2 border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900"
              />
            ))}
          </div>
        ))}
      </div>
      <span className="sr-only">Görevler yükleniyor…</span>
    </div>
  );
}
