"use client";

import { useState, useMemo, useEffect } from "react";
import {
  DragDropContext,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { ListContainer } from "./list-container";
import { AddListForm } from "./add-list-form";
import { CardDetailModal } from "./card-detail-modal";
import { CreateTaskModal } from "@/components/modals/create-task-modal";
import { LabelManager } from "./label-manager";
import { BoardMembersModal } from "./board-members-modal";
import { BoardSettingsModal } from "./board-settings-modal";
import { moveCard } from "@/actions/card";
import { reorderLists } from "@/actions/list";
import { toast } from "sonner";
import {
  Search,
  SlidersHorizontal,
  Plus,
  Star,
  Settings,
  Users,
  Share2,
  ChevronDown,
  Tag,
  Paperclip,
  MessageSquare,
} from "lucide-react";
import { toggleFavorite } from "@/actions/board";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

// Column color mapping
const COLUMN_COLORS: Record<string, string> = {
  "To Do": "var(--color-column-todo)",
  "In Progress": "var(--color-column-progress)",
  "In Review": "var(--color-column-review)",
  Completed: "var(--color-column-done)",
};

const COLUMN_DOTS: Record<string, string> = {
  "To Do": "#f87171",
  "In Progress": "#fb923c",
  "In Review": "#22d3ee",
  Completed: "#a78bfa",
};

function getColumnColor(title: string): string {
  return COLUMN_COLORS[title] || "var(--color-secondary)";
}

function getColumnDot(title: string): string {
  return COLUMN_DOTS[title] || "var(--color-muted-foreground)";
}

interface BoardViewProps {
  board: any;
}

import { SearchFilter } from "./search-filter";
import { pusherClient } from "@/lib/pusher-client";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function BoardView({ board: initialBoard }: BoardViewProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [board, setBoard] = useState(initialBoard);
  
  // Sync state when new props arrive (e.g. from router.refresh)
  useEffect(() => {
    setBoard(initialBoard);
  }, [initialBoard]);

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    labels: [] as string[],
    assignees: [] as string[],
    dueDate: null as string | null,
  });
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [showLabelManager, setShowLabelManager] = useState(false);
  const [isBoardMembersModalOpen, setIsBoardMembersModalOpen] = useState(false);
  const [isBoardSettingsModalOpen, setIsBoardSettingsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Board");
  
  const currentMember = board.workspace.members.find(
    (m: any) => m.userId === session?.user?.id
  );
  const role = currentMember?.role || "VIEWER";
  
  const isOwner = role === "OWNER";
  const isAdmin = role === "ADMIN";
  const isMember = role === "MEMBER";
  const isViewer = role === "VIEWER";
  
  const canManageBoard = isOwner || isAdmin;
  const canEditBoard = isOwner || isAdmin || isMember;

  const isFavorite = board.favorites?.length > 0;
  
  const membersToDisplay = board.visibility === "PRIVATE" ? (board.members || []) : (board.workspace.members || []);

  const memoizedLists = useMemo(
    () => board.lists.map((l: any) => ({ id: l.id, title: l.title })),
    [board.lists]
  );

  // Real-time synchronization
  useEffect(() => {
    const channelName = `board-${board.id}`;
    const channel = pusherClient.subscribe(channelName);
    
    channel.bind("board-updated", () => {
      router.refresh();
    });

    return () => {
      pusherClient.unsubscribe(channelName);
    };
  }, [board.id, router]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, type } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    // List reorder
    if (type === "list") {
      const newLists = [...board.lists];
      const [moved] = newLists.splice(source.index, 1);
      newLists.splice(destination.index, 0, moved);

      setBoard({ ...board, lists: newLists });

      try {
        await reorderLists(
          board.id,
          newLists.map((l: any) => l.id)
        );
      } catch {
        toast.error("Failed to reorder lists");
        setBoard(initialBoard);
      }
      return;
    }

    // Card move
    const sourceList = board.lists.find(
      (l: any) => l.id === source.droppableId
    );
    const destList = board.lists.find(
      (l: any) => l.id === destination.droppableId
    );

    if (!sourceList || !destList) return;

    // Optimistic update
    const newLists = board.lists.map((list: any) => ({
      ...list,
      cards: [...list.cards],
    }));

    const srcListIndex = newLists.findIndex(
      (l: any) => l.id === source.droppableId
    );
    const destListIndex = newLists.findIndex(
      (l: any) => l.id === destination.droppableId
    );

    const [movedCard] = newLists[srcListIndex].cards.splice(source.index, 1);
    newLists[destListIndex].cards.splice(destination.index, 0, movedCard);

    setBoard({ ...board, lists: newLists });

    try {
      await moveCard({
        cardId: movedCard.id,
        sourceListId: source.droppableId,
        destListId: destination.droppableId,
        newPosition: destination.index,
        boardId: board.id,
      });
    } catch {
      toast.error("Failed to move card");
      setBoard(initialBoard);
    }
  };

  const handleFavorite = async () => {
    try {
      await toggleFavorite(board.id);
      setBoard({
        ...board,
        favorites: isFavorite ? [] : [{ id: "temp" }],
      });
    } catch {
      toast.error("Failed to update favorite");
    }
  };

  return (
    <div 
      className="h-[calc(100vh-7rem)] -mx-4 -my-4 px-4 py-4 rounded-xl"
      style={{ background: board.background || "transparent" }}
    >
      {/* Project Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold">{board.title}</h1>
            <div
              className="flex items-center gap-2 text-sm mt-0.5"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              <span>{board.workspace.name}</span>
              <span>·</span>
              <span
                className="py-0.5 px-2 rounded-full text-xs font-medium"
                style={{
                  background: "#d4edda",
                  color: "var(--color-success)",
                }}
              >
                In Progress
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Team avatars */}
            <div className="flex -space-x-2">
              {membersToDisplay.slice(0, 4).map((m: any) => (
                <div
                  key={m.id}
                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-semibold"
                  style={{
                    borderColor: "var(--color-background)",
                    background: "var(--color-muted)",
                    color: "var(--color-muted-foreground)",
                  }}
                  title={m.user.name || "User"}
                >
                  {m.user.image ? (
                    <img
                      src={m.user.image}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    (m.user.name?.charAt(0) || "?").toUpperCase()
                  )}
                </div>
              ))}
              {membersToDisplay.length > 4 && (
                <div
                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium"
                  style={{
                    borderColor: "var(--color-background)",
                    background: "var(--color-secondary)",
                    color: "var(--color-muted-foreground)",
                  }}
                >
                  +{membersToDisplay.length - 4}
                </div>
              )}
            </div>

            <button
              onClick={handleFavorite}
              className="p-2 rounded-xl transition-smooth hover:bg-[var(--color-secondary)] cursor-pointer"
            >
              <Star
                size={16}
                fill={isFavorite ? "var(--color-primary)" : "none"}
                color={isFavorite ? "var(--color-primary)" : "var(--color-muted-foreground)"}
              />
            </button>

            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Board link copied to clipboard");
              }}
              className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-sm transition-smooth hover:bg-[var(--color-secondary)] cursor-pointer"
              style={{ color: "var(--color-muted-foreground)" }}>
              <Share2 size={14} />
              Share
            </button>

            {canManageBoard && (
              <>
                <button 
                  onClick={() => setIsBoardSettingsModalOpen(true)}
                  className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-sm transition-smooth cursor-pointer"
                  style={{ 
                    background: "var(--color-card)",
                    color: "var(--color-muted-foreground)",
                  }}>
                  <Settings size={14} />
                  Settings
                </button>

                {board.visibility === "PRIVATE" ? (
                  <button 
                    onClick={() => setIsBoardMembersModalOpen(true)}
                    className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-sm transition-smooth hover:bg-[var(--color-secondary)] cursor-pointer"
                    style={{ color: "var(--color-muted-foreground)" }}>
                    <Users size={14} />
                    Manage Members
                  </button>
                ) : (
                  <Link 
                    href={`/dashboard/workspace/${board.workspace.id}/settings`}
                    className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-sm transition-smooth hover:bg-[var(--color-secondary)] cursor-pointer"
                    style={{ color: "var(--color-muted-foreground)" }}>
                    <Users size={14} />
                    Invite People
                  </Link>
                )}
              </>
            )}
          </div>
        </div>

        {/* Sub tabs */}
        <div className="flex items-center gap-1 mb-4">
          {["Overview", "List", "Board", "Calendar", "Documents", "Messages"].map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="py-1.5 px-4 rounded-full text-sm font-medium transition-smooth cursor-pointer"
                style={{
                  background:
                    tab === activeTab ? "var(--color-primary)" : "transparent",
                  color:
                    tab === activeTab
                      ? "var(--color-primary-foreground)"
                      : "var(--color-muted-foreground)",
                }}
              >
                {tab}
              </button>
            )
          )}
        </div>

        {/* Board toolbar - Visible only for Board and List views */}
        {(activeTab === "Board" || activeTab === "List") && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-2 py-2 px-3 rounded-xl text-sm"
                style={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <Search size={14} style={{ color: "var(--color-muted-foreground)" }} />
                <input
                  type="text"
                  placeholder="Search task"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent outline-none text-sm w-40"
                />
              </div>
              <button className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-sm transition-smooth hover:bg-[var(--color-card)] cursor-pointer"
                style={{ color: "var(--color-muted-foreground)" }}>
                Sort by
                <ChevronDown size={14} />
              </button>
              <SearchFilter 
                filters={filters}
                setFilters={setFilters}
                availableLabels={board.labels}
                availableMembers={board.workspace.members}
              />
              {canEditBoard && (
                <div className="relative">
                  <button
                    onClick={() => setShowLabelManager(!showLabelManager)}
                    className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-sm transition-smooth hover:bg-[var(--color-card)] cursor-pointer"
                    style={{ color: "var(--color-muted-foreground)" }}
                  >
                    <Tag size={14} />
                    Labels
                  </button>
                  {showLabelManager && (
                    <LabelManager
                      boardId={board.id}
                      labels={board.labels}
                      onClose={() => setShowLabelManager(false)}
                      role={role}
                    />
                  )}
                </div>
              )}
            </div>

            {canEditBoard && (
              <button
                onClick={() => setIsTaskModalOpen(true)}
                className="flex items-center gap-2 py-2 px-4 rounded-xl font-semibold text-sm transition-smooth hover:opacity-90 active:scale-[0.98] cursor-pointer"
                style={{
                  background: "var(--color-foreground)",
                  color: "var(--color-card)",
                }}
              >
                <Plus size={14} />
                Add New Task
              </button>
            )}
          </div>
        )}
      </div>

      {/* View Content */}
      <div className="h-[calc(100%-180px)] overflow-hidden">
        {activeTab === "Board" && (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable 
              droppableId="board" 
              type="list" 
              direction="horizontal"
              isDropDisabled={isViewer}
            >
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="kanban-scroll flex gap-4 pb-4 h-full"
                >
                  {board.lists.map((list: any, index: number) => (
                      <ListContainer
                        key={list.id}
                        list={list}
                        index={index}
                        boardId={board.id}
                        columnColor={getColumnColor(list.title)}
                        dotColor={getColumnDot(list.title)}
                        labels={board.labels}
                        members={board.workspace.members}
                        onCardClick={(cardId: string) => setSelectedCardId(cardId)}
                        searchQuery={searchQuery}
                        filters={filters}
                        role={role}
                      />
                  ))}
                  {provided.placeholder}
                  {canManageBoard && <AddListForm boardId={board.id} />}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}

        {activeTab === "List" && (
          <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] overflow-hidden h-full flex flex-col">
            <div className="overflow-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-secondary)]/30">
                    <th className="p-4 text-sm font-semibold">Title</th>
                    <th className="p-4 text-sm font-semibold">List</th>
                    <th className="p-4 text-sm font-semibold">Members</th>
                    <th className="p-4 text-sm font-semibold">Labels</th>
                    <th className="p-4 text-sm font-semibold">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {board.lists.flatMap((l: any) => l.cards).map((card: any) => (
                    <tr 
                      key={card.id} 
                      className="border-b border-[var(--color-border)] hover:bg-[var(--color-secondary)]/10 cursor-pointer transition-smooth"
                      onClick={() => setSelectedCardId(card.id)}
                    >
                      <td className="p-4 text-sm font-medium">{card.title}</td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {board.lists.find((l: any) => l.id === card.listId)?.title}
                      </td>
                      <td className="p-4 text-sm">
                        <div className="flex -space-x-1.5">
                          {card.members?.map((cm: any) => (
                            <div key={cm.id} className="w-6 h-6 rounded-full border border-card flex items-center justify-center text-[10px]" style={{ background: "var(--color-muted)" }}>
                              {cm.user.image ? <img src={cm.user.image} className="w-full h-full rounded-full" /> : cm.user.name?.charAt(0)}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-sm">
                        <div className="flex gap-1 flex-wrap">
                          {card.labels?.map((cl: any) => (
                            <span key={cl.id} className="w-2 h-2 rounded-full" style={{ background: cl.label.color }} />
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {card.dueDate ? new Date(card.dueDate).toLocaleDateString() : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "Calendar" && (
          <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] h-full p-6 overflow-auto">
             <div className="grid grid-cols-7 gap-2 h-full min-h-[600px]">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                  <div key={day} className="text-center text-xs font-bold text-muted-foreground py-2 border-b border-[var(--color-border)] uppercase tracking-wider">{day}</div>
                ))}
                {(() => {
                  const today = new Date();
                  const startOfMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);
                  const firstDayOfWeek = startOfMonthDate.getDay();
                  
                  const days = [];
                  const prevMonthLastDay = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
                  
                  // Fill previous month days
                  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
                    days.push({
                      date: new Date(today.getFullYear(), today.getMonth() - 1, prevMonthLastDay - i),
                      currentMonth: false
                    });
                  }
                  
                  // Current month days
                  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                  for (let i = 1; i <= lastDayOfMonth; i++) {
                    days.push({
                      date: new Date(today.getFullYear(), today.getMonth(), i),
                      currentMonth: true
                    });
                  }
                  
                  // Fill next month days (total 42 cells for 6 weeks)
                  const remaining = 42 - days.length;
                  for (let i = 1; i <= remaining; i++) {
                    days.push({
                      date: new Date(today.getFullYear(), today.getMonth() + 1, i),
                      currentMonth: false
                    });
                  }
                  
                  return days.map((dayObj, i) => {
                    const { date, currentMonth } = dayObj;
                    const dateStr = date.toISOString().split("T")[0];
                    const dayTasks = board.lists.flatMap((l: any) => l.cards).filter((c: any) => 
                      c.dueDate && new Date(c.dueDate).toISOString().split("T")[0] === dateStr
                    );
                    
                    const isToday = date.toDateString() === today.toDateString();

                    return (
                      <div key={i} className={cn(
                        "min-h-[120px] border border-[var(--color-border)]/30 rounded-lg p-2 transition-smooth flex flex-col",
                        currentMonth ? "bg-[var(--color-secondary)]/5" : "bg-[var(--color-secondary)]/2 opacity-40",
                        isToday && "border-[var(--color-primary)] ring-1 ring-[var(--color-primary)] ring-inset shadow-sm"
                      )}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={cn(
                            "text-[10px] font-bold",
                            isToday ? "text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-1.5 py-0.5 rounded" : "text-muted-foreground"
                          )}>{date.getDate()}</span>
                        </div>
                        <div className="space-y-1 overflow-y-auto flex-1 max-h-[90px] kanban-scroll pr-0.5">
                           {dayTasks.map((task: any) => (
                             <div 
                               key={task.id} 
                               onClick={() => setSelectedCardId(task.id)}
                               className="text-[9px] p-1.5 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm truncate cursor-pointer hover:border-[var(--color-primary)] hover:translate-x-0.5 transition-all truncate"
                               title={task.title}
                             >
                               <div className="flex items-center gap-1">
                                 <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] shrink-0" />
                                 <span className="truncate">{task.title}</span>
                               </div>
                             </div>
                           ))}
                        </div>
                      </div>
                    );
                  });
                })()}
             </div>
          </div>
        )}

        {activeTab === "Overview" && (
          <div className="h-full overflow-auto space-y-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-sm">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Tasks</h3>
                <p className="text-3xl font-bold">{board.lists.reduce((acc: number, l: any) => acc + l.cards.length, 0)}</p>
              </div>
              <div className="p-6 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-sm">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Active Lists</h3>
                <p className="text-3xl font-bold">{board.lists.length}</p>
              </div>
              <div className="p-6 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-sm">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Members</h3>
                <p className="text-3xl font-bold">{membersToDisplay.length}</p>
              </div>
            </div>
            
            <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6">
               <h3 className="text-lg font-bold mb-4">Description</h3>
               <p className="text-sm text-muted-foreground">
                 This is a {board.visibility.toLowerCase()} board for {board.workspace.name}. 
                 Manage your project tasks, schedules, and team collaboration here.
               </p>
            </div>
          </div>
        )}

        {activeTab === "Documents" && (
          <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] h-full p-6 overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {board.lists.flatMap((l: any) => l.cards).flatMap((c: any) => c.attachments || []).map((att: any) => (
                 <a key={att.id} href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-secondary)]/10 transition-smooth">
                    <div className="w-10 h-10 rounded-lg bg-[var(--color-secondary)] flex items-center justify-center">
                       <Paperclip size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                       <p className="text-sm font-medium truncate">{att.name}</p>
                       <p className="text-xs text-muted-foreground">{(att.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                 </a>
              ))}
              {board.lists.flatMap((l: any) => l.cards).reduce((acc: number, c: any) => acc + (c.attachments?.length || 0), 0) === 0 && (
                <div className="col-span-full py-20 text-center">
                   <Paperclip size={48} className="mx-auto text-muted-foreground mb-4 opacity-20" />
                   <p className="text-muted-foreground text-sm">No documents found in this board.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "Messages" && (
          <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] h-full p-6 overflow-auto">
             <div className="space-y-6 max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-4 border-b border-[var(--color-border)] pb-4">
                  <div>
                    <h3 className="text-xl font-bold">Board Discussion</h3>
                    <p className="text-sm text-muted-foreground">Aggregated card comments and conversations</p>
                  </div>
                  <span className="text-xs font-medium py-1 px-2.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                    {board.lists.flatMap((l: any) => l.cards).reduce((acc: number, c: any) => acc + (c.comments?.length || 0), 0)} Messages
                  </span>
                </div>
                <div className="space-y-5">
                  {board.lists
                    .flatMap((l: any) => l.cards)
                    .flatMap((c: any) => c.comments?.map((com: any) => ({ ...com, cardTitle: c.title, cardId: c.id })) || [])
                    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((comment: any) => (
                    <div key={comment.id} className="group flex gap-4 p-4 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm hover:shadow-md transition-all">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-secondary)] flex items-center justify-center text-sm font-bold shrink-0 border border-[var(--color-border)]">
                        {comment.user.image ? (
                          <img src={comment.user.image} alt={comment.user.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          comment.user.name?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[var(--color-foreground)]">{comment.user.name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <button 
                          onClick={() => setSelectedCardId(comment.cardId)}
                          className="text-[10px] text-[var(--color-primary)] font-medium mb-2 hover:underline inline-block"
                        >
                          on {comment.cardTitle}
                        </button>
                        <div 
                          className="text-sm bg-[var(--color-secondary)]/30 p-3 rounded-xl text-[var(--color-foreground)]/90 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: comment.content }}
                        />
                      </div>
                    </div>
                  ))}
                  {board.lists.flatMap((l: any) => l.cards).reduce((acc: number, c: any) => acc + (c.comments?.length || 0), 0) === 0 && (
                    <div className="text-center py-20 flex flex-col items-center">
                       <div className="w-16 h-16 rounded-full bg-[var(--color-secondary)]/20 flex items-center justify-center mb-4">
                        <MessageSquare size={32} className="text-muted-foreground opacity-30" />
                       </div>
                       <h4 className="text-lg font-semibold mb-1">No Discussion Yet</h4>
                       <p className="text-muted-foreground text-sm max-w-[250px] mx-auto">
                         Comments added to cards will appear here in a board-wide discussion feed.
                       </p>
                    </div>
                  )}
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Card Detail Modal */}
      {selectedCardId && (
        <CardDetailModal
          cardId={selectedCardId}
          boardId={board.id}
          labels={board.labels}
          members={board.workspace.members}
          onClose={() => setSelectedCardId(null)}
          role={role}
        />
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        boardId={board.id}
        lists={memoizedLists}
      />

      {/* Board Members Modal (For Private Boards) */}
      {isBoardMembersModalOpen && (
        <BoardMembersModal
          board={board}
          isOpen={isBoardMembersModalOpen}
          onClose={() => setIsBoardMembersModalOpen(false)}
        />
      )}

      {/* Board Settings Modal */}
      {isBoardSettingsModalOpen && (
        <BoardSettingsModal
          board={board}
          isOpen={isBoardSettingsModalOpen}
          onClose={() => setIsBoardSettingsModalOpen(false)}
        />
      )}
    </div>
  );
}
