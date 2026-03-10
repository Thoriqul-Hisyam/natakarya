"use client";

import { useState } from "react";
import { createWorkspace } from "@/actions/workspace";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function CreateWorkspaceDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const workspace = await createWorkspace({ name: name.trim(), description: description.trim() || undefined });
      toast.success("Workspace created!");
      setOpen(false);
      setName("");
      setDescription("");
      router.push(`/dashboard/workspace/${workspace.id}`);
    } catch (error) {
      toast.error("Failed to create workspace");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 py-2.5 px-5 rounded-2xl font-semibold text-sm transition-smooth hover:opacity-90 active:scale-[0.98] cursor-pointer"
        style={{
          background: "var(--color-foreground)",
          color: "var(--color-card)",
        }}
      >
        <Plus size={16} />
        New Workspace
      </button>

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
              <h2 className="text-lg font-bold">Create Workspace</h2>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--color-secondary)] transition-smooth cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1.5">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. My Team"
                  className="w-full py-2.5 px-4 rounded-xl text-sm outline-none transition-smooth"
                  style={{
                    background: "var(--color-background)",
                    border: "1px solid var(--color-border)",
                  }}
                  autoFocus
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-1.5">
                  Description <span style={{ color: "var(--color-muted-foreground)" }}>(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this workspace for?"
                  rows={3}
                  className="w-full py-2.5 px-4 rounded-xl text-sm outline-none transition-smooth resize-none"
                  style={{
                    background: "var(--color-background)",
                    border: "1px solid var(--color-border)",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={!name.trim() || loading}
                className="w-full py-2.5 rounded-xl font-semibold text-sm transition-smooth disabled:opacity-50 cursor-pointer"
                style={{
                  background: "var(--color-primary)",
                  color: "var(--color-primary-foreground)",
                }}
              >
                {loading ? "Creating..." : "Create Workspace"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
