"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold">
          Q
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-foreground">JPQC</p>
          <p className="text-[11px] text-muted">Calidad analítica</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-start gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary-soft text-primary font-medium"
                  : "text-muted hover:bg-surface-2 hover:text-foreground"
              )}
            >
              <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0" />
              <span className="flex flex-col">
                <span>{item.label}</span>
                <span className="text-[11px] text-muted group-hover:text-muted">
                  {item.description}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-3 border-t border-border text-[11px] text-muted">
        v0.1 · Control de calidad interno y externo
      </div>
    </aside>
  );
}
