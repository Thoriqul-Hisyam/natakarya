"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { useEffect, useState } from "react";
import { getWorkspaceById } from "@/actions/workspace";
import { getBoardById } from "@/actions/board";

export function Breadcrumbs() {
  const pathname = usePathname();
  const [segments, setSegments] = useState<{ label: string; href: string }[]>([]);

  useEffect(() => {
    const generateBreadcrumbs = async () => {
      const parts = pathname.split("/").filter(Boolean);
      const breadcrumbs: { label: string; href: string }[] = [];
      let currentHref = "";

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        currentHref += `/${part}`;

        // Human-readable labels
        let label = part.charAt(0).toUpperCase() + part.slice(1);

        // Fetch dynamic labels for IDs
        if (part === "workspace" && i + 1 < parts.length) {
          const workspaceId = parts[i + 1];
          try {
            const ws = await getWorkspaceById(workspaceId);
            if (ws) {
                // We'll skip adding "workspace" as a segment and just show the name next
                continue; 
            }
          } catch {}
        }

        if (part === "board" && i + 1 < parts.length) {
          const boardId = parts[i + 1];
          try {
            const board = await getBoardById(boardId);
            if (board) {
                label = board.workspace.name;
                breadcrumbs.push({ label, href: `/dashboard/workspace/${board.workspaceId}` });
                continue;
            }
          } catch {}
        }

        // If it's a UUID/ID, try to get the real name
        if (part.length > 20) { // Simple check for IDs
             if (parts[i-1] === "workspace") {
                try {
                    const ws = await getWorkspaceById(part);
                    label = ws?.name || "Workspace";
                } catch { label = "Workspace"; }
             } else if (parts[i-1] === "board") {
                try {
                    const board = await getBoardById(part);
                    label = board?.title || "Board";
                } catch { label = "Board"; }
             }
        }

        if (part === "dashboard" && parts.length === 1) {
            label = "Overview";
        }

        breadcrumbs.push({ label, href: currentHref });
      }

      setSegments(breadcrumbs);
    };

    generateBreadcrumbs();
  }, [pathname]);

  if (segments.length <= 1 && pathname === "/dashboard") return null;

  return (
    <nav className="flex items-center gap-1.5 text-xs font-medium mb-6" aria-label="Breadcrumb">
      <Link
        href="/dashboard"
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-smooth"
      >
        <Home size={14} />
      </Link>

      {segments.map((segment, index) => (
        <div key={segment.href} className="flex items-center gap-1.5">
          <ChevronRight size={12} className="text-muted-foreground/50" />
          <Link
            href={segment.href}
            className={index === segments.length - 1 
              ? "text-foreground font-semibold pointer-events-none" 
              : "text-muted-foreground hover:text-foreground transition-smooth"
            }
          >
            {segment.label}
          </Link>
        </div>
      ))}
    </nav>
  );
}
