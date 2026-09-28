"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TABS } from "./BottomNav";

export default function TabNav() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <nav aria-label="Main navigation" className="hidden sm:flex items-center gap-1">
      {TABS.map(({ label, href }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`h-9 px-3 inline-flex items-center rounded-lg text-sm transition-colors ${
              active
                ? "bg-surface-raised text-ink font-semibold"
                : "text-ink-muted hover:text-ink font-medium"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
