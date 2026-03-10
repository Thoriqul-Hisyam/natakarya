"use client";

import { useState } from "react";
import { 
  Users, 
  Settings as SettingsIcon, 
  UserPlus, 
  Trash2, 
  Save, 
  Loader2,
  ShieldCheck,
  User,
  MoreVertical,
  X
} from "lucide-react";
import { 
  updateWorkspace, 
  deleteWorkspace, 
  leaveWorkspace,
  inviteMember, 
  updateMemberRole, 
  removeMember 
} from "@/actions/workspace";
import { MemberRole } from "@prisma/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/modals/confirm-modal";

interface WorkspaceSettingsFormProps {
  workspace: any;
  isOwner: boolean;
  isAdmin: boolean;
  currentUserId: string;
}

export function WorkspaceSettingsForm({ workspace, isOwner, isAdmin, currentUserId }: WorkspaceSettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(workspace.name);
  const [description, setDescription] = useState(workspace.description || "");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>(MemberRole.MEMBER);
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleUpdate = async () => {
    if (!name.trim()) return;
    setIsUpdating(true);
    try {
      await updateWorkspace(workspace.id, { name: name.trim(), description: description.trim() });
      toast.success("Workspace updated");
      router.refresh();
    } catch {
      toast.error("Failed to update workspace");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    try {
      await inviteMember(workspace.id, inviteEmail.trim(), inviteRole);
      toast.success("Member invited");
      setInviteEmail("");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to invite member");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, role: any) => {
    try {
      await updateMemberRole(workspace.id, memberId, role);
      toast.success("Role updated");
      router.refresh();
    } catch {
      toast.error("Failed to update role");
    }
  };

  const handleRemove = async (memberId: string) => {
    try {
      await removeMember(workspace.id, memberId);
      toast.success("Member removed");
      router.refresh();
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteWorkspace(workspace.id);
      toast.success("Workspace deleted");
      router.push("/dashboard");
    } catch {
      toast.error("Failed to delete workspace");
      setIsDeleting(false);
    }
  };

  const handleLeave = async () => {
    setIsLeaving(true);
    try {
      await leaveWorkspace(workspace.id);
      toast.success("Left workspace successfully");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to leave workspace");
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Workspace Profile */}
      {isAdmin && (
        <section className="bg-white rounded-2xl p-6 border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <SettingsIcon size={18} className="text-muted-foreground" />
            <h2 className="text-lg font-semibold">General</h2>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Workspace Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-[var(--color-border)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-smooth text-sm bg-transparent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-smooth text-sm bg-transparent resize-none"
                placeholder="What is this workspace for?"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button 
                onClick={handleUpdate}
                disabled={isUpdating || (name === workspace.name && description === workspace.description)}
                className="flex items-center gap-2 py-2 px-6 rounded-xl font-semibold text-sm transition-smooth bg-[var(--color-foreground)] text-white enabled:hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Changes
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Members & Invitation */}
      <section className="bg-white rounded-2xl p-6 border border-[var(--color-border)] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-muted-foreground" />
            <h2 className="text-lg font-semibold">Team Members</h2>
          </div>
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-secondary text-muted-foreground">
            {workspace.members.length} member{workspace.members.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Invite Form */}
        {isAdmin && (
          <form onSubmit={handleInvite} className="flex flex-wrap gap-2 mb-8 bg-[var(--color-secondary)]/30 p-3 rounded-xl">
            <div className="flex-1 min-w-[200px]">
              <input
                type="email"
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[var(--color-border)] bg-white outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 text-sm"
                required
              />
            </div>
            <select 
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
              className="h-10 px-3 rounded-lg border border-[var(--color-border)] bg-white outline-none text-sm cursor-pointer"
            >
              <option value={MemberRole.MEMBER}>Member</option>
              <option value={MemberRole.ADMIN}>Admin</option>
              <option value={MemberRole.VIEWER}>Viewer</option>
            </select>
            <button 
              type="submit"
              disabled={isInviting || !inviteEmail}
              className="h-10 px-4 rounded-lg font-semibold text-sm bg-[var(--color-primary)] text-[var(--color-primary-foreground)] flex items-center gap-2 transition-smooth hover:opacity-90 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isInviting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              Invite
            </button>
          </form>
        )}

        {/* Member List */}
        <div className="space-y-1">
          {workspace.members.map((member: any) => (
            <div 
              key={member.id} 
              className="flex items-center justify-between p-3 rounded-xl transition-smooth hover:bg-[var(--color-secondary)] group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-muted)] overflow-hidden flex items-center justify-center border-2 border-white shadow-sm">
                  {member.user.image ? (
                    <img src={member.user.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User size={20} className="text-muted-foreground" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{member.user.name || member.user.email}</span>
                    {member.role === MemberRole.OWNER && (
                      <span className="flex items-center gap-0.5 text-[8px] font-bold uppercase tracking-widest bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full border border-amber-200">
                        <ShieldCheck size={8} /> OWNER
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{member.user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isAdmin && member.role !== MemberRole.OWNER && member.userId !== currentUserId ? (
                  <>
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      className="bg-transparent text-xs font-medium outline-none cursor-pointer hover:bg-black/5 rounded-md px-1"
                    >
                      <option value={MemberRole.ADMIN}>Admin</option>
                      <option value={MemberRole.MEMBER}>Member</option>
                      <option value={MemberRole.VIEWER}>Viewer</option>
                    </select>
                    <ConfirmModal
                      title="Remove Member"
                      description="Are you sure you want to remove this member? They will lose access to all boards in this workspace."
                      onConfirm={() => handleRemove(member.id)}
                    >
                      <button 
                        className="p-2 text-muted-foreground hover:text-[var(--color-destructive)] opacity-0 group-hover:opacity-100 transition-smooth cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </ConfirmModal>
                  </>
                ) : (
                  <span className="text-xs font-medium text-muted-foreground pr-2 italic">
                    {member.role === MemberRole.OWNER ? "Owner" : member.role.toLowerCase()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-red-50/50 rounded-2xl p-6 border border-red-200 shadow-sm mt-12">
        <div className="flex items-center gap-2 mb-6">
          <Trash2 size={18} className="text-red-600" />
          <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
        </div>
        
        <div className="space-y-6">
          {/* Leave Workspace Option */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-red-900">Leave this workspace</h3>
              <p className="text-xs text-red-700 mt-1 max-w-lg">
                You will lose access to all boards and data in this workspace.
              </p>
            </div>
            <ConfirmModal
              title="Leave Workspace"
              description="Are you sure you want to leave this workspace? This action cannot be undone."
              onConfirm={handleLeave}
            >
              <button 
                disabled={isLeaving}
                className="py-2.5 px-6 rounded-xl font-bold text-sm bg-amber-600 text-white transition-smooth hover:bg-amber-700 active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {isLeaving ? <Loader2 size={18} className="animate-spin" /> : "Leave Workspace"}
              </button>
            </ConfirmModal>
          </div>

          {/* Delete Workspace Option (Only for Owner) */}
          {isOwner && (
            <div className="pt-6 border-t border-red-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-red-900">Delete this workspace</h3>
                <p className="text-xs text-red-700 mt-1 max-w-lg">
                  Once you delete a workspace, there is no going back. Please be certain.
                </p>
              </div>
              <ConfirmModal
                title="Delete Workspace"
                description="CRITICAL: Are you sure you want to delete this workspace? All boards and data will be permanently removed. This action is irreversible."
                onConfirm={handleDelete}
              >
                <button 
                  disabled={isDeleting}
                  className="py-2.5 px-6 rounded-xl font-bold text-sm bg-red-600 text-white transition-smooth hover:bg-red-700 active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 size={18} className="animate-spin" /> : "Delete Workspace"}
                </button>
              </ConfirmModal>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
