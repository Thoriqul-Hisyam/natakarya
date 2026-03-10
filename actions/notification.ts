"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getNotifications() {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  const notifications = await db.notification.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
  });

  return notifications;
}

export async function getUnreadNotificationCount() {
  const session = await auth();
  if (!session?.user?.id) {
    return 0;
  }

  const count = await db.notification.count({
    where: {
      userId: session.user.id,
      isRead: false,
    },
  });

  return count;
}

export async function markNotificationAsRead(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const notification = await db.notification.update({
    where: {
      id,
      userId: session.user.id,
    },
    data: {
      isRead: true,
    },
  });

  revalidatePath("/");
  return notification;
}

export async function markAllNotificationsAsRead() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  await db.notification.updateMany({
    where: {
      userId: session.user.id,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  revalidatePath("/");
  return true;
}

export async function createNotification({
  userId,
  title,
  message,
  link,
  type = "info",
}: {
  userId: string;
  title: string;
  message: string;
  link?: string;
  type?: string;
}) {
  try {
    const notification = await db.notification.create({
      data: {
        userId,
        title,
        body: message,
        link,
        type,
      },
    });

    // TODO: Trigger Pusher event for real-time notification delivery
    // pusherServer.trigger(`user-${userId}`, "new-notification", notification);

    return notification;
  } catch (error) {
    console.error("Failed to create notification", error);
    return null;
  }
}
