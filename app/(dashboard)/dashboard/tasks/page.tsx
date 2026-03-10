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
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

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
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-foreground)" }}>
          My Tasks
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          All tasks assigned to you across all workspaces and boards.
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total", value: stats.total, icon: Layers, color: "var(--color-info)", bg: "var(--color-column-review)" },
            { label: "In Progress", value: stats.inProgress, icon: Clock, color: "var(--color-warning)", bg: "var(--color-column-progress)" },
            { label: "Overdue", value: stats.overdue, icon: AlertTriangle, color: "var(--color-destructive)", bg: "var(--color-column-todo)" },
            { label: "Completed", value: stats.completed, icon: CheckSquare, color: "var(--color-success)", bg: "var(--color-column-done)" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl p-5 transition-smooth"
              style={{
                background: "var(--color-card)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: stat.bg }}
                >
                  <stat.icon size={18} style={{ color: stat.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold" style={{ color: "var(--color-foreground)" }}>
                {stat.value}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <Filter size={14} style={{ color: "var(--color-muted-foreground)" }} />
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="flex items-center gap-1.5 py-2 px-4 rounded-xl text-sm font-medium transition-smooth whitespace-nowrap cursor-pointer"
            style={{
              background: filter === f.key ? "var(--color-foreground)" : "var(--color-card)",
              color: filter === f.key ? "white" : "var(--color-muted-foreground)",
              boxShadow: filter !== f.key ? "var(--shadow-card)" : "none",
            }}
          >
            <f.icon size={14} />
            {f.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Task List */}
      {!loading && data && (
        <>
          {data.cards.length === 0 ? (
            <div
              className="rounded-2xl p-12 text-center"
              style={{ background: "var(--color-card)", boxShadow: "var(--shadow-card)" }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "var(--color-column-progress)" }}
              >
                <CheckSquare size={24} style={{ color: "var(--color-warning)" }} />
              </div>
              <h3 className="font-semibold mb-2">No tasks found</h3>
              <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                {filter === "all"
                  ? "You don't have any tasks assigned yet."
                  : `No ${filter === "overdue" ? "overdue" : filter === "dueSoon" ? "upcoming" : "completed"} tasks.`}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.values(data.grouped).map((wsGroup: any) => (
                <div key={wsGroup.workspace.id}>
                  {/* Workspace Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
                    >
                      {wsGroup.workspace.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-muted-foreground)" }}>
                      {wsGroup.workspace.name}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {Object.values(wsGroup.boards).map((boardGroup: any) => (
                      <div
                        key={boardGroup.board.id}
                        className="rounded-2xl overflow-hidden"
                        style={{ background: "var(--color-card)", boxShadow: "var(--shadow-card)" }}
                      >
                        {/* Board Header */}
                        <Link
                          href={`/dashboard/board/${boardGroup.board.id}`}
                          className="flex items-center justify-between px-5 py-3 transition-smooth hover:bg-[var(--color-secondary)] group"
                          style={{ borderBottom: "1px solid var(--color-border)" }}
                        >
                          <div className="flex items-center gap-2">
                            <LayoutDashboard size={14} className="text-[var(--color-info)]" />
                            <span className="font-semibold text-sm group-hover:text-[var(--color-info)] transition-smooth">
                              {boardGroup.board.title}
                            </span>
                            <span
                              className="text-[10px] py-0.5 px-2 rounded-full font-medium"
                              style={{ background: "var(--color-secondary)", color: "var(--color-muted-foreground)" }}
                            >
                              {boardGroup.tasks.length} task{boardGroup.tasks.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <ChevronRight size={14} style={{ color: "var(--color-muted-foreground)" }} />
                        </Link>

                        {/* Tasks */}
                        <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                          {boardGroup.tasks.map((task: any) => {
                            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.list.title !== "Completed";
                            return (
                              <Link
                                key={task.id}
                                href={`/dashboard/board/${boardGroup.board.id}`}
                                className="flex items-center gap-4 px-5 py-3.5 transition-smooth hover:bg-[var(--color-secondary)]/50 group"
                              >
                                {/* Status Dot */}
                                <div
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ background: getListColor(task.list.title) }}
                                />

                                {/* Task Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium truncate">{task.title}</span>
                                    {task.labels?.length > 0 && (
                                      <div className="flex gap-1">
                                        {task.labels.slice(0, 3).map((cl: any) => (
                                          <span
                                            key={cl.label.id}
                                            className="w-2 h-2 rounded-full"
                                            style={{ background: cl.label.color }}
                                          />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span
                                      className="text-[10px] py-0.5 px-2 rounded-full font-medium"
                                      style={{
                                        background: getListColor(task.list.title) + "20",
                                        color: getListColor(task.list.title),
                                      }}
                                    >
                                      {task.list.title}
                                    </span>
                                    {task._count.comments > 0 && (
                                      <span className="flex items-center gap-0.5 text-[10px]" style={{ color: "var(--color-muted-foreground)" }}>
                                        <MessageSquare size={10} /> {task._count.comments}
                                      </span>
                                    )}
                                    {task._count.checklists > 0 && (
                                      <span className="flex items-center gap-0.5 text-[10px]" style={{ color: "var(--color-muted-foreground)" }}>
                                        <ListChecks size={10} /> {task._count.checklists}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Due Date */}
                                {task.dueDate && (
                                  <div className="shrink-0 text-right">
                                    <span
                                      className="text-[11px] font-medium"
                                      style={{
                                        color: isOverdue ? "var(--color-destructive)" : "var(--color-muted-foreground)",
                                      }}
                                    >
                                      {isOverdue && <AlertTriangle size={10} className="inline mr-1" />}
                                      {format(new Date(task.dueDate), "MMM d")}
                                    </span>
                                    <p className="text-[10px]" style={{ color: "var(--color-muted-foreground)" }}>
                                      {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                                    </p>
                                  </div>
                                )}

                                {/* Avatars */}
                                <div className="flex -space-x-1.5 shrink-0">
                                  {task.members?.slice(0, 3).map((m: any) => (
                                    <div
                                      key={m.user.id}
                                      className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold"
                                      style={{ background: "var(--color-muted)", color: "var(--color-muted-foreground)" }}
                                      title={m.user.name}
                                    >
                                      {m.user.image ? (
                                        <img src={m.user.image} alt="" className="w-full h-full rounded-full object-cover" />
                                      ) : (
                                        (m.user.name?.charAt(0) || "?").toUpperCase()
                                      )}
                                    </div>
                                  ))}
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
        </>
      )}
    </div>
  );
}
