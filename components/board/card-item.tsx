"use client";

import { Draggable } from "@hello-pangea/dnd";
import { MessageSquare, Paperclip, Calendar } from "lucide-react";
import { format } from "date-fns";

interface CardItemProps {
  card: any;
  index: number;
  onClick: () => void;
  isDragDisabled?: boolean;
}

const PRIORITY_STYLES: Record<string, { bg: string; color: string }> = {
  High: { bg: "#fde2e2", color: "#ef4444" },
  Medium: { bg: "#fef3cd", color: "#f59e0b" },
  Low: { bg: "#d4edda", color: "#22c55e" },
  Bug: { bg: "#fde2e2", color: "#dc2626" },
  Feature: { bg: "#e8e0fe", color: "#6366f1" },
  Urgent: { bg: "#ffe4cc", color: "#f97316" },
};

export function CardItem({ card, index, onClick, isDragDisabled }: CardItemProps) {
  const checklistTotal = card.checklists?.reduce(
    (acc: number, cl: any) => acc + cl.items.length,
    0
  ) || 0;
  const checklistDone = card.checklists?.reduce(
    (acc: number, cl: any) =>
      acc + cl.items.filter((i: any) => i.isCompleted).length,
    0
  ) || 0;

  const progress =
    checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : card.progress || 0;

  return (
    <Draggable draggableId={card.id} index={index} isDragDisabled={isDragDisabled}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className="rounded-xl p-3.5 cursor-pointer transition-smooth hover:shadow-md"
          style={{
            ...provided.draggableProps.style,
            background: "var(--color-card)",
            boxShadow: snapshot.isDragging
              ? "0 8px 32px rgba(0,0,0,0.15)"
              : "var(--shadow-card)",
            transform: snapshot.isDragging
              ? `${provided.draggableProps.style?.transform} rotate(3deg)`
              : provided.draggableProps.style?.transform,
          }}
        >
          {/* Labels / Priority */}
          {card.labels && card.labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {card.labels.map((cl: any) => {
                const style = PRIORITY_STYLES[cl.label.name] || {
                  bg: cl.label.color + "20",
                  color: cl.label.color,
                };
                return (
                  <span
                    key={cl.id}
                    className="text-[10px] font-semibold py-0.5 px-2 rounded-md"
                    style={{
                      background: style.bg,
                      color: style.color,
                    }}
                  >
                    {cl.label.name}
                  </span>
                );
              })}
            </div>
          )}

          {/* Title */}
          <h4 className="font-semibold text-sm mb-1">{card.title}</h4>

          {/* Description preview */}
          {card.description && (
            <p
              className="text-xs mb-2.5 line-clamp-2"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              {card.description}
            </p>
          )}

          {/* Progress bar */}
          {progress > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span
                  className="text-[10px] font-medium"
                  style={{ color: "var(--color-muted-foreground)" }}
                >
                  Progress
                </span>
                <span
                  className="text-[10px] font-semibold"
                  style={{ color: "var(--color-muted-foreground)" }}
                >
                  {progress}%
                </span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: "var(--color-secondary)" }}
              >
                <div
                  className="h-full rounded-full progress-animated"
                  style={{
                    width: `${progress}%`,
                    background:
                      progress === 100
                        ? "var(--color-success)"
                        : "var(--color-info)",
                  }}
                />
              </div>
            </div>
          )}

          {/* Due date */}
          {card.dueDate && (
            <div className="flex items-center gap-1 mb-2.5">
              <Calendar size={11} style={{ color: "var(--color-muted-foreground)" }} />
              <span
                className="text-[10px] font-medium"
                style={{
                  color: new Date(card.dueDate) < new Date()
                    ? "var(--color-destructive)"
                    : "var(--color-muted-foreground)",
                }}
              >
                {format(new Date(card.dueDate), "MMM d, yyyy")}
              </span>
            </div>
          )}

          {/* Footer: avatars + metadata */}
          <div className="flex items-center justify-between mt-1">
            {/* Member avatars */}
            <div className="flex -space-x-1.5">
              {card.members?.slice(0, 3).map((cm: any) => (
                <div
                  key={cm.id}
                  className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[8px] font-bold"
                  style={{
                    borderColor: "var(--color-card)",
                    background: "var(--color-muted)",
                    color: "var(--color-muted-foreground)",
                  }}
                  title={cm.user.name || "User"}
                >
                  {cm.user.image ? (
                    <img
                      src={cm.user.image}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    (cm.user.name?.charAt(0) || "?").toUpperCase()
                  )}
                </div>
              ))}
            </div>

            {/* Meta counts */}
            <div
              className="flex items-center gap-2.5"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              {card._count?.attachments > 0 && (
                <div className="flex items-center gap-0.5 text-[10px]">
                  <Paperclip size={10} />
                  {card._count.attachments}
                </div>
              )}
              {card._count?.comments > 0 && (
                <div className="flex items-center gap-0.5 text-[10px]">
                  <MessageSquare size={10} />
                  {card._count.comments}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
