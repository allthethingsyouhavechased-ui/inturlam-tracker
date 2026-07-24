import Link from "next/link";
import MobileMenuButton from "@/components/MobileMenuButton";
import NavLinks from "@/components/NavLinks";
import QuickAddModal from "@/components/QuickAddModal";
import { clearIdentity } from "@/lib/actions/identity";
import { getCurrentPerson } from "@/lib/identity";
import { listBrands } from "@/lib/repositories/brands";
import { listAllContentSummaries } from "@/lib/repositories/content";
import { listActivePeople } from "@/lib/repositories/people";

export default async function Header() {
  const person = await getCurrentPerson();
  const brands = listBrands();
  const contents = listAllContentSummaries();
  const people = listActivePeople();
  return (
    <header className="sticky top-0 z-10 border-b border-black/10 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-zinc-950/80">
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <nav className="flex items-center gap-1 text-sm">
          <MobileMenuButton />
          <Link
            href="/"
            className="rounded-md px-2.5 py-1.5 font-semibold tracking-tight hover:bg-black/5 dark:hover:bg-white/10"
          >
            İNTURLAM
          </Link>
          <NavLinks />
        </nav>
        <div className="flex items-center gap-2 text-sm">
          <QuickAddModal
            brands={brands}
            contents={contents}
            people={people}
            defaultAssigneeId={person?.id ?? null}
          />
          {person ? (
            <>
              <span className="text-zinc-500">
                <span className="hidden sm:inline">Giriş: </span>
                <span className="font-medium text-zinc-800 dark:text-zinc-100">
                  {person.name}
                </span>
              </span>
              <form action={clearIdentity}>
                <button
                  type="submit"
                  className="rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-black/5 hover:text-zinc-800 dark:hover:bg-white/10"
                >
                  değiştir
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/whoami"
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
            >
              Sen kimsin?
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
