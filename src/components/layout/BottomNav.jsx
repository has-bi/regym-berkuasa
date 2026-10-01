"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiActivity, FiUser, FiTrendingUp } from "react-icons/fi";

export const TABS = [
  { label: "Lift", href: "/log", icon: FiActivity },
  { label: "Body", href: "/body", icon: FiUser },
  { label: "Report", href: "/summary", icon: FiTrendingUp },
];

export default function BottomNav() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <nav
      aria-label="Main navigation"
      className="sm:hidden fixed inset-x-0 bottom-0 z-30 bg-surface/95 backdrop-blur
                 border-t border-line pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-3">
        {TABS.map(({ label, href, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-1 h-16 transition-colors ${
                active ? "text-ink" : "text-ink-faint"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
              <span className={`text-[11px] leading-none ${active ? "font-semibold" : "font-medium"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
