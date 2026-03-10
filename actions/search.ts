"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function globalSearch(query: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  if (!query || query.trim().length < 2) return { boards: [], cards: [] };

  const boardVisibilityFilter: Prisma.BoardWhereInput = {
    workspace: {
      members: { some: { userId: session.user.id } },
    },
    OR: [
      { visibility: "WORKSPACE" },
      { members: { some: { userId: session.user.id } } },
      { workspace: { members: { some: { userId: session.user.id, role: { in: ["OWNER", "ADMIN"] } } } } }
    ]
  };

  const [boards, cards] = await Promise.all([
    db.board.findMany({
      where: {
        isArchived: false,
        title: { contains: query, mode: "insensitive" as const },
        ...boardVisibilityFilter,
      },
      include: {
        workspace: { select: { name: true } },
      },
      take: 5,
    }),
    db.card.findMany({
      where: {
        isArchived: false,
        title: { contains: query, mode: "insensitive" as const },
        list: {
          board: boardVisibilityFilter,
        },
      },
      include: {
        list: {
          include: {
            board: { select: { id: true, title: true } },
          },
        },
        labels: { include: { label: true } },
      },
      take: 8,
    }),
  ]);

  return { boards, cards };
}
