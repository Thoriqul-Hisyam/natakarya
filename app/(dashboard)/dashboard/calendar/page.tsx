"use client";

import { useState, useEffect } from "react";
import { getCalendarTasks } from "@/actions/calendar";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [tasksByDate, setTasksByDate] = useState<Record<string, any[]>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getCalendarTasks(year, month).then((data) => {
      setTasksByDate(data.tasksByDate);
      setLoading(false);
    });
  }, [year, month]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };
  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  };

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = Array(firstDay).fill(null);

  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  const getDateKey = (day: number) => {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  };

  const isToday = (day: number) => {
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const selectedTasks = selectedDate ? (tasksByDate[selectedDate] || []) : [];

  const getListColor = (title: string) => {
    const colors: Record<string, string> = {
      "To Do": "#f87171", "In Progress": "#fb923c", "In Review": "#22d3ee", Completed: "#a78bfa",
    };
    return colors[title] || "#94a3b8";
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-foreground)" }}>Calendar</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
            View tasks by their due dates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToday}
            className="py-2 px-4 rounded-xl text-sm font-medium transition-smooth cursor-pointer hover:opacity-80"
            style={{ background: "var(--color-foreground)", color: "white" }}
          >
            Today
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar Grid */}
        <div
          className="flex-1 rounded-2xl p-6"
          style={{ background: "var(--color-card)", boxShadow: "var(--shadow-card)" }}
        >
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevMonth}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-smooth hover:bg-[var(--color-secondary)] cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-lg font-bold">
              {MONTH_NAMES[month]} {year}
            </h2>
            <button
              onClick={nextMonth}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-smooth hover:bg-[var(--color-secondary)] cursor-pointer"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAY_HEADERS.map((d) => (
              <div key={d} className="text-center text-[11px] font-semibold py-2" style={{ color: "var(--color-muted-foreground)" }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {weeks.flat().map((day, i) => {
                if (day === null) return <div key={`empty-${i}`} className="aspect-square" />;

                const dateKey = getDateKey(day);
                const tasks = tasksByDate[dateKey] || [];
                const hasOverdue = tasks.some(
                  (t: any) => new Date(t.dueDate) < new Date() && t.list.title !== "Completed"
                );
                const isSelected = selectedDate === dateKey;

                return (
                  <button
                    key={dateKey}
                    onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                    className="aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-smooth cursor-pointer relative"
                    style={{
                      background: isSelected
                        ? "var(--color-foreground)"
                        : isToday(day)
                        ? "var(--color-primary)"
                        : "transparent",
                      color: isSelected ? "white" : isToday(day) ? "var(--color-foreground)" : "inherit",
                    }}
                  >
                    <span className={`text-sm font-medium ${!isSelected && !isToday(day) ? "" : ""}`}>
                      {day}
                    </span>
                    {/* Task Indicators */}
                    {tasks.length > 0 && (
                      <div className="flex gap-0.5">
                        {tasks.length <= 3 ? (
                          tasks.map((t: any, idx: number) => (
                            <div
                              key={idx}
                              className="w-1.5 h-1.5 rounded-full"
                              style={{
                                background: isSelected
                                  ? "rgba(255,255,255,0.7)"
                                  : hasOverdue
                                  ? "var(--color-destructive)"
                                  : getListColor(t.list.title),
                              }}
                            />
                          ))
                        ) : (
                          <>
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: isSelected ? "rgba(255,255,255,0.7)" : "var(--color-info)" }} />
                            <span className="text-[8px] font-bold" style={{ color: isSelected ? "rgba(255,255,255,0.7)" : "var(--color-muted-foreground)" }}>
                              +{tasks.length}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Date Tasks */}
        <div className="w-full lg:w-80 shrink-0">
          <div
            className="rounded-2xl p-6 sticky top-6"
            style={{ background: "var(--color-card)", boxShadow: "var(--shadow-card)", border: "1px solid var(--color-border)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <CalendarIcon size={16} className="text-[var(--color-info)]" />
              <h2 className="text-sm font-bold">
                {selectedDate ? format(new Date(selectedDate + "T00:00:00"), "MMMM d, yyyy") : "Select a Date"}
              </h2>
            </div>

            {!selectedDate ? (
              <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                Click on a date with tasks to see details.
              </p>
            ) : selectedTasks.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                No tasks due on this date.
              </p>
            ) : (
              <div className="space-y-2">
                {selectedTasks.map((task: any) => {
                  const isOverdue = new Date(task.dueDate) < new Date() && task.list.title !== "Completed";
                  return (
                    <Link
                      key={task.id}
                      href={`/dashboard/board/${task.list.board.id}`}
                      className="block rounded-xl p-3 transition-smooth hover:bg-[var(--color-secondary)]"
                      style={{ border: "1px solid var(--color-border)" }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: getListColor(task.list.title) }}
                        />
                        <span className="text-sm font-medium truncate">{task.title}</span>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <span className="text-[10px]" style={{ color: "var(--color-muted-foreground)" }}>
                          {task.list.board.title} · {task.list.title}
                        </span>
                        {isOverdue && (
                          <AlertTriangle size={10} style={{ color: "var(--color-destructive)" }} />
                        )}
                      </div>
                      {task.labels?.length > 0 && (
                        <div className="flex gap-1 mt-1.5 ml-4">
                          {task.labels.map((cl: any) => (
                            <span
                              key={cl.label.id}
                              className="text-[9px] px-1.5 py-0.5 rounded-full"
                              style={{ background: cl.label.color + "20", color: cl.label.color }}
                            >
                              {cl.label.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
