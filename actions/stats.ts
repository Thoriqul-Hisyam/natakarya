"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getDashboardStats() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const memberOf = {
    list: {
      board: {
        workspace: {
          members: { some: { userId: session.user.id } },
        },
      },
    },
  };

  // Card stats
  const [totalCards, completedCards, overdueCards, inProgressCards] = await Promise.all([
    db.card.count({ where: { isArchived: false, ...memberOf } }),
    db.card.count({ where: { isArchived: false, ...memberOf, list: { ...memberOf.list, title: "Completed" } } }),
    db.card.count({
      where: {
        isArchived: false,
        ...memberOf,
        dueDate: { lt: now },
        list: { ...memberOf.list, title: { not: "Completed" } },
      },
    }),
    db.card.count({ where: { isArchived: false, ...memberOf, list: { ...memberOf.list, title: "In Progress" } } }),
  ]);

  // Activity per day (last 7 days)
  const activities = await db.activity.findMany({
    where: {
      createdAt: { gte: sevenDaysAgo },
      board: {
        workspace: {
          members: { some: { userId: session.user.id } },
        },
      },
    },
    select: { createdAt: true },
  });

  // Group activities by date
  const activityByDay: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    activityByDay[key] = 0;
  }
  for (const a of activities) {
    const key = a.createdAt.toISOString().split("T")[0];
    if (activityByDay[key] !== undefined) {
      activityByDay[key]++;
    }
  }

  // Board breakdown
  const boards = await db.board.findMany({
    where: {
      isArchived: false,
      workspace: {
        members: { some: { userId: session.user.id } },
      },
    },
    include: {
      workspace: { select: { name: true } },
      lists: {
        include: {
          _count: { select: { cards: true } },
        },
      },
      _count: { select: { lists: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });

  const boardBreakdown = boards.map((b) => {
    const totalTasks = b.lists.reduce((sum, l) => sum + l._count.cards, 0);
    const completedList = b.lists.find((l) => l.title === "Completed");
    const completedTasks = completedList?._count.cards || 0;

    return {
      id: b.id,
      title: b.title,
      workspaceName: b.workspace.name,
      totalTasks,
      completedTasks,
      progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  });

  return {
    totalCards,
    completedCards,
    overdueCards,
    inProgressCards,
    completionRate: totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0,
    activityByDay,
    boardBreakdown,
  };
}
