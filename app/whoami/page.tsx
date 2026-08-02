import { setIdentity } from "@/lib/actions/identity";
import { getCurrentPerson } from "@/lib/identity";
import PersonAvatar from "@/components/PersonAvatar";
import Link from "next/link";
import { listActivePeople } from "@/lib/repositories/people";

export const dynamic = "force-dynamic";

export default async function WhoAmIPage() {
  const people = listActivePeople();
  const current = await getCurrentPerson();

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6 sm:py-8">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Sen kimsin?</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Görevleri ve yorumları senin adına kaydedebilmem için seç.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {people.map((p) => (
          <article
            key={p.id}
            className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-[border-color,box-shadow] hover:shadow-md dark:bg-zinc-900 ${
              current?.id === p.id
                ? "border-brand-500 ring-1 ring-brand-500/20"
                : "border-black/5 hover:border-brand-300 dark:border-white/5 dark:hover:border-brand-700"
            }`}
          >
            <form action={setIdentity}>
              <input type="hidden" name="personId" value={p.id} />
              <button
                type="submit"
                className={`flex min-h-32 w-full cursor-pointer flex-col items-center justify-center gap-2.5 p-3 text-center transition-colors sm:p-4 ${
                  current?.id === p.id
                    ? "bg-brand-50/60 dark:bg-brand-950/30"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800/70"
                }`}
              >
                <PersonAvatar name={p.name} avatarPath={p.avatar_path} size="lg" />
                <span className="min-w-0">
                  <span
                    className={`block truncate font-bold tracking-tight ${
                      current?.id === p.id
                        ? "text-brand-700 dark:text-brand-300"
                        : "text-zinc-700 dark:text-zinc-200"
                    }`}
                  >
                    {p.name}
                  </span>
                  <span className="mt-0.5 block min-h-4 truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {p.title ?? "Profili seç"}
                  </span>
                  {current?.id === p.id && (
                    <span className="mt-1 block text-[10px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                      Aktif profil
                    </span>
                  )}
                </span>
              </button>
            </form>
            <Link
              href={`/team/${p.id}`}
              className="flex min-h-11 items-center justify-center gap-1.5 border-t border-black/5 px-3 text-xs font-semibold text-zinc-500 transition-colors hover:bg-black/[0.03] hover:text-brand-600 dark:border-white/5 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-brand-400"
            >
              Profili aç
              <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
                <path d="m6 3.5 4.5 4.5L6 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </article>
        ))}
      </div>

      {people.length === 0 && (
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Kişi listesi boş. <code>db/seed.mts</code> içinde kişileri düzenleyip{" "}
          <code className="rounded bg-black/5 px-1 dark:bg-white/10">
            npm run db:seed
          </code>{" "}
          çalıştır.
        </p>
      )}
    </div>
  );
}
