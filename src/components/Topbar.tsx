"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { logout } from "@/app/login/actions";

export function Topbar({ user }: { user?: string | null }) {
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

        {user && (
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted sm:inline" title={user}>
              {user}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </form>
          </div>
        )}
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
