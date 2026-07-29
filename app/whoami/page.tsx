import { setIdentity } from "@/lib/actions/identity";
import { getCurrentPerson } from "@/lib/identity";
import PersonAvatar from "@/components/PersonAvatar";
import { listActivePeople } from "@/lib/repositories/people";

export const dynamic = "force-dynamic";

export default async function WhoAmIPage() {
  const people = listActivePeople();
  const current = await getCurrentPerson();

  return (
    <div className="mx-auto max-w-md space-y-6 py-8">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Sen kimsin?</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Görevleri ve yorumları senin adına kaydedebilmem için seç.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
        {people.map((p) => (
          <form key={p.id} action={setIdentity}>
            <input type="hidden" name="personId" value={p.id} />
            <button
              type="submit"
              className={`flex min-h-36 w-full flex-col items-center justify-center gap-3 rounded-2xl border p-4 text-center transition-[border-color,box-shadow,background-color] sm:p-6 ${
                current?.id === p.id
                  ? "border-brand-500 bg-brand-50/60 shadow-sm ring-1 ring-brand-500/20 dark:bg-brand-950/30"
                  : "border-black/5 bg-white hover:border-brand-300 hover:shadow-md dark:border-white/5 dark:bg-zinc-900"
              }`}
            >
              <PersonAvatar name={p.name} size="lg" />
              <span>
                <span
                  className={`block font-bold tracking-tight ${
                    current?.id === p.id
                      ? "text-brand-700 dark:text-brand-300"
                      : "text-zinc-700 dark:text-zinc-200"
                  }`}
                >
                  {p.name}
                </span>
                {current?.id === p.id && (
                  <span className="mt-1 block text-[10px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                    Aktif profil
                  </span>
                )}
              </span>
            </button>
          </form>
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
