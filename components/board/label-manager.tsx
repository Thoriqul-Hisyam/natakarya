"use client";

import { useState } from "react";
import { Tag, Plus, Edit2, Trash2, Check, X } from "lucide-react";
import { createLabel, updateLabel, deleteLabel } from "@/actions/label";
import { toast } from "sonner";
const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#22c55e", "#14b8a6",
  "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#64748b",
];

interface LabelManagerProps {
  boardId: string;
  labels: any[];
  onClose: () => void;
  role: string;
}

export function LabelManager({ boardId, labels, onClose, role }: LabelManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const canManage = ["OWNER", "ADMIN", "MEMBER"].includes(role);
  const canDelete = ["OWNER", "ADMIN"].includes(role);

  const handleCreate = async () => {
    if (!newName.trim() || !newColor) return;
    setLoading(true);
    try {
      await createLabel(boardId, newName.trim(), newColor);
      setNewName("");
      setNewColor(PRESET_COLORS[0]);
      setIsCreating(false);
      toast.success("Label created");
    } catch {
      toast.error("Failed to create label");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    setLoading(true);
    try {
      await updateLabel(id, { name: editName.trim(), color: editColor });
      setEditingId(null);
      toast.success("Label updated");
    } catch {
      toast.error("Failed to update label");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await deleteLabel(id);
      setDeleteTarget(null);
      toast.success("Label deleted");
    } catch {
      toast.error("Failed to delete label");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (label: any) => {
    setEditingId(label.id);
    setEditName(label.name);
    setEditColor(label.color);
    setIsCreating(false);
  };

  return (
    <div
      className="absolute right-0 top-12 w-72 rounded-2xl p-4 fade-in z-50"
      style={{
        background: "var(--color-card)",
        boxShadow: "var(--shadow-dropdown)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Tag size={14} className="text-[var(--color-info)]" />
          <h3 className="font-semibold text-sm">Labels</h3>
        </div>
        <button onClick={onClose} className="cursor-pointer hover:opacity-70 transition-smooth">
          <X size={14} style={{ color: "var(--color-muted-foreground)" }} />
        </button>
      </div>

      {/* Label List */}
      <div className="space-y-1 mb-3 max-h-48 overflow-y-auto">
        {labels.map((label) => (
          <div key={label.id}>
            {editingId === label.id ? (
              <div className="space-y-2 p-2 rounded-xl" style={{ background: "var(--color-secondary)" }}>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-8 px-3 rounded-lg text-sm outline-none border border-[var(--color-border)] bg-white"
                  autoFocus
                />
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setEditColor(c)}
                      className="w-5 h-5 rounded-full cursor-pointer flex items-center justify-center transition-smooth"
                      style={{ background: c, outline: editColor === c ? "2px solid var(--color-foreground)" : "none", outlineOffset: "2px" }}
                    >
                      {editColor === c && <Check size={10} className="text-white" />}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleUpdate(label.id)}
                    disabled={loading}
                    className="flex-1 py-1 rounded-lg text-xs font-medium cursor-pointer transition-smooth"
                    style={{ background: "var(--color-foreground)", color: "white" }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="py-1 px-2 rounded-lg text-xs cursor-pointer transition-smooth hover:bg-[var(--color-border)]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between py-1.5 px-2 rounded-lg transition-smooth hover:bg-[var(--color-secondary)] group">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full" style={{ background: label.color }} />
                  <span className="text-sm">{label.name}</span>
                </div>
                {canManage && (
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-smooth">
                    <button
                      onClick={() => startEdit(label)}
                      className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-[var(--color-border)] cursor-pointer transition-smooth"
                    >
                      <Edit2 size={12} style={{ color: "var(--color-muted-foreground)" }} />
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => setDeleteTarget(label.id)}
                        className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-50 cursor-pointer transition-smooth"
                      >
                        <Trash2 size={12} style={{ color: "var(--color-destructive)" }} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create New */}
      {canManage && (
        <>
          {isCreating ? (
            <div className="space-y-2 p-2 rounded-xl" style={{ background: "var(--color-secondary)" }}>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Label name"
                className="w-full h-8 px-3 rounded-lg text-sm outline-none border border-[var(--color-border)] bg-white"
                autoFocus
              />
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className="w-5 h-5 rounded-full cursor-pointer flex items-center justify-center transition-smooth"
                    style={{ background: c, outline: newColor === c ? "2px solid var(--color-foreground)" : "none", outlineOffset: "2px" }}
                  >
                    {newColor === c && <Check size={10} className="text-white" />}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={handleCreate}
                  disabled={loading || !newName.trim()}
                  className="flex-1 py-1 rounded-lg text-xs font-medium cursor-pointer transition-smooth disabled:opacity-50"
                  style={{ background: "var(--color-foreground)", color: "white" }}
                >
                  Create
                </button>
                <button
                  onClick={() => setIsCreating(false)}
                  className="py-1 px-2 rounded-lg text-xs cursor-pointer transition-smooth hover:bg-[var(--color-border)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => { setIsCreating(true); setEditingId(null); }}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium cursor-pointer transition-smooth hover:bg-[var(--color-secondary)]"
              style={{ color: "var(--color-muted-foreground)", border: "1px dashed var(--color-border)" }}
            >
              <Plus size={12} />
              Create Label
            </button>
          )}
        </>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="mt-2 p-3 rounded-xl" style={{ background: "var(--color-column-todo)", border: "1px solid var(--color-destructive)" }}>
          <p className="text-xs font-medium mb-2">Delete this label? It will be removed from all cards.</p>
          <div className="flex gap-1">
            <button
              onClick={() => handleDelete(deleteTarget)}
              disabled={loading}
              className="flex-1 py-1 rounded-lg text-xs font-medium cursor-pointer transition-smooth disabled:opacity-50"
              style={{ background: "var(--color-destructive)", color: "white" }}
            >
              Delete
            </button>
            <button
              onClick={() => setDeleteTarget(null)}
              className="py-1 px-3 rounded-lg text-xs cursor-pointer transition-smooth hover:bg-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
