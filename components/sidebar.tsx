"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutDashboard,
  CheckSquare,
  BarChart3,
  Calendar,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkspaceSwitcher } from "./workspace-switcher";

const sidebarItems = [
  { icon: CheckSquare, href: "/dashboard/tasks", label: "Tasks" },
  { icon: BarChart3, href: "/dashboard/stats", label: "Stats" },
  { icon: Calendar, href: "/dashboard/calendar", label: "Calendar" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 w-[72px] flex flex-col items-center py-6 gap-1 z-50"
      style={{ background: "var(--color-sidebar)" }}
    >
      {/* Logo */}
      <Link
        href="/dashboard"
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-8 transition-smooth hover:scale-110"
        style={{ background: "var(--color-primary)" }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#1a2e35"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      </Link>

      <WorkspaceSwitcher />

      {/* Navigation Icons */}
      <nav className="flex flex-col items-center gap-2 flex-1">
        {sidebarItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center transition-smooth group relative",
                isActive
                  ? "text-[var(--color-foreground)]"
                  : "text-[var(--color-sidebar-foreground)] opacity-50 hover:opacity-100 hover:bg-[rgba(255,255,255,0.1)]"
              )}
              style={isActive ? { background: "var(--color-primary)" } : {}}
            >
              <Icon size={20} strokeWidth={2} />
              {/* Tooltip */}
              <div 
                className="absolute left-14 bg-[var(--color-sidebar)] text-white text-[10px] py-1.5 px-3 rounded-lg opacity-0 shadow-lg group-hover:opacity-100 transition-smooth pointer-events-none whitespace-nowrap z-[100] border border-[rgba(255,255,255,0.1)]"
              >
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Settings at bottom */}
      <Link
        href="/dashboard/settings"
        className="w-11 h-11 rounded-xl flex items-center justify-center text-[var(--color-sidebar-foreground)] opacity-50 hover:opacity-100 hover:bg-[rgba(255,255,255,0.1)] transition-smooth"
        title="Settings"
      >
        <Settings size={20} strokeWidth={2} />
      </Link>
    </aside>
  );
}
