"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Sammlung" },
  { href: "/search", label: "Suche" },
  { href: "/scan", label: "Scan" },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav aria-label="Hauptnavigation" className="flex flex-1 items-center gap-1 text-sm">
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-md px-2.5 py-1.5 transition-colors ${
              active
                ? "bg-zinc-900 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "hover:bg-zinc-100 dark:hover:bg-zinc-900"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}