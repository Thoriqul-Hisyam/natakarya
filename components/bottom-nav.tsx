"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  CheckSquare, 
  Calendar, 
  Settings, 
  LayoutDashboard,
  LayoutGrid
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkspaceSwitcher } from "./workspace-switcher";

const navItems = [
  { icon: Home, href: "/dashboard", label: "Home" },
  { icon: CheckSquare, href: "/dashboard/tasks", label: "Tasks" },
  { icon: LayoutGrid, href: null, label: "Boards", component: WorkspaceSwitcher }, 
  { icon: Calendar, href: "/dashboard/calendar", label: "Calendar" },
  { icon: Settings, href: "/dashboard/settings", label: "Settings" },
];

export function BottomNav() {
  const pathname = usePathname();

  // Find active index for the sliding indicator
  const activeIndex = navItems.findIndex(item => {
    if (item.href === "/dashboard") return pathname === "/dashboard";
    if (item.href) return pathname.startsWith(item.href);
    if (item.label === "Boards") return pathname.includes("/board/") || pathname.includes("/workspace/");
    return false;
  });

  return (
    <div className="lg:hidden fixed bottom-6 left-0 right-0 flex justify-center px-4 z-50 pointer-events-none">
      <nav className="relative flex items-center p-2 bg-white/70 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.3)] pointer-events-auto ring-1 ring-black/5">
        
        {/* Sliding Highlight Pill */}
        {activeIndex !== -1 && (
          <div 
            className="absolute h-11 w-11 bg-[var(--color-primary)] rounded-full transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-[0_4px_16px_rgba(var(--color-primary-rgb,0,0,0),0.4)]"
            style={{ 
              transform: `translateX(${activeIndex * 48}px)`,
              left: "8px" // Base padding (p-2 = 8px)
            }}
          >
            <div className="absolute inset-0 rounded-full bg-white/20" />
          </div>
        )}

        {navItems.map((item, idx) => {
          if (item.component) {
            const Component = item.component;
            const isActive = activeIndex === idx;
            return (
              <div key="switcher" className={cn(
                "relative w-11 h-11 flex items-center justify-center mx-[2px] transition-all duration-300 z-10",
                isActive ? "text-[var(--color-primary-foreground)]" : "text-[var(--color-muted-foreground)]"
              )}>
                <Component />
              </div>
            );
          }

          const isActive = activeIndex === idx;
          const Icon = item.icon!;

          return (
            <Link
              key={item.label}
              href={item.href!}
              className={cn(
                "relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-300 mx-[1px] z-10",
                isActive 
                  ? "text-[var(--color-primary-foreground)]" 
                  : "text-[var(--color-muted-foreground)] opacity-50 hover:opacity-100"
              )}
            >
              <div className={cn(
                  "relative z-10 transition-transform duration-500",
                  isActive && "scale-110"
              )}>
                  <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
