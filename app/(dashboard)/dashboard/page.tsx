import { getWorkspaces } from "@/actions/workspace";
import { getRecentBoards } from "@/actions/board";
import { getMyTaskStats, getMyTasks } from "@/actions/task";
import Link from "next/link";
import { 
  Plus, 
  LayoutDashboard, 
  Clock, 
  Users, 
  Activity, 
  CheckSquare, 
  AlertTriangle, 
  Layers, 
  ChevronRight,
  Briefcase,
  Star,
  ArrowUpRight
} from "lucide-react";
import { CreateWorkspaceDialog } from "@/components/workspace/create-workspace-dialog";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const workspaces = await getWorkspaces();
  const recentBoards = await getRecentBoards();
  
  let stats = null;
  let myTasks: any = null;
  try {
    stats = await getMyTaskStats();
    myTasks = await getMyTasks("all");
  } catch { /* ignore if no tasks */ }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="py-4 md:py-8">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 fade-in">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--color-foreground)" }}>
                {getGreeting()}, <span className="text-[var(--color-muted-foreground)] opacity-60">Explorer</span>
              </h1>
              <p className="text-sm mt-1.5 font-medium" style={{ color: "var(--color-muted-foreground)" }}>
                Here&apos;s what&apos;s happening in your workspace today.
              </p>
            </div>
            <div className="shrink-0">
                <CreateWorkspaceDialog />
            </div>
          </div>

          {/* Quick Stats */}
          {stats && (
            <section className="mb-10 fade-in stagger-1">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "My Tasks", value: stats.total, icon: Layers, color: "var(--color-info)", bg: "var(--color-column-review)" },
                  { label: "In Progress", value: stats.inProgress, icon: Clock, color: "var(--color-warning)", bg: "var(--color-column-progress)" },
                  { label: "Overdue", value: stats.overdue, icon: AlertTriangle, color: "var(--color-destructive)", bg: "var(--color-column-todo)" },
                  { label: "Completed", value: stats.completed, icon: CheckSquare, color: "var(--color-success)", bg: "var(--color-column-done)" },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="group rounded-2xl p-5 transition-smooth hover:scale-[1.02] relative overflow-hidden bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-smooth group-hover:rotate-6" style={{ background: stat.bg }}>
                          <Icon size={18} style={{ color: stat.color }} />
                        </div>
                        <span className="text-xs font-black opacity-10 select-none">0{i + 1}</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <p className="text-2xl font-bold tracking-tight" style={{ color: "var(--color-foreground)" }}>{stat.value}</p>
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5 opacity-70" style={{ color: "var(--color-muted-foreground)" }}>{stat.label}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            {/* My Tasks Preview */}
            <section className="fade-in stagger-2">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-[var(--color-column-done)] flex items-center justify-center">
                            <CheckSquare size={14} className="text-[var(--color-success)]" />
                        </div>
                        <h2 className="text-sm font-bold tracking-tight uppercase opacity-70" style={{ color: "var(--color-muted-foreground)" }}>
                            Priority Tasks
                        </h2>
                    </div>
                    <Link
                        href="/dashboard/tasks"
                        className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider transition-smooth hover:translate-x-1"
                        style={{ color: "var(--color-info)" }}
                    >
                        View all <ChevronRight size={12} />
                    </Link>
                </div>
                
                <div className="rounded-3xl border border-[var(--color-border)] shadow-sm bg-[var(--color-card)] overflow-hidden">
                    {myTasks && myTasks.cards.length > 0 ? (
                        <div className="divide-y divide-[var(--color-border)]">
                            {myTasks.cards.slice(0, 4).map((task: any, i: number) => {
                                const listColors: Record<string, string> = {
                                    "To Do": "#f87171", "In Progress": "#fb923c", "In Review": "#22d3ee", Completed: "#a78bfa",
                                };
                                const listColor = listColors[task.list.title] || "#94a3b8";
                                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.list.title !== "Completed";
                                return (
                                    <Link
                                        key={task.id}
                                        href={`/dashboard/board/${task.list.board.id}`}
                                        className="group flex items-center gap-4 px-5 py-4 transition-smooth hover:bg-[var(--color-secondary)]/30 relative"
                                    >
                                        <div 
                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full transition-smooth group-hover:h-8"
                                            style={{ background: listColor }}
                                        />
                                        <div className="flex-1 min-w-0 pl-1">
                                            <p className="text-sm font-bold truncate group-hover:translate-x-1 transition-smooth">{task.title}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-medium opacity-60" style={{ color: "var(--color-muted-foreground)" }}>
                                                    {task.list.board.title}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-[var(--color-muted)]" />
                                                <span className="text-[10px] font-bold" style={{ color: listColor }}>
                                                    {task.list.title}
                                                </span>
                                            </div>
                                        </div>
                                        {task.dueDate && (
                                            <div className={cn(
                                                "shrink-0 px-2 py-1 rounded-lg border text-[9px] font-bold transition-smooth",
                                                isOverdue ? "bg-[var(--color-column-todo)] border-[var(--color-destructive)]/30 text-[var(--color-destructive)]" : "bg-[var(--color-secondary)]/50 border-[var(--color-border)] text-[var(--color-muted-foreground)]"
                                            )}>
                                                {new Date(task.dueDate).toLocaleDateString("en", { month: "short", day: "numeric" })}
                                            </div>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-10 text-center">
                            <p className="text-xs font-medium text-[var(--color-muted-foreground)]">No tasks assigned to you yet.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Recent Boards */}
            <section className="fade-in stagger-3">
                <div className="flex items-center gap-2 mb-5">
                    <div className="w-6 h-6 rounded-lg bg-[var(--color-column-review)] flex items-center justify-center">
                        <Clock size={14} className="text-[var(--color-info)]" />
                    </div>
                    <h2 className="text-sm font-bold tracking-tight uppercase opacity-70" style={{ color: "var(--color-muted-foreground)" }}>
                        Recent Activity
                    </h2>
                </div>
                
                <div className="grid gap-4">
                    {recentBoards.slice(0, 3).map((board) => (
                        <Link
                            key={board.id}
                            href={`/dashboard/board/${board.id}`}
                            className="group flex items-center gap-4 p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm transition-smooth hover:shadow-md hover:border-[var(--color-info)]/30 hover:scale-[1.01]"
                        >
                            <div className="w-11 h-11 rounded-xl bg-[var(--color-column-review)] flex items-center justify-center group-hover:bg-[var(--color-info)] transition-smooth shrink-0">
                                <LayoutDashboard size={18} className="text-[var(--color-info)] group-hover:text-white transition-smooth" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-sm truncate group-hover:text-[var(--color-info)] transition-smooth">
                                    {board.title}
                                </h3>
                                <p className="text-[10px] font-semibold mt-0.5 opacity-60" style={{ color: "var(--color-muted-foreground)" }}>
                                    {board.workspace.name} · {board._count.lists} lists
                                </p>
                            </div>
                            <div className="w-8 h-8 rounded-full border border-[var(--color-border)] flex items-center justify-center group-hover:border-[var(--color-info)] group-hover:text-[var(--color-info)] transition-smooth shrink-0">
                                <ArrowUpRight size={14} />
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
          </div>

          {/* Workspaces List */}
          <section className="fade-in stagger-4">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-6 h-6 rounded-lg bg-[var(--color-column-progress)] flex items-center justify-center">
                <Users size={14} className="text-[var(--color-warning)]" />
              </div>
              <h2 className="text-sm font-bold tracking-tight uppercase opacity-70" style={{ color: "var(--color-muted-foreground)" }}>
                Your Workspaces
              </h2>
            </div>

            {workspaces.length === 0 ? (
              <div
                className="rounded-3xl p-16 text-center border-2 border-dashed border-[var(--color-border)] bg-[var(--color-card)]"
              >
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 bg-[var(--color-column-progress)]">
                  <Briefcase size={32} className="text-[var(--color-warning)]" />
                </div>
                <h3 className="text-xl font-bold mb-2">No workspaces yet</h3>
                <p className="text-sm mb-8 max-w-xs mx-auto text-[var(--color-muted-foreground)]">
                  Create your first workspace to start organizing and collaborating on your projects.
                </p>
                <CreateWorkspaceDialog />
              </div>
            ) : (
              <div className="grid gap-4">
                {workspaces.map((workspace) => (
                  <Link
                    key={workspace.id}
                    href={`/dashboard/workspace/${workspace.id}`}
                    className="group flex items-center justify-between p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm transition-smooth hover:shadow-md hover:scale-[1.005]"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-inner group-hover:rotate-3 transition-smooth"
                        style={{ background: "linear-gradient(135deg, #1a2e35 0%, #2d4a54 100%)" }}
                      >
                        {workspace.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-base group-hover:text-[var(--color-info)] transition-smooth">
                          {workspace.name}
                        </h3>
                        {workspace.description ? (
                          <p className="text-xs font-medium mt-0.5 max-w-md truncate" style={{ color: "var(--color-muted-foreground)" }}>
                            {workspace.description}
                          </p>
                        ) : (
                          <p className="text-[10px] font-bold uppercase tracking-wider opacity-40 mt-1" style={{ color: "var(--color-muted-foreground)" }}>
                            No description provided
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-6 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: "var(--color-foreground)" }}>{workspace._count.members}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-50" style={{ color: "var(--color-muted-foreground)" }}>Members</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: "var(--color-foreground)" }}>{workspace._count.boards}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-50" style={{ color: "var(--color-muted-foreground)" }}>Boards</p>
                      </div>
                      <div className="w-10 h-10 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted-foreground)] group-hover:text-[var(--color-foreground)] group-hover:border-[var(--color-foreground)] transition-smooth">
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar Activity */}
        <div className="w-full lg:w-80 shrink-0 fade-in stagger-4">
          <div 
            className="rounded-3xl p-6 sticky top-6 transition-smooth hover:shadow-md h-fit bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm"
          >
            <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-xl bg-[var(--color-column-review)] flex items-center justify-center">
                    <Activity size={16} className="text-[var(--color-info)]" />
                </div>
                <div>
                   <h2 className="text-xs font-black uppercase tracking-widest opacity-50" style={{ color: "var(--color-muted-foreground)" }}>Timeline</h2>
                   <span className="text-sm font-bold">Activity Feed</span>
                </div>
            </div>
            
            <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-[var(--color-border)] via-[var(--color-border)] to-transparent" />
                <ActivityFeed />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
