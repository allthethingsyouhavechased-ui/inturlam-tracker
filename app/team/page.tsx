import ActiveWorkBoard from "@/components/ActiveWorkBoard";
import AutoRefresh from "@/components/AutoRefresh";
import DeactivatePersonButton from "@/components/DeactivatePersonButton";
import NewPersonForm from "@/components/NewPersonForm";
import PersonAvatar from "@/components/PersonAvatar";
import { getCurrentPerson } from "@/lib/identity";
import { listActiveWorkSelections } from "@/lib/repositories/activeWork";
import { listBrands } from "@/lib/repositories/brands";
import { listActivePeople, listInactivePeople } from "@/lib/repositories/people";
import { listAllTasks } from "@/lib/repositories/tasks";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const people = listActivePeople();
  const inactive = listInactivePeople();
  const brands = listBrands();
  const selections = listActiveWorkSelections();
  const tasks = listAllTasks();
  const currentPerson = await getCurrentPerson();

  return (
    <div className="space-y-8">
      <AutoRefresh />
      <h1 className="text-2xl font-semibold tracking-tight">Ekip</h1>

      <ActiveWorkBoard
        people={people}
        brands={brands}
        selections={selections}
        tasks={tasks}
        currentPersonId={currentPerson?.id ?? null}
      />

      <div className="border-t border-black/10 pt-7 dark:border-white/10">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Ekip yönetimi
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Yeni kişi ekle veya artık ekipte olmayan hesapları pasife al.
        </p>
      </div>

      <section className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-zinc-900">
        <h3 className="mb-3 text-sm font-semibold">Yeni ekip üyesi ekle</h3>
        <NewPersonForm />
      </section>

      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Aktif ({people.length})
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-white/5 dark:bg-zinc-900"
            >
              <span className="flex min-w-0 items-center gap-3">
                <PersonAvatar name={p.name} size="md" />
                <span className="truncate font-semibold text-zinc-800 dark:text-zinc-200">
                  {p.name}
                </span>
              </span>
              <DeactivatePersonButton personId={p.id} />
            </div>
          ))}
          {people.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Henüz ekip üyesi yok.</p>
          )}
        </div>
      </section>

      {inactive.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Ekipten çıkarılanlar ({inactive.length})
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {inactive.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-dashed border-black/10 bg-white/60 px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400 dark:border-white/10 dark:bg-zinc-900/60"
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
