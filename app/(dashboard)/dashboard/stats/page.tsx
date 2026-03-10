"use client";

import { useState, useEffect } from "react";
import { getDashboardStats } from "@/actions/stats";
import Link from "next/link";
import {
  BarChart3,
  CheckSquare,
  Clock,
  AlertTriangle,
  Layers,
  TrendingUp,
  LayoutDashboard,
} from "lucide-react";

export default function StatsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats().then((data) => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Statistics</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
            Overview of your work across all boards.
          </p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const maxActivity = Math.max(...Object.values(stats.activityByDay).map((v: any) => Number(v)), 1);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-foreground)" }}>
          Statistics
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          Overview of your work across all boards.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Tasks", value: stats.totalCards, icon: Layers, color: "var(--color-info)", bg: "var(--color-column-review)" },
          { label: "In Progress", value: stats.inProgressCards, icon: Clock, color: "var(--color-warning)", bg: "var(--color-column-progress)" },
          { label: "Overdue", value: stats.overdueCards, icon: AlertTriangle, color: "var(--color-destructive)", bg: "var(--color-column-todo)" },
          { label: "Completed", value: stats.completedCards, icon: CheckSquare, color: "var(--color-success)", bg: "var(--color-column-done)" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-5 transition-smooth"
            style={{ background: "var(--color-card)", boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: stat.bg }}>
                <stat.icon size={18} style={{ color: stat.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: "var(--color-foreground)" }}>{stat.value}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Completion Rate */}
        <div
          className="rounded-2xl p-6"
          style={{ background: "var(--color-card)", boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={16} className="text-[var(--color-info)]" />
            <h2 className="text-sm font-bold">Completion Rate</h2>
          </div>
          <div className="flex items-center gap-6">
            {/* Circular Progress */}
            <div className="relative w-28 h-28 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-secondary)" strokeWidth="10" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke="var(--color-success)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${stats.completionRate * 2.51} 251`}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{stats.completionRate}%</span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: "var(--color-success)" }} />
                <span style={{ color: "var(--color-muted-foreground)" }}>Completed: {stats.completedCards}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: "var(--color-secondary)" }} />
                <span style={{ color: "var(--color-muted-foreground)" }}>Remaining: {stats.totalCards - stats.completedCards}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Chart */}
        <div
          className="rounded-2xl p-6"
          style={{ background: "var(--color-card)", boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 size={16} className="text-[var(--color-info)]" />
            <h2 className="text-sm font-bold">Activity (7 Days)</h2>
          </div>
          <div className="flex items-end gap-2 h-32">
            {Object.entries(stats.activityByDay).map(([date, count]: [string, any]) => {
              const d = new Date(date + "T00:00:00");
              const height = maxActivity > 0 ? (Number(count) / maxActivity) * 100 : 0;
              return (
                <div key={date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-medium" style={{ color: "var(--color-muted-foreground)" }}>
                    {count}
                  </span>
                  <div className="w-full flex items-end" style={{ height: "80px" }}>
                    <div
                      className="w-full rounded-t-lg transition-all duration-500"
                      style={{
                        height: `${Math.max(height, 4)}%`,
                        background: count > 0
                          ? "linear-gradient(180deg, var(--color-primary), #f59e0b)"
                          : "var(--color-secondary)",
                      }}
                    />
                  </div>
                  <span className="text-[10px]" style={{ color: "var(--color-muted-foreground)" }}>
                    {dayNames[d.getDay()]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Board Breakdown */}
      <div
        className="rounded-2xl p-6"
        style={{ background: "var(--color-card)", boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-center gap-2 mb-6">
          <LayoutDashboard size={16} className="text-[var(--color-info)]" />
          <h2 className="text-sm font-bold">Board Progress</h2>
        </div>
        {stats.boardBreakdown.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>No boards found.</p>
        ) : (
          <div className="space-y-4">
            {stats.boardBreakdown.map((board: any) => (
              <Link
                key={board.id}
                href={`/dashboard/board/${board.id}`}
                className="block group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium group-hover:text-[var(--color-info)] transition-smooth">
                      {board.title}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--color-secondary)", color: "var(--color-muted-foreground)" }}>
                      {board.workspaceName}
                    </span>
                  </div>
                  <span className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
                    {board.completedTasks}/{board.totalTasks} tasks
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--color-secondary)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${board.progress}%`,
                      background: board.progress === 100
                        ? "var(--color-success)"
                        : "linear-gradient(90deg, var(--color-primary), #f59e0b)",
                    }}
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
