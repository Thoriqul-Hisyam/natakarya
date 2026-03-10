"use client";

import { useEffect, useState, useTransition } from "react";
import { 
    LayoutGrid, 
    ChevronRight, 
    Search, 
    Plus, 
    Globe, 
    Lock,
    ChevronDown,
    Building2,
    Calendar,
    Star
} from "lucide-react";
import { 
    Popover, 
    PopoverContent, 
    PopoverTrigger 
} from "@/components/ui/popover";
import { getWorkspaces } from "@/actions/workspace";
import { getRecentBoards } from "@/actions/board";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export function WorkspaceSwitcher() {
    const pathname = usePathname();
    const [workspaces, setWorkspaces] = useState<any[]>([]);
    const [recentBoards, setRecentBoards] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (isOpen) {
            startTransition(async () => {
                try {
                    const [wsData, boardsData] = await Promise.all([
                        getWorkspaces(),
                        getRecentBoards()
                    ]);
                    setWorkspaces(wsData);
                    setRecentBoards(boardsData);
                } catch (error) {
                    console.error("Failed to fetch workspaces/boards", error);
                }
            });
        }
    }, [isOpen]);

    const filteredWorkspaces = workspaces.filter(ws => 
        ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ws.boards.some((b: any) => b.title.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center transition-smooth group relative",
                        isOpen 
                            ? "text-[var(--color-foreground)] bg-[var(--color-primary)]" 
                            : "text-[var(--color-sidebar-foreground)] opacity-50 hover:opacity-100 hover:bg-[rgba(255,255,255,0.1)]"
                    )}
                >
                    <LayoutGrid size={20} strokeWidth={2} />
                    <div className="absolute left-14 bg-[var(--color-sidebar)] text-white text-[10px] py-1.5 px-3 rounded-lg opacity-0 shadow-lg group-hover:opacity-100 transition-smooth pointer-events-none whitespace-nowrap z-[100] border border-[rgba(255,255,255,0.1)]">
                        Workspaces & Boards
                    </div>
                </button>
            </PopoverTrigger>
            <PopoverContent 
                side="right" 
                align="start" 
                sideOffset={12}
                className="w-80 p-0 overflow-hidden bg-[var(--color-card)] border-[var(--color-border)] shadow-2xl rounded-2xl"
            >
                <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-secondary)]/30">
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)]">
                        <Search size={14} className="text-muted-foreground" />
                        <input 
                            type="text" 
                            placeholder="Search workspaces or boards..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-xs w-full"
                        />
                    </div>
                </div>

                <ScrollArea className="h-[400px]">
                    <div className="p-2">
                        {/* Recent Boards Section */}
                        {!searchQuery && recentBoards.length > 0 && (
                            <div className="mb-4">
                                <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Star size={10} />
                                    Recent Boards
                                </div>
                                <div className="space-y-0.5">
                                    {recentBoards.map((board) => (
                                        <Link
                                            key={board.id}
                                            href={`/dashboard/board/${board.id}`}
                                            onClick={() => setIsOpen(false)}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-smooth hover:bg-[var(--color-secondary)]",
                                                pathname.includes(board.id) && "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium"
                                            )}
                                        >
                                            <div 
                                                className="w-2 h-2 rounded-full" 
                                                style={{ background: board.background || "var(--color-primary)" }}
                                            />
                                            <span className="truncate">{board.title}</span>
                                            <span className="ml-auto text-[10px] opacity-40 font-normal truncate max-w-[80px]">
                                                {board.workspace.name}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Workspaces Section */}
                        <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <Building2 size={10} />
                            All Workspaces
                        </div>
                        
                        {isPending && workspaces.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto" />
                            </div>
                        ) : filteredWorkspaces.length === 0 ? (
                            <div className="px-3 py-8 text-center text-xs text-muted-foreground">
                                No workspaces found
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredWorkspaces.map((ws) => (
                                    <div key={ws.id} className="space-y-1">
                                        <Link
                                            href={`/dashboard/workspace/${ws.id}`}
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-[var(--color-secondary)] transition-smooth group"
                                        >
                                            <span className="text-xs font-bold truncate pr-2">{ws.name}</span>
                                            <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-smooth" />
                                        </Link>
                                        <div className="pl-3 space-y-0.5 border-l-2 border-[var(--color-border)] ml-3 mt-1">
                                            {ws.boards.map((board: any) => (
                                                <Link
                                                    key={board.id}
                                                    href={`/dashboard/board/${board.id}`}
                                                    onClick={() => setIsOpen(false)}
                                                    className={cn(
                                                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-smooth hover:bg-[var(--color-secondary)]",
                                                        pathname.includes(board.id) && "text-[var(--color-primary)] font-bold bg-[var(--color-primary)]/5"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-1.5 truncate">
                                                        {board.visibility === "PRIVATE" ? <Lock size={10} className="shrink-0" /> : <Globe size={10} className="shrink-0" />}
                                                        <span className="truncate">{board.title}</span>
                                                    </div>
                                                </Link>
                                            ))}
                                            <Link
                                                href={`/dashboard/workspace/${ws.id}`}
                                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] text-[var(--color-primary)] hover:underline"
                                            >
                                                <Plus size={10} />
                                                Add Board
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </ScrollArea>
                
                <div className="p-2 bg-[var(--color-secondary)]/50 border-t border-[var(--color-border)]">
                    <Link
                        href="/dashboard"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-opacity-90 transition-smooth justify-center shadow-lg"
                    >
                        <Plus size={14} />
                        New Workspace
                    </Link>
                </div>
            </PopoverContent>
        </Popover>
    );
}
