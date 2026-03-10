"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { checkPermission } from "@/lib/permissions";
import { MemberRole } from "@prisma/client";

export async function createWorkspace(data: { name: string; description?: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const workspace = await db.workspace.create({
    data: {
      name: data.name,
      description: data.description,
      members: {
        create: {
          userId: session.user.id,
          role: MemberRole.OWNER,
        },
      },
    },
  });

  revalidatePath("/dashboard");
  return workspace;
}

export async function getWorkspaces() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const workspaces = await db.workspace.findMany({
    where: {
      members: {
        some: { userId: session.user.id },
      },
    },
    include: {
      members: {
        include: { user: true },
        take: 5,
      },
      boards: {
        where: { 
          isArchived: false,
          OR: [
            { visibility: "WORKSPACE" },
            { members: { some: { userId: session.user.id } } },
            { workspace: { members: { some: { userId: session.user.id, role: { in: ["OWNER", "ADMIN"] } } } } }
          ]
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
      },
      _count: {
        select: {
          members: true,
          boards: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return workspaces;
}

export async function getWorkspaceById(workspaceId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const workspace = await db.workspace.findFirst({
    where: {
      id: workspaceId,
      members: {
        some: { userId: session.user.id },
      },
    },
    include: {
      members: {
        include: { user: true },
        orderBy: { role: "asc" },
      },
      boards: {
        where: { 
          isArchived: false,
          OR: [
            { visibility: "WORKSPACE" },
            { members: { some: { userId: session.user.id } } },
            { workspace: { members: { some: { userId: session.user.id, role: { in: ["OWNER", "ADMIN"] } } } } }
          ]
        },
        orderBy: { updatedAt: "desc" },
      },
      _count: {
        select: { members: true, boards: true },
      },
    },
  });

  return workspace;
}

export async function updateWorkspace(
  workspaceId: string,
  data: { name?: string; description?: string }
) {
  await checkPermission(workspaceId, [MemberRole.OWNER, MemberRole.ADMIN]);

  const workspace = await db.workspace.update({
    where: { id: workspaceId },
    data,
  });

  revalidatePath(`/dashboard/workspace/${workspaceId}`);
  revalidatePath(`/dashboard/workspace/${workspaceId}/settings`);
  return workspace;
}

export async function deleteWorkspace(workspaceId: string) {
  await checkPermission(workspaceId, [MemberRole.OWNER]);

  await db.workspace.delete({ where: { id: workspaceId } });
  revalidatePath("/dashboard");
}

export async function leaveWorkspace(workspaceId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const member = await db.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.user.id,
        workspaceId,
      },
    },
  });

  if (!member) throw new Error("You are not a member of this workspace");
  if (member.role === MemberRole.OWNER) {
    // If owner, check if there are other owners
    const ownerCount = await db.workspaceMember.count({
      where: { workspaceId, role: MemberRole.OWNER },
    });
    if (ownerCount <= 1) {
      throw new Error("You must transfer ownership or delete the workspace before leaving.");
    }
  }

  await db.workspaceMember.delete({
    where: { id: member.id },
  });

  revalidatePath("/dashboard");
}

export async function inviteMember(workspaceId: string, email: string, role: MemberRole = MemberRole.MEMBER) {
  await checkPermission(workspaceId, [MemberRole.OWNER, MemberRole.ADMIN]);

  const user = await db.user.findUnique({ where: { email } });
  if (!user) throw new Error("User not found. They need to sign up first.");

  const existingMember = await db.workspaceMember.findFirst({
    where: { workspaceId, userId: user.id },
  });

  if (existingMember) throw new Error("User is already a member");

  await db.workspaceMember.create({
    data: {
      workspaceId,
      userId: user.id,
      role,
    },
  });

  revalidatePath(`/dashboard/workspace/${workspaceId}/settings`);
}

export async function updateMemberRole(
  workspaceId: string,
  memberId: string,
  role: MemberRole
) {
  await checkPermission(workspaceId, [MemberRole.OWNER, MemberRole.ADMIN]);

  // Prevent changing owner role unless current user is also owner
  const targetMember = await db.workspaceMember.findUnique({ where: { id: memberId } });
  if (targetMember?.role === MemberRole.OWNER) {
    const currentRole = await checkPermission(workspaceId, [MemberRole.OWNER]);
    if (currentRole !== MemberRole.OWNER) throw new Error("Only owners can change owner roles");
  }

  await db.workspaceMember.update({
    where: { id: memberId },
    data: { role },
  });

  revalidatePath(`/dashboard/workspace/${workspaceId}/settings`);
}

export async function removeMember(workspaceId: string, memberId: string) {
  await checkPermission(workspaceId, [MemberRole.OWNER, MemberRole.ADMIN]);

  const targetMember = await db.workspaceMember.findUnique({
    where: { id: memberId },
  });

  if (!targetMember) throw new Error("Member not found");
  if (targetMember.role === MemberRole.OWNER) throw new Error("Cannot remove the owner");

  await db.workspaceMember.delete({ where: { id: memberId } });
  revalidatePath(`/dashboard/workspace/${workspaceId}/settings`);
}
