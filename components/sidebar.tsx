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
  return (
    <aside
      className="fixed left-0 top-0 bottom-0 w-[72px] hidden lg:flex flex-col items-center py-6 gap-1 z-50 transition-smooth"
      style={{ background: "var(--color-sidebar)" }}
    >
      <SidebarContent />
    </aside>
  );
}

export function SidebarContent() {
  const pathname = usePathname();

  return (
    <>
      {/* Logo */}
      <Link
        href="/dashboard"
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-8 transition-smooth hover:scale-110 shrink-0"
        style={{ background: "var(--color-primary)" }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="25" y="25" width="20" height="20" rx="4" fill="#1a2e35" />
          <rect x="55" y="25" width="20" height="20" rx="4" fill="#1a2e35" opacity="0.2" />
          <rect x="25" y="55" width="20" height="20" rx="4" fill="#1a2e35" opacity="0.2" />
          <rect x="55" y="55" width="20" height="20" rx="4" fill="#1a2e35" opacity="0.6" />
          <path d="M45 45 L55 55" stroke="#1a2e35" strokeWidth="2" strokeDasharray="4 2" />
        </svg>
      </Link>

      <WorkspaceSwitcher />

      {/* Navigation Icons */}
      <nav className="flex flex-col items-center gap-2 flex-1 w-full">
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
              {/* Tooltip - only visible on desktop hover */}
              <div 
                className="absolute left-14 bg-[var(--color-sidebar)] text-white text-[10px] py-1.5 px-3 rounded-lg opacity-0 shadow-lg group-hover:lg:opacity-100 transition-smooth pointer-events-none whitespace-nowrap z-[100] border border-[rgba(255,255,255,0.1)] hidden lg:block"
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
        className="w-11 h-11 rounded-xl flex items-center justify-center text-[var(--color-sidebar-foreground)] opacity-50 hover:opacity-100 hover:bg-[rgba(255,255,255,0.1)] transition-smooth shrink-0"
        title="Settings"
      >
        <Settings size={20} strokeWidth={2} />
      </Link>
    </>
  );
}
