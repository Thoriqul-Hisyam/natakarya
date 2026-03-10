"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/actions/activity";
import { pusherServer } from "@/lib/pusher";
import { checkPermission } from "@/lib/permissions";
import { MemberRole } from "@prisma/client";

export async function createCard(data: {
  title: string;
  listId: string;
  boardId: string;
  description?: string;
}) {
  const board = await db.board.findUnique({
    where: { id: data.boardId },
    select: { workspaceId: true }
  });
  if (!board) throw new Error("Board not found");

  await checkPermission(board.workspaceId, [MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER]);

  const lastCard = await db.card.findFirst({
    where: { listId: data.listId },
    orderBy: { position: "desc" },
  });

  const card = await db.card.create({
    data: {
      title: data.title,
      description: data.description,
      listId: data.listId,
      position: (lastCard?.position ?? -1) + 1,
    },
  });

  // Log activity
  await logActivity({
    boardId: data.boardId,
    cardId: card.id,
    action: "created card",
    entityId: card.id,
    entityType: "CARD",
    entityTitle: card.title,
  });

  // Trigger real-time update
  await pusherServer.trigger(`board-${data.boardId}`, "board-updated", {});

  revalidatePath(`/dashboard/board/${data.boardId}`);
  return card;
}

export async function updateCard(
  cardId: string,
  data: {
    title?: string;
    description?: string;
    dueDate?: Date | null;
    progress?: number;
  }
) {
  const card = await db.card.findUnique({ where: { id: cardId }, include: { list: true } });
  if (!card) throw new Error("Card not found");

  const board = await db.board.findUnique({
    where: { id: card.list.boardId },
    select: { workspaceId: true }
  });
  if (!board) throw new Error("Board not found");

  await checkPermission(board.workspaceId, [MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER]);

  const updatedCard = await db.card.update({
    where: { id: cardId },
    data,
    include: { list: true },
  });

  await pusherServer.trigger(`board-${updatedCard.list.boardId}`, "board-updated", {});
  revalidatePath(`/dashboard/board/${updatedCard.list.boardId}`);
  return updatedCard;
}

export async function deleteCard(cardId: string) {
  const card = await db.card.findUnique({
    where: { id: cardId },
    include: { list: true },
  });
  if (!card) throw new Error("Card not found");

  const board = await db.board.findUnique({
    where: { id: card.list.boardId },
    select: { workspaceId: true }
  });
  if (!board) throw new Error("Board not found");

  await checkPermission(board.workspaceId, [MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER]);

  await db.card.delete({ where: { id: cardId } });
  
  await pusherServer.trigger(`board-${card.list.boardId}`, "board-updated", {});
  revalidatePath(`/dashboard/board/${card.list.boardId}`);
}

export async function moveCard(data: {
  cardId: string;
  sourceListId: string;
  destListId: string;
  newPosition: number;
  boardId: string;
}) {
  const board = await db.board.findUnique({
    where: { id: data.boardId },
    select: { workspaceId: true }
  });
  if (!board) throw new Error("Board not found");

  await checkPermission(board.workspaceId, [MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER]);

  // Update the card's list and position
  await db.card.update({
    where: { id: data.cardId },
    data: {
      listId: data.destListId,
      position: data.newPosition,
    },
  });

  // Reorder cards in the destination list
  const destCards = await db.card.findMany({
    where: {
      listId: data.destListId,
      id: { not: data.cardId },
      isArchived: false,
    },
    orderBy: { position: "asc" },
  });

  const updates = destCards.map((card: any, index: number) => {
    const position = index >= data.newPosition ? index + 1 : index;
    return db.card.update({
      where: { id: card.id },
      data: { position },
    });
  });

  if (updates.length > 0) {
    await db.$transaction(updates);
  }

  // Log activity
  const cardData = await db.card.findUnique({ where: { id: data.cardId }, select: { title: true } });
  if (cardData) {
    await logActivity({
      boardId: data.boardId,
      cardId: data.cardId,
      action: "moved card",
      entityId: data.cardId,
      entityType: "CARD",
      entityTitle: cardData.title,
    });
  }

  revalidatePath(`/dashboard/board/${data.boardId}`);
}

export async function assignMember(cardId: string, userId: string, boardId: string) {
  const board = await db.board.findUnique({
    where: { id: boardId },
    select: { workspaceId: true }
  });
  if (!board) throw new Error("Board not found");

  await checkPermission(board.workspaceId, [MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER]);

  const existing = await db.cardMember.findFirst({
    where: { cardId, userId },
  });

  const card = await db.card.findUnique({ where: { id: cardId }, select: { title: true } });

  if (existing) {
    await db.cardMember.delete({ where: { id: existing.id } });
    if (card) {
      await logActivity({
        boardId, cardId, action: "removed member from", entityId: cardId, entityType: "CARD", entityTitle: card.title,
      });
    }
  } else {
    await db.cardMember.create({
      data: { cardId, userId },
    });
    if (card) {
      await logActivity({
        boardId, cardId, action: "assigned member to", entityId: cardId, entityType: "CARD", entityTitle: card.title,
      });
    }
  }

  revalidatePath(`/dashboard/board/${boardId}`);
}

export async function addLabel(cardId: string, labelId: string, boardId: string) {
  const board = await db.board.findUnique({
    where: { id: boardId },
    select: { workspaceId: true }
  });
  if (!board) throw new Error("Board not found");

  await checkPermission(board.workspaceId, [MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER]);

  const existing = await db.cardLabel.findFirst({
    where: { cardId, labelId },
  });

  const card = await db.card.findUnique({ where: { id: cardId }, select: { title: true } });

  if (existing) {
    await db.cardLabel.delete({ where: { id: existing.id } });
  } else {
    await db.cardLabel.create({
      data: { cardId, labelId },
    });
    if (card) {
      await logActivity({
        boardId, cardId, action: "added a label to", entityId: cardId, entityType: "CARD", entityTitle: card.title,
      });
    }
  }

  revalidatePath(`/dashboard/board/${boardId}`);
}

export async function getCardById(cardId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const card = await db.card.findUnique({
    where: { id: cardId },
    include: {
      list: { include: { board: true } },
      labels: { include: { label: true } },
      members: { include: { user: true } },
      checklists: {
        include: { items: { orderBy: { position: "asc" } } },
      },
      comments: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
      },
      attachments: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return card;
}
