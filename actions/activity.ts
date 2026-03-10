"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getCardActivities(cardId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const activities = await db.activity.findMany({
    where: {
      cardId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return activities;
}

export async function getBoardActivities(boardId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify access
  const board = await db.board.findUnique({
    where: { id: boardId },
    include: {
      workspace: {
        include: {
          members: {
            where: { userId: session.user.id },
          },
        },
      },
    },
  });

  if (!board || board.workspace.members.length === 0) {
    throw new Error("Board not found or unauthorized");
  }

  const activities = await db.activity.findMany({
    where: {
      boardId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      card: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50, // Limit to recent 50
  });

  return activities;
}

export async function logActivity({
  boardId,
  cardId,
  action,
  entityId,
  entityType,
  entityTitle,
}: {
  boardId: string;
  cardId?: string;
  action: string;
  entityId: string;
  entityType: string;
  entityTitle: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  try {
    const activity = await db.activity.create({
      data: {
        boardId,
        cardId,
        userId: session.user.id,
        action,
        entityId,
        entityType,
        entityTitle,
      },
    });

    return activity;
  } catch (error) {
    console.error("Failed to log activity", error);
    return null;
  }
}

export async function getGlobalActivities() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const activities = await db.activity.findMany({
    where: {
      board: {
        workspace: {
          members: {
            some: { userId: session.user.id },
          },
        },
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      board: {
        select: {
          id: true,
          title: true,
        },
      },
      card: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  return activities;
}
