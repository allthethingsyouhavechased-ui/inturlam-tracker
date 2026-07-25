// Sayfa geçişlerinde gösterilen iskelet. DB okuyan her sayfa `force-dynamic`
// olduğu için gezinme sunucu yanıtını bekler; bu dosya olmadan tarayıcı eski
// sayfada donmuş gibi görünüyordu. Nötr bir düzen — başlık + kart ızgarası +
// satır listesi — hangi sayfaya gidilirse gidilsin yakın duruyor.
export default function Loading() {
  return (
    <div className="animate-pulse space-y-8" aria-hidden>
      <div className="h-7 w-48 rounded-md bg-black/10 dark:bg-white/10" />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900"
          />
        ))}
      </div>

      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-12 rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900"
          />
        ))}
      </div>

      <span className="sr-only">Yükleniyor…</span>
    </div>
  );
}
