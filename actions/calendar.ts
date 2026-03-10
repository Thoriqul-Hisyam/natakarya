"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getCalendarTasks(year: number, month: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59);

  const cards = await db.card.findMany({
    where: {
      isArchived: false,
      dueDate: {
        gte: startDate,
        lte: endDate,
      },
      list: {
        board: {
          workspace: {
            members: { some: { userId: session.user.id } },
          },
        },
      },
    },
    include: {
      list: {
        include: {
          board: {
            select: { id: true, title: true },
          },
        },
      },
      labels: { include: { label: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  // Group by date
  const tasksByDate: Record<string, typeof cards> = {};
  for (const card of cards) {
    if (card.dueDate) {
      const key = card.dueDate.toISOString().split("T")[0];
      if (!tasksByDate[key]) tasksByDate[key] = [];
      tasksByDate[key].push(card);
    }
  }

  return { cards, tasksByDate };
}
