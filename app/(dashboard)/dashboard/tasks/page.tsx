"use client";

import { useState, useEffect } from "react";
import { getMyTasks, getMyTaskStats } from "@/actions/task";
import Link from "next/link";
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  CalendarDays,
  ChevronRight,
  Layers,
  LayoutDashboard,
  Filter,
  MessageSquare,
  ListChecks,
  Briefcase,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";

type FilterType = "all" | "overdue" | "dueSoon" | "completed";

const FILTERS: { key: FilterType; label: string; icon: any; color: string }[] = [
  { key: "all", label: "All Tasks", icon: Layers, color: "var(--color-info)" },
  { key: "overdue", label: "Overdue", icon: AlertTriangle, color: "var(--color-destructive)" },
  { key: "dueSoon", label: "Due Soon", icon: Clock, color: "var(--color-warning)" },
  { key: "completed", label: "Completed", icon: CheckSquare, color: "var(--color-success)" },
];

export default function TasksPage() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [data, setData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([getMyTasks(filter), getMyTaskStats()]).then(([taskData, statsData]) => {
      setData(taskData);
      setStats(statsData);
      setLoading(false);
    });
  }, [filter]);

  const getListColor = (listTitle: string) => {
    const colors: Record<string, string> = {
      "To Do": "#f87171",
      "In Progress": "#fb923c",
      "In Review": "#22d3ee",
      Completed: "#a78bfa",
    };
    return colors[listTitle] || "#94a3b8";
  };

  return (
    <div className="py-4 md:py-8">
      {/* Header */}
      <div className="mb-10 fade-in">
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--color-foreground)" }}>
          My Tasks
        </h1>
        <p className="text-sm mt-1.5" style={{ color: "var(--color-muted-foreground)" }}>
          Manage and track all your assignments in one place.
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10 fade-in stagger-1">
          {[
            { label: "Total Tasks", value: stats.total, icon: Layers, color: "var(--color-info)", bg: "var(--color-column-review)" },
            { label: "In Progress", value: stats.inProgress, icon: Clock, color: "var(--color-warning)", bg: "var(--color-column-progress)" },
            { label: "Overdue", value: stats.overdue, icon: AlertTriangle, color: "var(--color-destructive)", bg: "var(--color-column-todo)" },
            { label: "Completed", value: stats.completed, icon: CheckSquare, color: "var(--color-success)", bg: "var(--color-column-done)" },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={cn(
                "rounded-2xl p-6 transition-smooth group hover:scale-[1.02]",
                `stagger-${i + 1}`
              )}
              style={{
                background: "var(--color-card)",
                boxShadow: "var(--shadow-card)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-smooth group-hover:rotate-6"
                  style={{ background: stat.bg }}
                >
                  <stat.icon size={22} style={{ color: stat.color }} />
                </div>
                <span className="text-3xl font-black opacity-10 select-none">0{i + 1}</span>
              </div>
              <p className="text-3xl font-bold tracking-tight" style={{ color: "var(--color-foreground)" }}>
                {stat.value}
              </p>
              <p className="text-xs font-semibold uppercase tracking-wider mt-1 opacity-70" style={{ color: "var(--color-muted-foreground)" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2 fade-in stagger-2 no-scrollbar">
        <div className="p-2 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm">
          <Filter size={16} className="text-[var(--color-muted-foreground)]" />
        </div>
        <div className="flex items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "flex items-center gap-2 py-2.5 px-5 rounded-xl text-sm font-semibold transition-smooth whitespace-nowrap cursor-pointer border",
                filter === f.key 
                  ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] border-[var(--color-primary)] shadow-md translate-y-[-1px]" 
                  : "bg-[var(--color-card)] text-[var(--color-muted-foreground)] border-[var(--color-border)] hover:bg-[var(--color-secondary)]"
              )}
            >
              <f.icon size={15} />
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-32 fade-in">
          <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium animate-pulse text-[var(--color-muted-foreground)]">Fetching your tasks...</p>
        </div>
      )}

      {/* Task List */}
      {!loading && data && (
        <div className="fade-in stagger-3">
          {data.cards.length === 0 ? (
            <div
              className="rounded-3xl p-16 text-center border-2 border-dashed border-[var(--color-border)]"
              style={{ background: "var(--color-card)" }}
            >
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 bg-[var(--color-column-progress)]"
              >
                <CheckSquare size={32} className="text-[var(--color-warning)]" />
              </div>
              <h3 className="text-xl font-bold mb-2">Workspace at peace</h3>
              <p className="text-sm max-w-xs mx-auto text-[var(--color-muted-foreground)]">
                {filter === "all"
                  ? "You don't have any tasks assigned in this filter yet. Great job staying organized!"
                  : `No ${filter === "overdue" ? "overdue" : filter === "dueSoon" ? "upcoming" : "completed"} tasks found right now.`}
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {Object.values(data.grouped).map((wsGroup: any, wsIndex) => (
                <div key={wsGroup.workspace.id} className={cn("fade-in", `stagger-${wsIndex + 1}`)}>
                  {/* Workspace Header */}
                  <div className="flex items-center gap-3 mb-5 px-1">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center bg-[var(--color-sidebar)] text-white shadow-lg"
                    >
                      <Briefcase size={16} />
                    </div>
                    <div>
                        <h2 className="text-sm font-extrabold uppercase tracking-[0.2em] text-[var(--color-muted-foreground)] opacity-60">Workspace</h2>
                        <span className="text-lg font-bold text-[var(--color-foreground)]">{wsGroup.workspace.name}</span>
                    </div>
                  </div>

                  <div className="grid gap-6">
                    {Object.values(wsGroup.boards).map((boardGroup: any) => (
                      <div
                        key={boardGroup.board.id}
                        className="rounded-3xl overflow-hidden border border-[var(--color-border)] shadow-sm bg-[var(--color-card)]"
                      >
                        {/* Board Header */}
                        <Link
                          href={`/dashboard/board/${boardGroup.board.id}`}
                          className="flex items-center justify-between px-6 py-4 transition-smooth hover:bg-[var(--color-background)] group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[var(--color-secondary)] flex items-center justify-center group-hover:bg-[var(--color-primary)] transition-smooth">
                                <LayoutDashboard size={18} className="text-[var(--color-foreground)]" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base group-hover:text-[var(--color-primary-foreground)] transition-smooth">
                                    {boardGroup.board.title}
                                </h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
                                    <span className="text-[11px] font-semibold text-[var(--color-muted-foreground)]">
                                        {boardGroup.tasks.length} Active Task{boardGroup.tasks.length !== 1 ? "s" : ""}
                                    </span>
                                </div>
                            </div>
                          </div>
                          <div className="w-8 h-8 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted-foreground)] group-hover:text-[var(--color-foreground)] group-hover:border-[var(--color-foreground)] transition-smooth">
                            <ChevronRight size={16} />
                          </div>
                        </Link>

                        {/* Tasks */}
                        <div className="grid divide-y divide-[var(--color-border)]">
                          {boardGroup.tasks.map((task: any) => {
                            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.list.title !== "Completed";
                            const listColor = getListColor(task.list.title);
                            
                            return (
                              <Link
                                key={task.id}
                                href={`/dashboard/board/${boardGroup.board.id}`}
                                className="flex flex-col md:flex-row md:items-center gap-4 px-6 py-5 transition-smooth hover:bg-[var(--color-secondary)]/30 group relative"
                              >
                                {/* Left Accent Border */}
                                <div 
                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 rounded-r-full transition-smooth group-hover:h-12"
                                    style={{ background: listColor }}
                                />

                                {/* Task Title & Status */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 mb-1.5">
                                    <span className="text-base font-bold truncate group-hover:translate-x-1 transition-smooth">
                                        {task.title}
                                    </span>
                                    {task.labels?.length > 0 && (
                                      <div className="flex gap-1">
                                        {task.labels.slice(0, 3).map((cl: any) => (
                                          <div
                                            key={cl.label.id}
                                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                                            style={{ background: cl.label.color }}
                                            title={cl.label.name}
                                          />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex flex-wrap items-center gap-3">
                                    <div 
                                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider"
                                        style={{ 
                                            background: listColor + "15", 
                                            borderColor: listColor + "40",
                                            color: listColor 
                                        }}
                                    >
                                      {task.list.title}
                                    </div>
                                    
                                    <div className="flex items-center gap-3 text-[var(--color-muted-foreground)]">
                                        {task._count.comments > 0 && (
                                        <span className="flex items-center gap-1 text-[11px] font-medium">
                                            <MessageSquare size={13} className="opacity-70" /> {task._count.comments}
                                        </span>
                                        )}
                                        {task._count.checklists > 0 && (
                                        <span className="flex items-center gap-1 text-[11px] font-medium">
                                            <ListChecks size={13} className="opacity-70" /> {task._count.checklists}
                                        </span>
                                        )}
                                    </div>
                                  </div>
                                </div>

                                {/* Right Side: Due Date & Avatars */}
                                <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 mt-2 md:mt-0">
                                    {/* Due Date */}
                                    {task.dueDate && (
                                    <div className={cn(
                                        "flex flex-col items-end px-3 py-1.5 rounded-xl border transition-smooth group-hover:shadow-sm",
                                        isOverdue 
                                            ? "bg-[var(--color-column-todo)] border-[var(--color-destructive)]/30" 
                                            : "bg-[var(--color-secondary)]/50 border-[var(--color-border)]"
                                    )}>
                                        <div className="flex items-center gap-1.5">
                                            <span
                                                className="text-xs font-bold"
                                                style={{
                                                    color: isOverdue ? "var(--color-destructive)" : "var(--color-foreground)",
                                                }}
                                            >
                                                {isOverdue && <AlertTriangle size={12} className="inline mr-0.5" />}
                                                {format(new Date(task.dueDate), "MMM d, yyyy")}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-medium opacity-70" style={{ color: isOverdue ? "var(--color-destructive)" : "var(--color-muted-foreground)" }}>
                                        {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                                        </p>
                                    </div>
                                    )}

                                    {/* Avatars */}
                                    <div className="flex -space-x-2 shrink-0">
                                    {task.members?.slice(0, 3).map((m: any) => (
                                        <div
                                        key={m.user.id}
                                        className="w-9 h-9 rounded-xl border-2 border-[var(--color-card)] flex items-center justify-center text-[10px] font-bold shadow-md overflow-hidden relative group/avatar"
                                        style={{ background: "var(--color-muted)", color: "var(--color-muted-foreground)" }}
                                        >
                                            <div className="absolute inset-0 bg-black/0 group-hover/avatar:bg-black/10 transition-smooth" />
                                            {m.user.image ? (
                                                <img src={m.user.image} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                (m.user.name?.charAt(0) || "?").toUpperCase()
                                            )}
                                        </div>
                                    ))}
                                    {task.members?.length > 3 && (
                                        <div className="w-9 h-9 rounded-xl border-2 border-[var(--color-card)] flex items-center justify-center text-[10px] font-bold shadow-md bg-[var(--color-sidebar)] text-white">
                                            +{task.members.length - 3}
                                        </div>
                                    )}
                                    </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
