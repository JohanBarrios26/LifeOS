"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/reporte", label: "Reporte" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Principal" className="mx-auto flex w-full max-w-md items-center justify-between px-4 pt-6">
      <span className="text-xs font-semibold tracking-widest text-zinc-500 dark:text-zinc-400">LIFEOS</span>
      <div className="flex gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-white shadow-sm dark:bg-zinc-950"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
