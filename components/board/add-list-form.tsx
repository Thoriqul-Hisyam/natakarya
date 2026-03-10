"use client";

import { useState } from "react";
import { createList } from "@/actions/list";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

interface AddListFormProps {
  boardId: string;
}

export function AddListForm({ boardId }: AddListFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");

  const handleSubmit = async () => {
    if (!title.trim()) return;

    try {
      await createList({ title: title.trim(), boardId });
      setTitle("");
      setIsAdding(false);
      toast.success("List created");
    } catch {
      toast.error("Failed to create list");
    }
  };

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="flex-shrink-0 w-[300px] h-fit rounded-2xl p-4 border-2 border-dashed flex items-center justify-center gap-2 transition-smooth hover:bg-[var(--color-card)] hover:border-[var(--color-primary)] cursor-pointer"
        style={{ borderColor: "var(--color-border)" }}
      >
        <Plus size={16} style={{ color: "var(--color-muted-foreground)" }} />
        <span className="text-sm font-medium" style={{ color: "var(--color-muted-foreground)" }}>
          Add List
        </span>
      </button>
    );
  }

  return (
    <div
      className="flex-shrink-0 w-[300px] h-fit rounded-2xl p-3"
      style={{
        background: "var(--color-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
          if (e.key === "Escape") setIsAdding(false);
        }}
        placeholder="Enter list title..."
        className="w-full py-2 px-3 rounded-xl text-sm outline-none mb-2"
        style={{
          background: "var(--color-background)",
          border: "1px solid var(--color-border)",
        }}
        autoFocus
      />
      <div className="flex items-center gap-2">
        <button
          onClick={handleSubmit}
          className="py-1.5 px-4 rounded-lg text-sm font-medium transition-smooth cursor-pointer"
          style={{
            background: "var(--color-primary)",
            color: "var(--color-primary-foreground)",
          }}
        >
          Add List
        </button>
        <button
          onClick={() => {
            setIsAdding(false);
            setTitle("");
          }}
          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--color-secondary)] transition-smooth cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
