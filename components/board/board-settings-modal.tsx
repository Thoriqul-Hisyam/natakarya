"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateBoard, deleteBoard } from "@/actions/board";
import { leaveBoard } from "@/actions/board-member";
import { toast } from "sonner";
import { Check, Trash2, LogOut, AlertTriangle } from "lucide-react";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface BoardSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: any;
}

const BACKGROUNDS = [
  { id: "default", value: "", name: "Default (Gray)", color: "var(--color-background)" },
  { id: "blue", value: "linear-gradient(to right bottom, #2563eb, #1d4ed8)", name: "Blue Gradient", color: "#2563eb" },
  { id: "purple", value: "linear-gradient(to right bottom, #7c3aed, #5b21b6)", name: "Purple Gradient", color: "#7c3aed" },
  { id: "pink", value: "linear-gradient(to right bottom, #db2777, #be185d)", name: "Pink Gradient", color: "#db2777" },
  { id: "green", value: "linear-gradient(to right bottom, #059669, #047857)", name: "Green Gradient", color: "#059669" },
  { id: "orange", value: "linear-gradient(to right bottom, #ea580c, #c2410c)", name: "Orange Gradient", color: "#ea580c" },
  { id: "teal", value: "linear-gradient(to right bottom, #0d9488, #0f766e)", name: "Teal Gradient", color: "#0d9488" },
  { id: "dark", value: "linear-gradient(to right bottom, #1f2937, #111827)", name: "Dark Gradient", color: "#1f2937" },
];

export function BoardSettingsModal({ isOpen, onClose, board }: BoardSettingsModalProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(board.title);
  const [visibility, setVisibility] = useState(board.visibility);
  const [background, setBackground] = useState(board.background || "");

  // Determine roles
  const workspaceMember = board.workspace?.members?.find(
    (m: any) => m.userId === session?.user?.id
  );
  const boardMember = board.members?.find(
    (m: any) => m.userId === session?.user?.id
  );

  const isWorkspaceOwner = workspaceMember?.role === "OWNER";
  const isWorkspaceAdmin = workspaceMember?.role === "ADMIN";
  const isBoardOwner = boardMember?.role === "OWNER";
  
  // Can delete if Workspace Owner/Admin or Board Owner
  const canDelete = isWorkspaceOwner || isWorkspaceAdmin || isBoardOwner;
  
  // Can leave if a member but NOT the board owner
  const canLeave = !!boardMember && !isBoardOwner;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    startTransition(async () => {
      try {
        await updateBoard(board.id, {
          title: title.trim(),
          visibility,
          background,
        });
        toast.success("Board settings updated");
        onClose();
      } catch (error: any) {
        toast.error(error.message || "Failed to update board");
      }
    });
  };

  const onDelete = () => {
    startTransition(async () => {
      try {
        await deleteBoard(board.id);
        toast.success("Board deleted successfully");
        router.push(`/dashboard/workspace/${board.workspaceId}`);
        onClose();
      } catch (error: any) {
        toast.error(error.message || "Failed to delete board");
      }
    });
  };

  const onLeave = () => {
    startTransition(async () => {
      try {
        await leaveBoard(board.id);
        toast.success("You have left the board");
        router.push("/dashboard");
        onClose();
      } catch (error: any) {
        toast.error(error.message || "Failed to leave board");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-[var(--color-background)] border-[var(--color-border)]">
        <div className="p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-semibold">
              Board Settings
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-foreground)]">
                Board Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isPending}
                className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-smooth disabled:opacity-50 text-[var(--color-foreground)]"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-foreground)]">
                Visibility
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                disabled={isPending}
                className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-smooth disabled:opacity-50 text-[var(--color-foreground)]"
              >
                <option value="WORKSPACE">Workspace (All members can view)</option>
                <option value="PRIVATE">Private (Only invited members)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-foreground)]">
                Background
              </label>
              <div className="grid grid-cols-4 gap-2">
                {BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => setBackground(bg.value)}
                    className="h-12 rounded-lg border-2 flex items-center justify-center transition-smooth"
                    style={{
                      background: bg.value || "var(--color-secondary)",
                      borderColor: background === bg.value ? "var(--color-primary)" : "transparent",
                    }}
                    title={bg.name}
                  >
                    {background === bg.value && (
                      <div className="bg-black/30 w-full h-full rounded-md flex items-center justify-center">
                        <Check size={20} className="text-white drop-shadow-md" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-[var(--color-secondary)] transition-smooth disabled:opacity-50 text-[var(--color-foreground)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || !title.trim()}
                className="px-4 py-2 bg-[var(--color-primary)] text-white text-sm font-medium rounded-xl hover:bg-opacity-90 transition-smooth disabled:opacity-50 flex items-center justify-center min-w-[80px]"
              >
                {isPending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>

          {(canDelete || canLeave) && (
            <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
              <div className="flex items-center gap-2 mb-4 text-red-500">
                <AlertTriangle size={18} />
                <h3 className="text-sm font-bold uppercase tracking-wider">Danger Zone</h3>
              </div>
              
              <div className="space-y-3">
                {canLeave && (
                  <div className="flex items-center justify-between p-4 rounded-xl border border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900/50">
                    <div>
                      <p className="text-sm font-bold text-red-700 dark:text-red-400">Leave Board</p>
                      <p className="text-xs text-red-600/70 dark:text-red-400/70">You will lose access to this board.</p>
                    </div>
                    <ConfirmModal
                      title="Leave Board?"
                      description="Are you sure you want to leave this board? You will need to be invited again to regain access."
                      onConfirm={onLeave}
                    >
                      <button
                        type="button"
                        disabled={isPending}
                        className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-900/60 rounded-lg text-xs font-bold transition-smooth"
                      >
                        <LogOut size={14} />
                        Leave
                      </button>
                    </ConfirmModal>
                  </div>
                )}

                {canDelete && (
                  <div className="flex items-center justify-between p-4 rounded-xl border border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900/50">
                    <div>
                      <p className="text-sm font-bold text-red-700 dark:text-red-400">Delete Board</p>
                      <p className="text-xs text-red-600/70 dark:text-red-400/70">This action is permanent and cannot be undone.</p>
                    </div>
                    <ConfirmModal
                      title="Delete Board?"
                      description="Everything inside this board (lists, tasks, comments) will be permanently deleted."
                      onConfirm={onDelete}
                    >
                      <button
                        type="button"
                        disabled={isPending}
                        className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg text-xs font-bold transition-smooth shadow-sm"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </ConfirmModal>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
