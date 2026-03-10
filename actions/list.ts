"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { pusherServer } from "@/lib/pusher";
import { checkPermission } from "@/lib/permissions";
import { MemberRole } from "@prisma/client";

export async function createList(data: { title: string; boardId: string }) {
  const board = await db.board.findUnique({ where: { id: data.boardId }, select: { workspaceId: true } });
  if (!board) throw new Error("Board not found");
  
  await checkPermission(board.workspaceId, [MemberRole.OWNER, MemberRole.ADMIN]);

  // Get the highest position
  const lastList = await db.list.findFirst({
    where: { boardId: data.boardId },
    orderBy: { position: "desc" },
  });

  const list = await db.list.create({
    data: {
      title: data.title,
      boardId: data.boardId,
      position: (lastList?.position ?? -1) + 1,
    },
  });

  await pusherServer.trigger(`board-${data.boardId}`, "board-updated", {});
  revalidatePath(`/dashboard/board/${data.boardId}`);
  return list;
}

export async function updateList(listId: string, data: { title?: string }) {
  const list = await db.list.findUnique({ where: { id: listId }, include: { board: true } });
  if (!list) throw new Error("List not found");
  
  await checkPermission(list.board.workspaceId, [MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER]);

  const updatedList = await db.list.update({
    where: { id: listId },
    data,
  });

  await pusherServer.trigger(`board-${updatedList.boardId}`, "board-updated", {});
  revalidatePath(`/dashboard/board/${updatedList.boardId}`);
  return updatedList;
}

export async function deleteList(listId: string) {
  const list = await db.list.findUnique({ where: { id: listId }, include: { board: true } });
  if (!list) throw new Error("List not found");
  
  await checkPermission(list.board.workspaceId, [MemberRole.OWNER, MemberRole.ADMIN]);

  await db.list.delete({ where: { id: listId } });
  await pusherServer.trigger(`board-${list.boardId}`, "board-updated", {});
  revalidatePath(`/dashboard/board/${list.boardId}`);
}

export async function reorderLists(boardId: string, listIds: string[]) {
  const board = await db.board.findUnique({ where: { id: boardId }, select: { workspaceId: true } });
  if (!board) throw new Error("Board not found");
  
  await checkPermission(board.workspaceId, [MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER]);

  const updates = listIds.map((id, index) =>
    db.list.update({
      where: { id },
      data: { position: index },
    })
  );

  await db.$transaction(updates);
  await pusherServer.trigger(`board-${boardId}`, "board-updated", {});
  revalidatePath(`/dashboard/board/${boardId}`);
}
