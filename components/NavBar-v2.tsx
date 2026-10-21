import { logout } from "@/app/auth/actions";
import { NavLinks } from "@/components/NavLinks";

export function NavBar({ email }: { email: string }) {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-black/80">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-3 px-4">
        <span className="hidden font-semibold tracking-tight sm:inline">SWU Sammlung</span>
        <NavLinks />
        <span className="hidden max-w-48 truncate text-sm text-zinc-500 md:block" title={email}>
          {email}
        </span>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Abmelden
          </button>
        </form>
      </div>
    </header>
  );
}