import { getWorkspaceById } from "@/actions/workspace";
import Link from "next/link";
import { Plus, LayoutDashboard, Settings } from "lucide-react";
import { notFound } from "next/navigation";
import { CreateBoardDialog } from "@/components/board/create-board-dialog";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const workspace = await getWorkspaceById(workspaceId);

  if (!workspace) return notFound();

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
            style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
          >
            {workspace.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{workspace.name}</h1>
            {workspace.description && (
              <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                {workspace.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/workspace/${workspaceId}/settings`}
            className="flex items-center gap-2 py-2 px-4 rounded-xl text-sm transition-smooth hover:bg-[var(--color-secondary)]"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            <Settings size={16} />
            Settings
          </Link>
          <CreateBoardDialog workspaceId={workspaceId} />
        </div>
      </div>

      {/* Members preview */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex -space-x-2">
          {workspace.members.slice(0, 5).map((member) => (
            <div
              key={member.id}
              className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-semibold"
              style={{
                borderColor: "var(--color-background)",
                background: "var(--color-muted)",
                color: "var(--color-muted-foreground)",
              }}
              title={member.user.name || member.user.email || "User"}
            >
              {member.user.image ? (
                <img
                  src={member.user.image}
                  alt={member.user.name || ""}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                (member.user.name?.charAt(0) || "?").toUpperCase()
              )}
            </div>
          ))}
          {workspace._count.members > 5 && (
            <div
              className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium"
              style={{
                borderColor: "var(--color-background)",
                background: "var(--color-secondary)",
                color: "var(--color-muted-foreground)",
              }}
            >
              +{workspace._count.members - 5}
            </div>
          )}
        </div>
        <span className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
          {workspace._count.members} member{workspace._count.members !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Boards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {workspace.boards.map((board) => (
          <Link
            key={board.id}
            href={`/dashboard/board/${board.id}`}
            className="group rounded-2xl p-5 transition-smooth hover:shadow-lg"
            style={{
              background: "var(--color-card)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: "var(--color-column-review)" }}
            >
              <LayoutDashboard size={16} style={{ color: "var(--color-info)" }} />
            </div>
            <h3 className="font-semibold text-sm group-hover:text-[var(--color-info)] transition-smooth">
              {board.title}
            </h3>
            <p className="text-xs mt-1" style={{ color: "var(--color-muted-foreground)" }}>
              Updated {new Date(board.updatedAt).toLocaleDateString()}
            </p>
          </Link>
        ))}

        {/* Add Board card */}
        <CreateBoardDialog workspaceId={workspaceId} variant="card" />
      </div>
    </div>
  );
}
