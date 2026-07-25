import { setIdentity } from "@/lib/actions/identity";
import { getCurrentPerson } from "@/lib/identity";
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

      <div className="grid gap-2">
        {people.map((p) => (
          <form key={p.id} action={setIdentity}>
            <input type="hidden" name="personId" value={p.id} />
            <button
              type="submit"
              className={`w-full rounded-lg border px-4 py-3 text-left font-medium transition-colors ${
                current?.id === p.id
                  ? "border-brand-400 bg-brand-50 text-brand-700 dark:border-brand-700 dark:bg-brand-950/40 dark:text-brand-300"
                  : "border-black/10 bg-white hover:border-brand-300 hover:bg-brand-50/50 dark:border-white/10 dark:bg-zinc-900 dark:hover:border-brand-800"
              }`}
            >
              {p.name}
              {current?.id === p.id && (
                <span className="ml-2 text-xs font-normal text-brand-600 dark:text-brand-400">
                  (şu an bu)
                </span>
              )}
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
