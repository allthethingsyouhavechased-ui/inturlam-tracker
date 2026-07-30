export default function TeamLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden>
      <div className="h-8 w-24 rounded-lg bg-black/10 dark:bg-white/10" />
      <div className="space-y-2">
        <div className="h-6 w-48 rounded bg-black/10 dark:bg-white/10" />
        <div className="h-4 w-96 rounded bg-black/[0.07] dark:bg-white/[0.07]" />
      </div>
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-80 w-[292px] shrink-0 rounded-2xl border border-black/10 bg-zinc-50/70 dark:border-white/10 dark:bg-white/[0.025]"
          />
        ))}
      </div>
      <span className="sr-only">Ekip panosu yükleniyor…</span>
    </div>
  );
}
