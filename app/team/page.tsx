import ActiveWorkBoard from "@/components/ActiveWorkBoard";
import Link from "next/link";
import AutoRefresh from "@/components/AutoRefresh";
import DeactivatePersonButton from "@/components/DeactivatePersonButton";
import NewPersonPopover from "@/components/NewPersonPopover";
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
    <div className="team-page-wide space-y-6">
      <AutoRefresh />
      <h1 className="text-2xl font-semibold tracking-tight">Ekip</h1>

      <ActiveWorkBoard
        people={people}
        brands={brands}
        selections={selections}
        tasks={tasks}
        currentPersonId={currentPerson?.id ?? null}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-5 dark:border-white/10">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Ekip yönetimi
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Profilleri düzenle veya artık ekipte olmayan hesapları pasife al.
          </p>
        </div>
        <NewPersonPopover />
      </div>

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
              <Link
                href={`/team/${p.id}`}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-xl py-1 transition-colors hover:text-brand-600 dark:hover:text-brand-400"
              >
                <PersonAvatar name={p.name} avatarPath={p.avatar_path} size="md" />
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-zinc-800 dark:text-zinc-200">
                    {p.name}
                  </span>
                  <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {p.title ?? "Profili düzenle"}
                  </span>
                </span>
              </Link>
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
