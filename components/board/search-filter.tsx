"use client";

import { useState, useRef, useEffect } from "react";
import { SlidersHorizontal, Check, X, Tag, Users, Calendar } from "lucide-react";

interface FilterOptions {
  labels: string[];
  assignees: string[];
  dueDate: string | null;
}

interface SearchFilterProps {
  filters: FilterOptions;
  setFilters: (filters: FilterOptions) => void;
  availableLabels: any[];
  availableMembers: any[];
}

export function SearchFilter({
  filters,
  setFilters,
  availableLabels,
  availableMembers,
}: SearchFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const hasActiveFilters = 
    filters.labels.length > 0 || 
    filters.assignees.length > 0 || 
    filters.dueDate !== null;

  const toggleLabel = (id: string) => {
    setFilters({
      ...filters,
      labels: filters.labels.includes(id) 
        ? filters.labels.filter(l => l !== id)
        : [...filters.labels, id]
    });
  };

  const toggleAssignee = (id: string) => {
    setFilters({
      ...filters,
      assignees: filters.assignees.includes(id) 
        ? filters.assignees.filter(a => a !== id)
        : [...filters.assignees, id]
    });
  };

  const setDueDate = (val: string | null) => {
    setFilters({
      ...filters,
      dueDate: filters.dueDate === val ? null : val
    });
  };

  const clearFilters = () => {
    setFilters({ labels: [], assignees: [], dueDate: null });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-sm transition-smooth hover:bg-[var(--color-card)] cursor-pointer relative"
        style={{ 
          color: hasActiveFilters ? "var(--color-primary)" : "var(--color-muted-foreground)",
          background: hasActiveFilters ? "var(--color-secondary)" : "transparent"
        }}
      >
        <SlidersHorizontal size={14} />
        Filter
        {hasActiveFilters && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] border-2 border-[var(--color-background)]" />
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-12 w-80 rounded-2xl p-4 fade-in z-50 flex flex-col gap-4 max-h-[80vh] overflow-y-auto custom-scrollbar"
          style={{
            background: "var(--color-card)",
            boxShadow: "var(--shadow-dropdown)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Filters</h3>
            {hasActiveFilters && (
              <button 
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground transition-smooth"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Labels Filter */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Tag size={12} className="text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Labels</span>
            </div>
            <div className="flex flex-col gap-1">
              {availableLabels.map(label => (
                <button
                  key={label.id}
                  onClick={() => toggleLabel(label.id)}
                  className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-sm transition-smooth hover:bg-[var(--color-secondary)] cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full" 
                      style={{ background: label.color }} 
                    />
                    <span className="truncate">{label.name}</span>
                  </div>
                  {filters.labels.includes(label.id) && (
                    <Check size={14} style={{ color: "var(--color-primary)" }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Members Filter */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users size={12} className="text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assignees</span>
            </div>
            <div className="flex flex-col gap-1">
              {availableMembers.map(m => (
                <button
                  key={m.user.id}
                  onClick={() => toggleAssignee(m.user.id)}
                  className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-sm transition-smooth hover:bg-[var(--color-secondary)] cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold"
                      style={{ background: "var(--color-muted)", color: "var(--color-muted-foreground)" }}
                    >
                      {m.user.image ? (
                        <img src={m.user.image} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        (m.user.name?.charAt(0) || "?").toUpperCase()
                      )}
                    </div>
                    <span className="truncate">{m.user.name || m.user.email}</span>
                  </div>
                  {filters.assignees.includes(m.user.id) && (
                    <Check size={14} style={{ color: "var(--color-primary)" }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Due Date Filter */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={12} className="text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Due Date</span>
            </div>
            <div className="flex flex-col gap-1">
              {[
                { id: "noDate", label: "No due date" },
                { id: "overdue", label: "Overdue" },
                { id: "nextDay", label: "Due next day" },
                { id: "nextWeek", label: "Due next week" },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setDueDate(opt.id)}
                  className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-sm transition-smooth hover:bg-[var(--color-secondary)] cursor-pointer text-left"
                >
                  <span className="truncate">{opt.label}</span>
                  {filters.dueDate === opt.id && (
                    <Check size={14} style={{ color: "var(--color-primary)" }} />
                  )}
                </button>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
