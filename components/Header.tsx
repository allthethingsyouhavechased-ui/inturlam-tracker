import Link from "next/link";
import Logo from "@/components/Logo";
import MobileMenuButton from "@/components/MobileMenuButton";
import NavLinks from "@/components/NavLinks";
import NotificationBell from "@/components/NotificationBell";
import QuickAddModal from "@/components/QuickAddModal";
import SidebarToggle from "@/components/SidebarToggle";
import ThemeToggle from "@/components/ThemeToggle";
import { clearIdentity } from "@/lib/actions/identity";
import { getCurrentPerson } from "@/lib/identity";
import { listBrands } from "@/lib/repositories/brands";
import { listAllContentSummaries } from "@/lib/repositories/content";
import {
  countUnreadForPerson,
  listNotificationsForPerson,
} from "@/lib/repositories/notifications";
import { listActivePeople } from "@/lib/repositories/people";

export default async function Header() {
  const person = await getCurrentPerson();
  const brands = listBrands();
  const contents = listAllContentSummaries();
  const people = listActivePeople();
  const notifications = person ? listNotificationsForPerson(person.id) : [];
  const unreadCount = person ? countUnreadForPerson(person.id) : 0;
  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-white/75 backdrop-blur-xl dark:border-white/5 dark:bg-zinc-950/75">
      <div className="mx-auto flex h-[var(--header-h)] max-w-[1600px] items-center justify-between gap-2 px-3 sm:gap-4 sm:px-4">
        <nav className="flex min-w-0 items-center gap-0.5 text-sm sm:gap-1">
          <MobileMenuButton />
          <SidebarToggle />
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 rounded-xl px-1.5 py-1.5 font-semibold tracking-tight hover:bg-black/5 sm:px-2.5 dark:hover:bg-white/10"
          >
            <Logo className="h-6 w-6 shrink-0" />
            {/* Telefonda logo tek başına yeter; kelime marka sağdaki kimlik
                bloğunu (isim + değiştir + tema) ekran dışına itiyordu. */}
            <span className="hidden sm:inline">İNTURLAM</span>
          </Link>
          <NavLinks />
        </nav>
        <form
          action="/search"
          method="GET"
          className="hidden min-w-0 max-w-xs flex-1 lg:block"
        >
          <input
            type="search"
            name="q"
            placeholder="Marka, içerik, görev ara…"
            className="w-full rounded-xl border border-black/10 bg-white/85 px-3 py-2 text-sm shadow-sm placeholder:text-zinc-500 focus:border-brand-400 focus:outline-none dark:border-white/10 dark:bg-zinc-900/85 dark:placeholder:text-zinc-400"
          />
        </form>
        <div className="flex shrink-0 items-center gap-1 text-sm sm:gap-2">
          <QuickAddModal
            brands={brands}
            contents={contents}
            people={people}
            defaultAssigneeId={person?.id ?? null}
          />
          {person ? (
            <>
              {/* Dar ekranda ismin ortadan bölünmemesi için: iki kelimelik
                  isimler (Yunus Emre) alt satıra kaçıp header'ı yükseltiyordu. */}
              <span className="max-w-16 truncate whitespace-nowrap text-zinc-500 dark:text-zinc-400 sm:max-w-32">
                <span className="hidden sm:inline">Giriş: </span>
                <span className="font-medium text-zinc-800 dark:text-zinc-100">
                  {person.name}
                </span>
              </span>
              <form action={clearIdentity}>
                <button
                  type="submit"
                  className="rounded-lg px-1.5 py-1 text-xs text-zinc-500 hover:bg-black/5 hover:text-zinc-800 sm:px-2 dark:text-zinc-400 dark:hover:bg-white/10"
                >
                  değiştir
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/whoami"
              className="rounded-full bg-brand-600 px-2.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-brand-500 sm:px-4"
              aria-label="Kim olduğunu seç"
            >
              <span className="sm:hidden">Kimlik</span>
              <span className="hidden sm:inline">Sen kimsin?</span>
            </Link>
          )}
          {person && (
            <NotificationBell notifications={notifications} unreadCount={unreadCount} />
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
