"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkPermission } from "@/lib/permissions";
import { MemberRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

// Add a member to a private board
export async function addBoardMember(boardId: string, email: string, role: MemberRole = "MEMBER") {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const board = await db.board.findUnique({
    where: { id: boardId },
    include: { workspace: true },
  });

  if (!board) throw new Error("Board not found");

  // Check if current user has permission to add members (must be OWNER/ADMIN of workspace, or OWNER/ADMIN of board)
  // For simplicity, let's require OWNER/ADMIN of workspace or OWNER of board.
  // We'll trust checkPermission to handle workspace layer, but we also need board layer.
  const wsRole = await checkPermission(board.workspaceId, ["OWNER", "ADMIN", "MEMBER"]);
  
  if (wsRole === "MEMBER") {
    // Check if they are board OWNER/ADMIN
    const boardMember = await db.boardMember.findUnique({
      where: { userId_boardId: { userId: session.user.id, boardId } }
    });
    if (!boardMember || !["OWNER", "ADMIN"].includes(boardMember.role)) {
      throw new Error("You do not have permission to invite members to this board");
    }
  }

  // Find target user
  const user = await db.user.findUnique({ where: { email } });
  if (!user) throw new Error("User not found. They need to sign up first.");

  // Target user must be a member of the workspace first
  const wsMember = await db.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId: board.workspaceId } }
  });

  if (!wsMember) throw new Error("User must be invited to the Workspace first");

  // Check if already a board member
  const existing = await db.boardMember.findUnique({
    where: { userId_boardId: { userId: user.id, boardId } }
  });

  if (existing) throw new Error("User is already a member of this board");

  await db.boardMember.create({
    data: {
      userId: user.id,
      boardId,
      role,
    }
  });

  revalidatePath(`/dashboard/board/${boardId}`);
}

// Remove a member from a private board
export async function removeBoardMember(boardId: string, memberId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const boardMember = await db.boardMember.findUnique({
    where: { id: memberId },
    include: { board: true },
  });

  if (!boardMember) throw new Error("Board member not found");

  const board = boardMember.board;

  const wsRole = await checkPermission(board.workspaceId, ["OWNER", "ADMIN", "MEMBER"]);
  
  // Can only remove if you are removing yourself, OR you are WS ADMIN/OWNER, OR Board ADMIN/OWNER
  if (boardMember.userId !== session.user.id && wsRole === "MEMBER") {
    const currentBoardMember = await db.boardMember.findUnique({
      where: { userId_boardId: { userId: session.user.id, boardId: board.id } }
    });
    if (!currentBoardMember || !["OWNER", "ADMIN"].includes(currentBoardMember.role)) {
      throw new Error("You do not have permission to remove members from this board");
    }
  }

  if (boardMember.role === "OWNER") {
    throw new Error("Cannot remove the board owner directly");
  }

  await db.boardMember.delete({
    where: { id: memberId }
  });

  revalidatePath(`/dashboard/board/${board.id}`);
}

// Update a member's role on a private board
export async function updateBoardMemberRole(boardId: string, memberId: string, role: MemberRole) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const boardMember = await db.boardMember.findUnique({
    where: { id: memberId },
    include: { board: true },
  });

  if (!boardMember) throw new Error("Board member not found");

  const board = boardMember.board;
  const wsRole = await checkPermission(board.workspaceId, ["OWNER", "ADMIN", "MEMBER"]);
  
  if (wsRole === "MEMBER") {
    const currentBoardMember = await db.boardMember.findUnique({
      where: { userId_boardId: { userId: session.user.id, boardId: board.id } }
    });
    if (!currentBoardMember || !["OWNER", "ADMIN"].includes(currentBoardMember.role)) {
      throw new Error("You do not have permission to update roles on this board");
    }
  }

  await db.boardMember.update({
    where: { id: memberId },
    data: { role }
  });

  revalidatePath(`/dashboard/board/${board.id}`);
}

export async function leaveBoard(boardId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const boardMember = await db.boardMember.findUnique({
    where: {
      userId_boardId: {
        userId: session.user.id,
        boardId,
      },
    },
  });

  if (!boardMember) throw new Error("You are not a member of this board");

  if (boardMember.role === "OWNER") {
    throw new Error("The owner cannot leave the board. Please delete the board instead.");
  }

  await db.boardMember.delete({
    where: { id: boardMember.id },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/board/${boardId}`);
}
