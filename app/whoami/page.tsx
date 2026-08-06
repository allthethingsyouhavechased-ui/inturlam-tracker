import Link from "next/link";
import IdentityLoginForm from "@/components/IdentityLoginForm";
import PersonAvatar from "@/components/PersonAvatar";
import { getCurrentPerson } from "@/lib/identity";
import { listLoginPeople } from "@/lib/repositories/people";

export const dynamic = "force-dynamic";

export default async function WhoAmIPage({
  searchParams,
}: {
  searchParams: Promise<{ person?: string; changed?: string }>;
}) {
  const { person: selectedId, changed } = await searchParams;
  const people = listLoginPeople();
  const current = await getCurrentPerson();
  const selected = selectedId ? people.find((person) => person.id === selectedId) : undefined;

  if (selected) {
    const needsPasswordSetup = selected.has_password !== 1;
    return (
      <div className="mx-auto max-w-md space-y-5 py-8">
        <Link href="/whoami" className="inline-flex min-h-11 items-center text-sm font-medium text-zinc-500 hover:text-brand-600 dark:text-zinc-400 dark:hover:text-brand-400">
          ← Başka bir hesap seç
        </Link>
        <section className="space-y-5 rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <PersonAvatar name={selected.name} avatarPath={selected.avatar_path} size="lg" />
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold">{selected.name}</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {selected.is_manager === 1 ? "Yönetici hesabı" : selected.title ?? "Ekip hesabı"}
              </p>
            </div>
          </div>
          {needsPasswordSetup && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/25 dark:text-amber-200">
              Bu mevcut hesap ilk kez şifreli girişe geçiyor. Sana ait, en az 6 karakterlik bir şifre belirle.
            </div>
          )}
          <IdentityLoginForm personId={selected.id} needsPasswordSetup={needsPasswordSetup} />
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6 sm:py-8">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Sen kimsin?</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Kendi adına tıkla ve şifrenle giriş yap.</p>
      </div>
      {changed === "1" && (
        <p role="status" className="mx-auto max-w-lg rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/25 dark:text-emerald-300">
          Şifren değiştirildi. Yeni şifrenle tekrar giriş yap.
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {people.map((person) => (
          <Link
            key={person.id}
            href={`/whoami?person=${encodeURIComponent(person.id)}`}
            className={`flex min-h-36 flex-col items-center justify-center gap-2.5 rounded-2xl border bg-white p-3 text-center shadow-sm transition-[border-color,box-shadow,background-color] hover:border-brand-300 hover:bg-zinc-50 hover:shadow-md dark:bg-zinc-900 dark:hover:border-brand-700 dark:hover:bg-zinc-800/70 ${
              current?.id === person.id ? "border-brand-500 ring-1 ring-brand-500/20" : "border-black/5 dark:border-white/5"
            }`}
          >
            <PersonAvatar name={person.name} avatarPath={person.avatar_path} size="lg" />
            <span className="min-w-0">
              <span className="block truncate font-bold tracking-tight text-zinc-700 dark:text-zinc-200">{person.name}</span>
              <span className="mt-0.5 block min-h-4 truncate text-xs text-zinc-500 dark:text-zinc-400">
                {person.is_manager === 1 ? "Yönetici" : person.title ?? "Giriş yap"}
              </span>
            </span>
          </Link>
        ))}
      </div>
      {people.length === 0 && <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">Aktif kullanıcı bulunamadı.</p>}
    </div>
  );
}
