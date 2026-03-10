import { getBoardById } from "@/actions/board";
import { notFound } from "next/navigation";
import { BoardView } from "@/components/board/board-view";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const { boardId } = await params;
  const board = await getBoardById(boardId);

  if (!board) return notFound();

  return <BoardView board={board} />;
}
