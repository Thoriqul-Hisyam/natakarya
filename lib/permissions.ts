import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { MemberRole } from "@prisma/client";

export async function getMemberRole(workspaceId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const member = await db.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.user.id,
        workspaceId,
      },
    },
  });

  return member?.role || null;
}

export async function checkPermission(workspaceId: string, allowedRoles: MemberRole[]) {
  const role = await getMemberRole(workspaceId);
  if (!role || !allowedRoles.includes(role)) {
    throw new Error("You do not have permission to perform this action.");
  }
  return role;
}
