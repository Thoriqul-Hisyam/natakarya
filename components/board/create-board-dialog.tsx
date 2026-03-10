"use client";

import { useState } from "react";
import { createBoard } from "@/actions/board";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CreateBoardDialogProps {
  workspaceId: string;
  variant?: "button" | "card";
}

export function CreateBoardDialog({ workspaceId, variant = "button" }: CreateBoardDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState("WORKSPACE");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const board = await createBoard({
        title: title.trim(),
        workspaceId,
        visibility,
      });
      toast.success("Board created with default lists!");
      setOpen(false);
      setTitle("");
      router.push(`/dashboard/board/${board.id}`);
    } catch (error) {
      toast.error("Failed to create board");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {variant === "card" ? (
        <button
          onClick={() => setOpen(true)}
          className="rounded-2xl p-5 border-2 border-dashed flex flex-col items-center justify-center gap-2 min-h-[120px] transition-smooth hover:border-[var(--color-primary)] hover:bg-[var(--color-card)] group cursor-pointer"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-smooth group-hover:bg-[var(--color-primary)]"
            style={{ background: "var(--color-secondary)" }}
          >
            <Plus size={16} style={{ color: "var(--color-muted-foreground)" }} />
          </div>
          <span className="text-sm font-medium" style={{ color: "var(--color-muted-foreground)" }}>
            Create Board
          </span>
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 py-2.5 px-5 rounded-2xl font-semibold text-sm transition-smooth hover:opacity-90 active:scale-[0.98] cursor-pointer"
          style={{
            background: "var(--color-foreground)",
            color: "var(--color-card)",
          }}
        >
          <Plus size={16} />
          New Board
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div
            className="relative w-full max-w-md rounded-2xl p-6 fade-in z-10"
            style={{
              background: "var(--color-card)",
              boxShadow: "var(--shadow-dropdown)",
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Create Board</h2>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--color-secondary)] transition-smooth cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1.5">Board Name</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. NovaBoard Mobile App"
                  className="w-full py-2.5 px-4 rounded-xl text-sm outline-none transition-smooth"
                  style={{
                    background: "var(--color-background)",
                    border: "1px solid var(--color-border)",
                  }}
                  autoFocus
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-1.5">Visibility</label>
                <div className="flex gap-2">
                  {[
                    { value: "WORKSPACE", label: "Workspace" },
                    { value: "PRIVATE", label: "Private" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setVisibility(opt.value)}
                      className="flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-smooth cursor-pointer"
                      style={{
                        background:
                          visibility === opt.value
                            ? "var(--color-primary)"
                            : "var(--color-background)",
                        color:
                          visibility === opt.value
                            ? "var(--color-primary-foreground)"
                            : "var(--color-muted-foreground)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs mb-4" style={{ color: "var(--color-muted-foreground)" }}>
                Default lists (To Do, In Progress, In Review, Completed) will be created automatically.
              </p>

              <button
                type="submit"
                disabled={!title.trim() || loading}
                className="w-full py-2.5 rounded-xl font-semibold text-sm transition-smooth disabled:opacity-50 cursor-pointer"
                style={{
                  background: "var(--color-primary)",
                  color: "var(--color-primary-foreground)",
                }}
              >
                {loading ? "Creating..." : "Create Board"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
