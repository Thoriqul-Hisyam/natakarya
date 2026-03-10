import { getWorkspaces } from "@/actions/workspace";
import { getRecentBoards } from "@/actions/board";
import { getMyTaskStats, getMyTasks } from "@/actions/task";
import Link from "next/link";
import { Plus, LayoutDashboard, Clock, Users, Activity, CheckSquare, AlertTriangle, Layers, ChevronRight } from "lucide-react";
import { CreateWorkspaceDialog } from "@/components/workspace/create-workspace-dialog";
import { ActivityFeed } from "@/components/dashboard/activity-feed";

export default async function DashboardPage() {
  const workspaces = await getWorkspaces();
  const recentBoards = await getRecentBoards();
  
  let stats = null;
  let myTasks: any = null;
  try {
    stats = await getMyTaskStats();
    myTasks = await getMyTasks("all");
  } catch { /* ignore if no tasks */ }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--color-foreground)" }}>
                Dashboard
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
                Welcome back! Here&apos;s your workspace overview.
              </p>
            </div>
            <CreateWorkspaceDialog />
          </div>

          {/* Quick Stats */}
          {stats && stats.total > 0 && (
            <section className="mb-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "My Tasks", value: stats.total, icon: Layers, color: "var(--color-info)", bg: "var(--color-column-review)" },
                  { label: "In Progress", value: stats.inProgress, icon: Clock, color: "var(--color-warning)", bg: "var(--color-column-progress)" },
                  { label: "Overdue", value: stats.overdue, icon: AlertTriangle, color: "var(--color-destructive)", bg: "var(--color-column-todo)" },
                  { label: "Completed", value: stats.completed, icon: CheckSquare, color: "var(--color-success)", bg: "var(--color-column-done)" },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="rounded-2xl p-4 transition-smooth"
                      style={{ background: "var(--color-card)", boxShadow: "var(--shadow-card)" }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: stat.bg }}>
                          <Icon size={16} style={{ color: stat.color }} />
                        </div>
                        <div>
                          <p className="text-xl font-bold" style={{ color: "var(--color-foreground)" }}>{stat.value}</p>
                          <p className="text-[10px]" style={{ color: "var(--color-muted-foreground)" }}>{stat.label}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* My Tasks Preview */}
          {myTasks && myTasks.cards.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CheckSquare size={16} style={{ color: "var(--color-muted-foreground)" }} />
                  <h2 className="text-sm font-semibold" style={{ color: "var(--color-muted-foreground)" }}>
                    My Tasks
                  </h2>
                </div>
                <Link
                  href="/dashboard/tasks"
                  className="flex items-center gap-1 text-xs font-medium transition-smooth hover:opacity-70"
                  style={{ color: "var(--color-info)" }}
                >
                  View all <ChevronRight size={12} />
                </Link>
              </div>
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: "var(--color-card)", boxShadow: "var(--shadow-card)" }}
              >
                {myTasks.cards.slice(0, 5).map((task: any, i: number) => {
                  const listColors: Record<string, string> = {
                    "To Do": "#f87171", "In Progress": "#fb923c", "In Review": "#22d3ee", Completed: "#a78bfa",
                  };
                  const dotColor = listColors[task.list.title] || "#94a3b8";
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.list.title !== "Completed";
                  return (
                    <Link
                      key={task.id}
                      href={`/dashboard/board/${task.list.board.id}`}
                      className="flex items-center gap-3 px-5 py-3 transition-smooth hover:bg-[var(--color-secondary)]/50"
                      style={{ borderBottom: i < Math.min(myTasks.cards.length, 5) - 1 ? "1px solid var(--color-border)" : "none" }}
                    >
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: dotColor }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <p className="text-[10px]" style={{ color: "var(--color-muted-foreground)" }}>
                          {task.list.board.title} · {task.list.title}
                        </p>
                      </div>
                      {task.dueDate && (
                        <span
                          className="text-[10px] font-medium shrink-0"
                          style={{ color: isOverdue ? "var(--color-destructive)" : "var(--color-muted-foreground)" }}
                        >
                          {isOverdue && "⚠ "}
                          {new Date(task.dueDate).toLocaleDateString("en", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Recent Boards */}
          {recentBoards.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={16} style={{ color: "var(--color-muted-foreground)" }} />
                <h2 className="text-sm font-semibold" style={{ color: "var(--color-muted-foreground)" }}>
                  Recent Boards
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentBoards.map((board) => (
                  <Link
                    key={board.id}
                    href={`/dashboard/board/${board.id}`}
                    className="group rounded-2xl p-5 transition-smooth hover:shadow-lg"
                    style={{
                      background: "var(--color-card)",
                      boxShadow: "var(--shadow-card)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: "var(--color-column-review)" }}
                      >
                        <LayoutDashboard size={14} style={{ color: "var(--color-info)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate group-hover:text-[var(--color-info)] transition-smooth">
                          {board.title}
                        </h3>
                      </div>
                    </div>
                    <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                      {board.workspace.name} · {board._count.lists} lists
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Workspaces */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Users size={16} style={{ color: "var(--color-muted-foreground)" }} />
              <h2 className="text-sm font-semibold" style={{ color: "var(--color-muted-foreground)" }}>
                Your Workspaces
              </h2>
            </div>

            {workspaces.length === 0 ? (
              <div
                className="rounded-2xl p-12 text-center"
                style={{
                  background: "var(--color-card)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "var(--color-column-progress)" }}
                >
                  <LayoutDashboard size={24} style={{ color: "var(--color-warning)" }} />
                </div>
                <h3 className="font-semibold mb-2">No workspaces yet</h3>
                <p className="text-sm mb-6" style={{ color: "var(--color-muted-foreground)" }}>
                  Create your first workspace to start organizing projects.
                </p>
                <CreateWorkspaceDialog />
              </div>
            ) : (
              <div className="grid gap-4">
                {workspaces.map((workspace) => (
                  <Link
                    key={workspace.id}
                    href={`/dashboard/workspace/${workspace.id}`}
                    className="rounded-2xl p-5 transition-smooth hover:shadow-lg group"
                    style={{
                      background: "var(--color-card)",
                      boxShadow: "var(--shadow-card)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                          style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
                        >
                          {workspace.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold group-hover:text-[var(--color-info)] transition-smooth">
                            {workspace.name}
                          </h3>
                          {workspace.description && (
                            <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                              {workspace.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                        <span>{workspace._count.members} members</span>
                        <span>{workspace._count.boards} boards</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar Activity */}
        <div className="w-full lg:w-80 shrink-0">
          <div 
            className="rounded-2xl p-6 sticky top-6"
            style={{ 
              background: "var(--color-card)",
              boxShadow: "var(--shadow-card)",
              border: "1px solid var(--color-border)"
            }}
          >
            <div className="flex items-center gap-2 mb-6">
              <Activity size={16} className="text-[var(--color-info)]" />
              <h2 className="text-sm font-bold">Recent Activity</h2>
            </div>
            <ActivityFeed />
          </div>
        </div>
      </div>
    </div>
  );
}
