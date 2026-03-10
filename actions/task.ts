"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getMyTasks(filter?: "all" | "overdue" | "dueSoon" | "completed") {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  // Build where clause based on filter
  let cardWhere: any = {
    isArchived: false,
    members: {
      some: { userId: session.user.id },
    },
  };

  if (filter === "overdue") {
    cardWhere.dueDate = { lt: now };
    cardWhere.list = { title: { not: "Completed" } };
  } else if (filter === "dueSoon") {
    cardWhere.dueDate = { gte: now, lte: nextWeek };
  } else if (filter === "completed") {
    cardWhere.list = { title: "Completed" };
  }

  const cards = await db.card.findMany({
    where: cardWhere,
    include: {
      list: {
        include: {
          board: {
            include: {
              workspace: {
                select: { id: true, name: true },
              },
            },
          },
        },
      },
      labels: { include: { label: true } },
      members: { include: { user: { select: { id: true, name: true, image: true } } } },
      _count: { select: { comments: true, checklists: true } },
    },
    orderBy: [
      { dueDate: "asc" },
      { createdAt: "desc" },
    ],
  });

  // Group by workspace -> board
  const grouped: Record<string, {
    workspace: { id: string; name: string };
    boards: Record<string, {
      board: { id: string; title: string };
      tasks: typeof cards;
    }>;
  }> = {};

  for (const card of cards) {
    const ws = card.list.board.workspace;
    const board = card.list.board;

    if (!grouped[ws.id]) {
      grouped[ws.id] = { workspace: ws, boards: {} };
    }
    if (!grouped[ws.id].boards[board.id]) {
      grouped[ws.id].boards[board.id] = { board: { id: board.id, title: board.title }, tasks: [] };
    }
    grouped[ws.id].boards[board.id].tasks.push(card);
  }

  return { cards, grouped };
}

export async function getMyTaskStats() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const baseWhere = {
    isArchived: false,
    members: {
      some: { userId: session.user.id },
    },
  };

  const [total, completed, overdue, dueSoon] = await Promise.all([
    db.card.count({ where: baseWhere }),
    db.card.count({ where: { ...baseWhere, list: { title: "Completed" } } }),
    db.card.count({ where: { ...baseWhere, dueDate: { lt: now }, list: { title: { not: "Completed" } } } }),
    db.card.count({ where: { ...baseWhere, dueDate: { gte: now, lte: nextWeek } } }),
  ]);

  return { total, completed, overdue, dueSoon, inProgress: total - completed };
}
