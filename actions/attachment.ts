"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getBoardById } from "@/actions/board";
import { unlink } from "fs/promises";
import { join } from "path";

export async function addAttachment(data: {
  cardId: string;
  url: string;
  name: string;
  type: string;
  size: number;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const card = await db.card.findUnique({
    where: { id: data.cardId },
    select: { list: { select: { boardId: true } } }
  });

  if (!card) throw new Error("Card not found");

  const attachment = await db.attachment.create({
    data: {
      cardId: data.cardId,
      url: data.url,
      name: data.name,
      type: data.type,
      size: data.size,
      userId: session.user.id,
    },
  });

  await db.activity.create({
    data: {
      action: "attached a file to",
      entityId: attachment.id,
      entityType: "ATTACHMENT",
      entityTitle: data.name,
      userId: session.user.id,
      boardId: card.list.boardId,
      cardId: data.cardId,
    },
  });

  revalidatePath(`/dashboard/board/${card.list.boardId}`);
  return attachment;
}

export async function deleteAttachment(attachmentId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const attachment = await db.attachment.findUnique({
    where: { id: attachmentId },
    select: { url: true, userId: true, cardId: true, name: true, card: { select: { list: { select: { boardId: true } } } } }
  });

  if (!attachment) throw new Error("Attachment not found");

  if (attachment.userId !== session.user.id) {
    // Only the uploader can delete their attachment (or a board admin, but let's keep it simple for now)
    throw new Error("Unauthorized to delete this attachment");
  }

  await db.attachment.delete({
    where: { id: attachmentId }
  });

  // Attempt to delete physical file if it's a local upload
  if (attachment.url.startsWith("/uploads/")) {
    try {
      const filePath = join(process.cwd(), "public", attachment.url);
      await unlink(filePath);
    } catch (error) {
      console.error("Failed to delete physical file", error);
    }
  }

  await db.activity.create({
    data: {
      action: "deleted an attachment from",
      entityId: attachmentId,
      entityType: "ATTACHMENT",
      entityTitle: attachment.name,
      userId: session.user.id,
      boardId: attachment.card.list.boardId,
      cardId: attachment.cardId,
    },
  });

  revalidatePath(`/dashboard/board/${attachment.card.list.boardId}`);
}
