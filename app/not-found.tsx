import Link from "next/link";

// Bilinmeyen adreslerde (ve `notFound()` çağrılarında) gösterilir. Layout'un
// içinde kalır — header ve sidebar durduğu için kullanıcı kaybolmaz.
const LINKS = [
  { href: "/", label: "Ana sayfa" },
  { href: "/brands", label: "Markalar" },
  { href: "/tasks", label: "Görevler" },
  { href: "/panom", label: "Panom" },
];

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl space-y-4 py-12 text-center">
      <p className="text-5xl font-semibold tabular-nums text-zinc-300 dark:text-zinc-700">
        404
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">Sayfa bulunamadı</h1>
      <p className="text-sm text-zinc-500">
        Aradığın kayıt silinmiş ya da adres yanlış olabilir. Buradan devam edebilirsin:
      </p>
      <div className="flex flex-wrap justify-center gap-2 pt-2">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-md border border-black/10 bg-white px-3 py-1.5 text-sm font-medium transition-colors hover:border-brand-300 hover:text-brand-600 dark:border-white/10 dark:bg-zinc-900 dark:hover:border-brand-800 dark:hover:text-brand-400"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
