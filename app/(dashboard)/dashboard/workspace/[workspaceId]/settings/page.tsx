import { getWorkspaceById } from "@/actions/workspace";
import { notFound } from "next/navigation";
import { WorkspaceSettingsForm } from "@/components/workspace/workspace-settings-form";
import { auth } from "@/lib/auth";
import { MemberRole } from "@prisma/client";

export default async function WorkspaceSettingsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const workspace = await getWorkspaceById(workspaceId);
  const session = await auth();

  if (!workspace) return notFound();

  const currentUserMember = workspace.members.find(
    (m: any) => m.userId === session?.user?.id
  );

  const isOwner = currentUserMember?.role === MemberRole.OWNER;
  const isAdmin = currentUserMember?.role === MemberRole.ADMIN || isOwner;

  if (!currentUserMember) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h1 className="text-2xl font-bold">Unauthorized</h1>
        <p className="text-muted-foreground">You are not a member of this workspace.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Workspace Settings</h1>
        <p className="text-muted-foreground mt-1">Manage workspace details and team members.</p>
      </div>

      <WorkspaceSettingsForm 
        workspace={workspace} 
        isOwner={isOwner} 
        isAdmin={isAdmin} 
        currentUserId={session?.user?.id || ""} 
      />
    </div>
  );
}
