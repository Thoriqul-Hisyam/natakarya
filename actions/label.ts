"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { checkPermission } from "@/lib/permissions";
import { MemberRole } from "@prisma/client";

export async function createLabel(boardId: string, name: string, color: string) {
  const board = await db.board.findUnique({ where: { id: boardId }, select: { workspaceId: true } });
  if (!board) throw new Error("Board not found");

  await checkPermission(board.workspaceId, [MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER]);

  const label = await db.label.create({
    data: { boardId, name, color },
  });

  revalidatePath(`/dashboard/board/${boardId}`);
  return label;
}

export async function updateLabel(labelId: string, data: { name?: string; color?: string }) {
  const label = await db.label.findUnique({ where: { id: labelId }, include: { board: true } });
  if (!label) throw new Error("Label not found");

  await checkPermission(label.board.workspaceId, [MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER]);

  const updated = await db.label.update({
    where: { id: labelId },
    data,
  });

  revalidatePath(`/dashboard/board/${label.boardId}`);
  return updated;
}

export async function deleteLabel(labelId: string) {
  const label = await db.label.findUnique({ where: { id: labelId }, include: { board: true } });
  if (!label) throw new Error("Label not found");

  await checkPermission(label.board.workspaceId, [MemberRole.OWNER, MemberRole.ADMIN]);

  await db.label.delete({ where: { id: labelId } });

  revalidatePath(`/dashboard/board/${label.boardId}`);
}
