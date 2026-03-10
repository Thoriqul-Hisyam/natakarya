"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { pusherServer } from "@/lib/pusher";

export async function createComment(data: {
  content: string;
  cardId: string;
  boardId: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const comment = await db.comment.create({
    data: {
      content: data.content,
      cardId: data.cardId,
      userId: session.user.id,
    },
    include: { user: true },
  });

  await pusherServer.trigger(`board-${data.boardId}`, "board-updated", {});
  revalidatePath(`/dashboard/board/${data.boardId}`);
  return comment;
}

export async function deleteComment(commentId: string, boardId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const comment = await db.comment.findUnique({ where: { id: commentId } });
  if (!comment || comment.userId !== session.user.id) {
    throw new Error("Not authorized to delete this comment");
  }

  await db.comment.delete({ where: { id: commentId } });
  await pusherServer.trigger(`board-${boardId}`, "board-updated", {});
  revalidatePath(`/dashboard/board/${boardId}`);
}

export async function createChecklist(data: {
  title: string;
  cardId: string;
  boardId: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const checklist = await db.checklist.create({
    data: {
      title: data.title,
      cardId: data.cardId,
    },
    include: { items: true },
  });

  await pusherServer.trigger(`board-${data.boardId}`, "board-updated", {});
  revalidatePath(`/dashboard/board/${data.boardId}`);
  return checklist;
}

export async function deleteChecklist(checklistId: string, boardId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db.checklist.delete({ where: { id: checklistId } });
  await pusherServer.trigger(`board-${boardId}`, "board-updated", {});
  revalidatePath(`/dashboard/board/${boardId}`);
}

export async function createChecklistItem(data: {
  title: string;
  checklistId: string;
  boardId: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const lastItem = await db.checklistItem.findFirst({
    where: { checklistId: data.checklistId },
    orderBy: { position: "desc" },
  });

  const item = await db.checklistItem.create({
    data: {
      title: data.title,
      checklistId: data.checklistId,
      position: (lastItem?.position ?? -1) + 1,
    },
  });

  await pusherServer.trigger(`board-${data.boardId}`, "board-updated", {});
  revalidatePath(`/dashboard/board/${data.boardId}`);
  return item;
}

export async function toggleChecklistItem(itemId: string, boardId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const item = await db.checklistItem.findUnique({ where: { id: itemId } });
  if (!item) throw new Error("Item not found");

  await db.checklistItem.update({
    where: { id: itemId },
    data: { isCompleted: !item.isCompleted },
  });

  await pusherServer.trigger(`board-${boardId}`, "board-updated", {});
  revalidatePath(`/dashboard/board/${boardId}`);
}

export async function deleteChecklistItem(itemId: string, boardId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db.checklistItem.delete({ where: { id: itemId } });
  await pusherServer.trigger(`board-${boardId}`, "board-updated", {});
  revalidatePath(`/dashboard/board/${boardId}`);
}
