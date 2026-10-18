import Link from "next/link";
import { logout } from "@/app/auth/actions";
import { SubmitButton } from "@/components/SubmitButton";

const NAV_ITEMS: { href: string; label: string }[] = [
  { href: "/", label: "Sammlung" },
  { href: "/search", label: "Karten suchen" },
];

const LOGOUT_BUTTON =
  "rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-900 dark:focus-visible:outline-zinc-100";

export function NavBar({ email }: { email: string }) {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-black/80">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-4 px-4">
        <span className="font-semibold tracking-tight">SWU Sammlung</span>
        <nav className="flex flex-1 items-center gap-1 text-sm">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-2.5 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <span
          className="hidden max-w-48 truncate text-sm text-zinc-500 sm:block"
          title={email}
        >
          {email}
        </span>
        <form action={logout}>
          <SubmitButton pendingText="Abmelden …" className={LOGOUT_BUTTON}>
            Abmelden
          </SubmitButton>
        </form>
      </div>
    </header>
  );
}