"use client";

import { useEffect, useState, useTransition } from "react";
import { 
    LayoutGrid, 
    ChevronRight, 
    Plus, 
    Globe, 
    Lock,
    Building2,
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
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CreateWorkspaceDialog } from "./workspace/create-workspace-dialog";

export function WorkspaceSwitcher() {
    const pathname = usePathname();
    const router = useRouter();
    const [workspaces, setWorkspaces] = useState<any[]>([]);
    const [recentBoards, setRecentBoards] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
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

    return (
        <div className="flex flex-col items-center w-full px-2">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <button
                        className={cn(
                            "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 text-inherit hover:opacity-100",
                            !isOpen && "opacity-40 grayscale hover:grayscale-0 hover:opacity-100",
                            isOpen && "scale-110 z-20"
                        )}
                    >
                        <LayoutGrid size={20} strokeWidth={2.5} />
                    </button>
                </PopoverTrigger>
                <PopoverContent
                    side="top"
                    align="center"
                    sideOffset={20}
                    className="w-[calc(100vw-2rem)] md:w-80 p-0 overflow-hidden bg-[var(--color-card)] border-[var(--color-border)] shadow-2xl rounded-2xl z-[110]"
                >
                    <ScrollArea className="max-h-[80vh]">
                        <div className="p-2 space-y-4">
                            {/* Recent Boards Section */}
                            {recentBoards.length > 0 && (
                                <div className="space-y-2">
                                    <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        <Star size={10} />
                                        Recent Boards
                                    </div>
                                    <div className="space-y-1">
                                        {recentBoards.map((board) => (
                                            <Link
                                                key={board.id}
                                                href={`/dashboard/board/${board.id}`}
                                                onClick={() => setIsOpen(false)}
                                                className={cn(
                                                    "flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-smooth hover:bg-[var(--color-secondary)]",
                                                    pathname.includes(board.id) && "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold"
                                                )}
                                            >
                                                <div 
                                                    className="w-2.5 h-2.5 rounded-full shadow-sm" 
                                                    style={{ background: board.background || "var(--color-primary)" }}
                                                />
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-bold truncate">{board.title}</span>
                                                    <span className="text-[10px] opacity-60 truncate">{board.workspace.name}</span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Workspaces Section */}
                            <div className="space-y-2">
                                <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Building2 size={10} />
                                    Workspaces & Boards
                                </div>
                                
                                {isPending && workspaces.length === 0 ? (
                                    <div className="py-8 flex justify-center">
                                        <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : workspaces.length === 0 ? (
                                    <div className="px-4 py-8 text-center bg-[var(--color-secondary)]/30 rounded-2xl mx-1">
                                        <p className="text-xs text-muted-foreground">No workspaces found</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {workspaces.map((ws) => (
                                            <div key={ws.id} className="space-y-1.5 p-1 bg-[var(--color-secondary)]/20 rounded-2xl">
                                                <Link
                                                    href={`/dashboard/workspace/${ws.id}`}
                                                    onClick={() => setIsOpen(false)}
                                                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[var(--color-secondary)] transition-smooth group"
                                                >
                                                    <span className="text-xs font-black truncate">{ws.name}</span>
                                                    <ChevronRight size={12} className="opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                                </Link>
                                                
                                                {ws.boards && ws.boards.length > 0 && (
                                                    <div className="space-y-0.5 px-1 pb-1">
                                                        {ws.boards.map((board: any) => (
                                                            <Link
                                                                key={board.id}
                                                                href={`/dashboard/board/${board.id}`}
                                                                onClick={() => setIsOpen(false)}
                                                                className={cn(
                                                                    "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-smooth hover:bg-white dark:hover:bg-black/20 hover:shadow-sm",
                                                                    pathname.includes(board.id) && "bg-white dark:bg-black/20 text-[var(--color-primary)] font-bold shadow-sm"
                                                                )}
                                                            >
                                                                {board.visibility === "PRIVATE" ? <Lock size={10} className="opacity-40" /> : <Globe size={10} className="opacity-40" />}
                                                                <span className="truncate">{board.title}</span>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </ScrollArea>
                    
                    <div className="p-2 border-t border-[var(--color-border)] bg-[var(--color-secondary)]/50">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                setShowCreateModal(true);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-3 rounded-xl bg-[var(--color-primary)] text-white text-xs font-black hover:bg-opacity-90 active:scale-[0.98] transition-all justify-center shadow-lg"
                        >
                            <Plus size={14} strokeWidth={3} />
                            New Workspace
                        </button>
                    </div>
                </PopoverContent>
            </Popover>

            <CreateWorkspaceDialog 
                isOpen={showCreateModal} 
                onClose={() => setShowCreateModal(false)} 
                showTrigger={false}
            />
        </div>
    );
}
