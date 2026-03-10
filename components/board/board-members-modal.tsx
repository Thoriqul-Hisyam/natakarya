"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { addBoardMember, removeBoardMember, updateBoardMemberRole } from "@/actions/board-member";
import { toast } from "sonner";
import { X, UserPlus, ShieldAlert, MoreVertical } from "lucide-react";
import { MemberRole } from "@prisma/client";
import { useSession } from "next-auth/react";

interface BoardMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: any; // The board object with .workspace.members and .members
}

export function BoardMembersModal({ isOpen, onClose, board }: BoardMembersModalProps) {
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const [inviteEmail, setInviteEmail] = useState("");

  const isBoardOwner = board.members?.some(
    (m: any) => m.userId === session?.user?.id && m.role === "OWNER"
  );
  
  const currentWorkspaceMember = board.workspace?.members?.find(
    (m: any) => m.userId === session?.user?.id
  );
  const isWsAdminOrOwner = currentWorkspaceMember?.role === "OWNER" || currentWorkspaceMember?.role === "ADMIN";

  const canManageMembers = isBoardOwner || isWsAdminOrOwner;

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !canManageMembers) return;

    startTransition(async () => {
      try {
        await addBoardMember(board.id, inviteEmail, "MEMBER");
        toast.success("Member added to board");
        setInviteEmail("");
      } catch (error: any) {
        toast.error(error.message || "Failed to add member");
      }
    });
  };

  const handleRemove = (memberId: string) => {
    if (!canManageMembers) return;
    startTransition(async () => {
      try {
        await removeBoardMember(board.id, memberId);
        toast.success("Member removed from board");
      } catch (error: any) {
        toast.error(error.message || "Failed to remove member");
      }
    });
  };

  const handleUpdateRole = (memberId: string, role: MemberRole) => {
    if (!canManageMembers) return;
    startTransition(async () => {
      try {
        await updateBoardMemberRole(board.id, memberId, role);
        toast.success("Role updated");
      } catch (error: any) {
        toast.error(error.message || "Failed to update role");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-[var(--color-background)] border-[var(--color-border)]">
        <div className="p-6">
          <DialogHeader className="mb-6 flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              Board Members
            </DialogTitle>
          </DialogHeader>

          {canManageMembers && (
            <div className="mb-6">
              <form onSubmit={handleInvite} className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[var(--color-foreground)]">
                  Invite Workspace Member
                </label>
                <div className="flex gap-2 text-[var(--color-foreground)]">
                  <input
                    type="email"
                    placeholder="Enter email address..."
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    disabled={isPending}
                    className="flex-1 px-3 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-smooth disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={isPending || !inviteEmail.trim()}
                    className="px-4 py-2 bg-[var(--color-primary)] text-white text-sm font-medium rounded-xl hover:bg-opacity-90 transition-smooth disabled:opacity-50 flex items-center justify-center min-w-[80px]"
                  >
                    {isPending ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Invite"
                    )}
                  </button>
                </div>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Users must already be members of the {board.workspace?.name} workspace.
                </p>
              </form>
            </div>
          )}

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {board.members?.length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)] text-center py-4">
                No members in this private board.
              </p>
            ) : (
              board.members?.map((member: any) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-secondary)] flex items-center justify-center text-sm font-bold overflow-hidden shrink-0">
                      {member.user.image ? (
                        <img
                          src={member.user.image}
                          alt={member.user.name || ""}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (member.user.name?.charAt(0) || "?").toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-foreground)]">
                        {member.user.name}
                      </p>
                      <p className="text-xs text-[var(--color-muted-foreground)] truncate max-w-[150px]">
                        {member.user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {canManageMembers && member.userId !== session?.user?.id ? (
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleUpdateRole(member.id, e.target.value as MemberRole)
                        }
                        disabled={isPending || member.role === "OWNER"}
                        className="text-xs py-1.5 px-2 rounded-lg bg-[var(--color-secondary)] border border-[var(--color-border)] text-[var(--color-foreground)] focus:outline-none"
                      >
                        <option value="MEMBER">Member</option>
                        <option value="ADMIN">Admin</option>
                        {member.role === "OWNER" && <option value="OWNER">Owner</option>}
                      </select>
                    ) : (
                      <span className="text-xs font-medium px-2 py-1 bg-[var(--color-secondary)] rounded-md text-[var(--color-muted-foreground)]">
                        {member.role}
                      </span>
                    )}

                    {canManageMembers && member.userId !== session?.user?.id && member.role !== "OWNER" && (
                      <button
                        onClick={() => handleRemove(member.id)}
                        disabled={isPending}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-smooth disabled:opacity-50"
                        title="Remove member"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
