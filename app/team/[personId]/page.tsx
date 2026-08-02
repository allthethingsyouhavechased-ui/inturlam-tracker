import Link from "next/link";
import { notFound } from "next/navigation";
import EditPersonProfileForm from "@/components/EditPersonProfileForm";
import PersonAvatar from "@/components/PersonAvatar";
import { getCurrentPerson } from "@/lib/identity";
import { getPerson } from "@/lib/repositories/people";

export const dynamic = "force-dynamic";

export default async function PersonProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ personId: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { personId } = await params;
  const { saved } = await searchParams;
  const person = getPerson(personId);
  if (!person) notFound();
  const current = await getCurrentPerson();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/team"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-zinc-500 transition-colors hover:text-brand-600 dark:text-zinc-400 dark:hover:text-brand-400"
      >
        <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
          <path
            d="m12.5 4.5-5 5 5 5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Ekibe dön
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <PersonAvatar name={person.name} avatarPath={person.avatar_path} size="xl" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-3xl font-semibold tracking-tight">{person.name}</h1>
            {current?.id === person.id && (
              <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                Aktif profil
              </span>
            )}
            {person.active === 0 && (
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                Pasif
              </span>
            )}
          </div>
          <p className="mt-1 text-base text-zinc-500 dark:text-zinc-400">
            {person.title ?? "Unvan henüz eklenmedi"}
          </p>
          {person.bio && (
            <p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              {person.bio}
            </p>
          )}
        </div>
      </header>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Profili düzenle</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Fotoğraf, isim, unvan ve ekip tanıtımını buradan güncelleyebilirsin.
          </p>
        </div>
        {saved === "1" && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/25 dark:text-emerald-300"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 shrink-0" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.78-9.72a.75.75 0 0 0-1.06-1.06L9 10.94 7.28 9.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.06 0l4.25-4.25Z" clipRule="evenodd" />
            </svg>
            Profil güncellendi. Yeni fotoğraf ve bilgiler kaydedildi.
          </div>
        )}
        <EditPersonProfileForm person={person} />
      </section>
    </div>
  );
}
