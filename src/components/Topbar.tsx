"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function Topbar() {
  const pathname = usePathname();
  const current =
    NAV_ITEMS.find((i) =>
      i.href === "/" ? pathname === "/" : pathname.startsWith(i.href)
    ) ?? NAV_ITEMS[0];

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-5">
        <div>
          <h1 className="text-base font-semibold text-foreground">{current.label}</h1>
          <p className="text-xs text-muted">{current.description}</p>
        </div>
      </div>

      {/* Navegación horizontal en pantallas pequeñas */}
      <nav className="md:hidden flex gap-1 overflow-x-auto px-3 pb-2">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-md px-3 py-1.5 text-xs transition-colors",
                active
                  ? "bg-primary-soft text-primary font-medium"
                  : "text-muted hover:bg-surface-2"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
