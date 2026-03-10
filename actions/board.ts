"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { checkPermission } from "@/lib/permissions";
import { MemberRole } from "@prisma/client";

export async function createBoard(data: {
  title: string;
  workspaceId: string;
  visibility?: string;
}) {
  await checkPermission(data.workspaceId, [MemberRole.OWNER, MemberRole.ADMIN]);

  const board = await db.board.create({
    data: {
      title: data.title,
      workspaceId: data.workspaceId,
      visibility: data.visibility || "WORKSPACE",
      // Create default lists
      lists: {
        createMany: {
          data: [
            { title: "To Do", position: 0 },
            { title: "In Progress", position: 1 },
            { title: "In Review", position: 2 },
            { title: "Completed", position: 3 },
          ],
        },
      },
      // Create default labels
      labels: {
        createMany: {
          data: [
            { name: "High", color: "#ef4444" },
            { name: "Medium", color: "#f59e0b" },
            { name: "Low", color: "#22c55e" },
            { name: "Bug", color: "#dc2626" },
            { name: "Feature", color: "#6366f1" },
            { name: "Urgent", color: "#f97316" },
          ],
        },
      },
    },
  });

  revalidatePath(`/dashboard/workspace/${data.workspaceId}`);
  return board;
}

export async function getBoardById(boardId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const board = await db.board.findFirst({
    where: {
      id: boardId,
      workspace: {
        members: {
          some: { userId: session.user.id },
        },
      },
      OR: [
        { visibility: "WORKSPACE" },
        { members: { some: { userId: session.user.id } } },
        { workspace: { members: { some: { userId: session.user.id, role: { in: ["OWNER", "ADMIN"] } } } } }
      ]
    },
    include: {
      workspace: {
        include: {
          members: {
            include: { user: true },
          },
        },
      },
      members: {
        include: { user: true },
        orderBy: { role: "asc" }
      },
      labels: true,
      lists: {
        where: {},
        orderBy: { position: "asc" },
        include: {
          cards: {
            where: { isArchived: false },
            orderBy: { position: "asc" },
            include: {
              labels: { include: { label: true } },
              members: { include: { user: true } },
              checklists: {
                include: {
                  items: true,
                },
              },
              attachments: {
                include: { user: true },
                orderBy: { createdAt: "desc" },
              },
              comments: {
                include: { user: true },
                orderBy: { createdAt: "desc" },
              },
              _count: {
                select: {
                  comments: true,
                  attachments: true,
                },
              },
            },
          },
        },
      },
      favorites: {
        where: { userId: session.user.id },
      },
      activities: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  return board;
}

export async function updateBoard(
  boardId: string,
  data: { title?: string; description?: string; visibility?: string; background?: string }
) {
  const board = await db.board.findUnique({ where: { id: boardId }, select: { workspaceId: true } });
  if (!board) throw new Error("Board not found");
  
  await checkPermission(board.workspaceId, [MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER]);

  const updatedBoard = await db.board.update({
    where: { id: boardId },
    data,
  });

  revalidatePath(`/dashboard/board/${boardId}`);
  return updatedBoard;
}

export async function archiveBoard(boardId: string) {
  const board = await db.board.findUnique({ where: { id: boardId }, select: { workspaceId: true } });
  if (!board) throw new Error("Board not found");
  
  await checkPermission(board.workspaceId, [MemberRole.OWNER, MemberRole.ADMIN]);

  await db.board.update({
    where: { id: boardId },
    data: { isArchived: true },
  });

  revalidatePath("/dashboard");
}

export async function deleteBoard(boardId: string) {
  const board = await db.board.findUnique({ where: { id: boardId }, select: { workspaceId: true } });
  if (!board) throw new Error("Board not found");
  
  await checkPermission(board.workspaceId, [MemberRole.OWNER]);

  await db.board.delete({ where: { id: boardId } });
  revalidatePath(`/dashboard/workspace/${board?.workspaceId}`);
}

export async function toggleFavorite(boardId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await db.boardFavorite.findFirst({
    where: { boardId, userId: session.user.id },
  });

  if (existing) {
    await db.boardFavorite.delete({ where: { id: existing.id } });
  } else {
    await db.boardFavorite.create({
      data: { boardId, userId: session.user.id },
    });
  }

  revalidatePath(`/dashboard/board/${boardId}`);
}

export async function getRecentBoards() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const boards = await db.board.findMany({
    where: {
      isArchived: false,
      workspace: {
        members: {
          some: { userId: session.user.id },
        },
      },
      OR: [
        { visibility: "WORKSPACE" },
        { members: { some: { userId: session.user.id } } },
        { workspace: { members: { some: { userId: session.user.id, role: { in: ["OWNER", "ADMIN"] } } } } }
      ]
    },
    include: {
      workspace: true,
      _count: {
        select: { lists: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 8,
  });

  return boards;
}
