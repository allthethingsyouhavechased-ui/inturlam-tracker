import DeactivatePersonButton from "@/components/DeactivatePersonButton";
import NewPersonForm from "@/components/NewPersonForm";
import { listActivePeople, listInactivePeople } from "@/lib/repositories/people";

export const dynamic = "force-dynamic";

export default function TeamPage() {
  const people = listActivePeople();
  const inactive = listInactivePeople();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Ekip</h1>

      <section className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-semibold">Yeni ekip üyesi ekle</h2>
        <NewPersonForm />
      </section>

      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Aktif ({people.length})
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-zinc-900"
            >
              <span className="font-medium">{p.name}</span>
              <DeactivatePersonButton personId={p.id} />
            </div>
          ))}
          {people.length === 0 && (
            <p className="text-sm text-zinc-500">Henüz ekip üyesi yok.</p>
          )}
        </div>
      </section>

      {inactive.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Ekipten çıkarılanlar ({inactive.length})
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {inactive.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-dashed border-black/10 bg-white/60 px-4 py-3 text-sm text-zinc-500 dark:border-white/10 dark:bg-zinc-900/60"
              >
                <span>{p.name}</span>
                <DeactivatePersonButton personId={p.id} active={false} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
