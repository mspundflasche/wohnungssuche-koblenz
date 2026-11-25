"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Angebote" },
  { href: "/lernstand", label: "Lernstand" },
  { href: "/suchprofil", label: "Suchprofil" },
];

export function Header({ email, demo }: { email: string; demo: boolean }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" || pathname.startsWith("/angebot") : pathname.startsWith(href));

  return (
    <header className="border-b border-linie bg-papier">
      {demo && (
        <p className="bg-schiefer px-5 py-1.5 text-center text-sm text-white">
          Demo-Modus mit erfundenen Beispieldaten – Änderungen werden nicht gespeichert.
        </p>
      )}
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-8 gap-y-2 px-5 py-3">
        <Link href="/" className="font-cond text-xl font-semibold tracking-tight text-schiefer">
          Wohnungssuche Koblenz
        </Link>
        <nav aria-label="Hauptnavigation" className="flex gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`rounded-md px-3 py-1.5 text-[0.95rem] font-medium ${
                isActive(item.href) ? "bg-rhein-hell text-rhein-dunkel" : "text-schiefer-2 hover:bg-kalk hover:text-schiefer"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm text-schiefer-2">
          <span className="hidden sm:inline">{email}</span>
          {!demo && (
            <form action="/auth/signout" method="post">
              <button type="submit" className="rounded-md px-2 py-1 font-medium text-rhein hover:bg-kalk">
                Abmelden
              </button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}
