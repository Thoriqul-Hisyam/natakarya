"use client";

import { useState } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { CardItem } from "./card-item";
import { MoreHorizontal, Plus, X } from "lucide-react";
import { createCard } from "@/actions/card";
import { updateList, deleteList } from "@/actions/list";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/modals/confirm-modal";

interface ListContainerProps {
  list: any;
  index: number;
  boardId: string;
  columnColor: string;
  dotColor: string;
  labels: any[];
  members: any[];
  onCardClick: (cardId: string) => void;
  searchQuery: string;
  filters?: {
    labels: string[];
    assignees: string[];
    dueDate: string | null;
  };
  role: string;
}

export function ListContainer({
  list,
  index,
  boardId,
  columnColor,
  dotColor,
  labels,
  members,
  onCardClick,
  searchQuery,
  filters,
  role,
}: ListContainerProps) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(list.title);
  const [showMenu, setShowMenu] = useState(false);

  const isViewer = role === "VIEWER";
  const isMember = role === "MEMBER";
  const isAdmin = role === "ADMIN";
  const isOwner = role === "OWNER";

  const canManageList = isOwner || isAdmin;
  const canEditList = isOwner || isAdmin || isMember;

  const filteredCards = list.cards.filter((card: any) => {
    if (searchQuery && !card.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    if (filters) {
      if (filters.labels.length > 0) {
        const cardLabelIds = card.labels?.map((l: any) => l.labelId || l.label?.id) || [];
        const hasLabel = filters.labels.some((id: string) => cardLabelIds.includes(id));
        if (!hasLabel) return false;
      }

      if (filters.assignees.length > 0) {
        const cardMemberIds = card.members?.map((m: any) => m.userId || m.user?.id) || [];
        const hasMember = filters.assignees.some((id: string) => cardMemberIds.includes(id));
        if (!hasMember) return false;
      }

      if (filters.dueDate) {
        if (!card.dueDate && filters.dueDate !== "noDate") return false;
        if (card.dueDate && filters.dueDate === "noDate") return false;

        if (card.dueDate) {
          const due = new Date(card.dueDate);
          const now = new Date();
          const nextDay = new Date(now);
          nextDay.setDate(now.getDate() + 1);
          const nextWeek = new Date(now);
          nextWeek.setDate(now.getDate() + 7);

          if (filters.dueDate === "overdue" && due >= now) return false;
          if (filters.dueDate === "nextDay" && due > nextDay) return false;
          if (filters.dueDate === "nextWeek" && due > nextWeek) return false;
        }
      }
    }
    
    return true;
  });

  const handleAddCard = async () => {
    if (!newCardTitle.trim()) return;

    try {
      await createCard({
        title: newCardTitle.trim(),
        listId: list.id,
        boardId,
      });
      setNewCardTitle("");
      setIsAddingCard(false);
      toast.success("Card created");
    } catch {
      toast.error("Failed to create card");
    }
  };

  const handleRename = async () => {
    if (!title.trim() || title === list.title) {
      setTitle(list.title);
      setIsEditing(false);
      return;
    }

    try {
      await updateList(list.id, { title: title.trim() });
      setIsEditing(false);
    } catch {
      toast.error("Failed to rename list");
      setTitle(list.title);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteList(list.id);
      toast.success("List deleted");
    } catch {
      toast.error("Failed to delete list");
    }
  };

  return (
    <Draggable 
      draggableId={list.id} 
      index={index}
      isDragDisabled={isViewer}
    >
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="flex-shrink-0 w-[300px] rounded-2xl p-3 flex flex-col max-h-full"
          style={{
            ...provided.draggableProps.style,
            background: columnColor,
          }}
        >
          {/* List Header */}
          <div
            {...provided.dragHandleProps}
            className="flex items-center justify-between px-1 mb-3"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: dotColor }}
              />
              {isEditing ? (
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={(e) => e.key === "Enter" && handleRename()}
                  className="font-semibold text-sm bg-transparent outline-none border-b-2"
                  style={{ borderColor: dotColor }}
                  autoFocus
                />
              ) : (
                <h3
                  className={`font-semibold text-sm ${!isViewer ? 'cursor-pointer' : ''}`}
                  onDoubleClick={() => !isViewer && setIsEditing(true)}
                >
                  {list.title}
                </h3>
              )}
              <span
                className="text-xs py-0.5 px-1.5 rounded-md font-medium"
                style={{
                  background: "rgba(0,0,0,0.06)",
                  color: "var(--color-muted-foreground)",
                }}
              >
                {filteredCards.length}
              </span>
            </div>

            {canManageList && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-smooth hover:bg-white/50 cursor-pointer"
                >
                  <MoreHorizontal size={14} />
                </button>
                {showMenu && (
                  <div
                    className="absolute right-0 top-8 w-40 rounded-xl p-1 fade-in z-20"
                    style={{
                      background: "var(--color-card)",
                      boxShadow: "var(--shadow-dropdown)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowMenu(false);
                      }}
                      className="w-full text-left py-1.5 px-3 rounded-lg text-sm hover:bg-[var(--color-secondary)] transition-smooth cursor-pointer"
                    >
                      Rename
                    </button>
                    <ConfirmModal
                      title="Delete List"
                      description="Are you sure you want to delete this list? All cards inside this list will be permanently removed."
                      onConfirm={() => {
                        handleDelete();
                        setShowMenu(false);
                      }}
                    >
                      <button
                        className="w-full text-left py-1.5 px-3 rounded-lg text-sm hover:bg-red-50 transition-smooth cursor-pointer"
                        style={{ color: "var(--color-destructive)" }}
                      >
                        Delete list
                      </button>
                    </ConfirmModal>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cards */}
          <Droppable droppableId={list.id} type="card" isDropDisabled={isViewer}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex-1 overflow-y-auto space-y-2.5 min-h-[60px] rounded-xl px-0.5"
                style={{
                  background: snapshot.isDraggingOver
                    ? "rgba(255,255,255,0.3)"
                    : "transparent",
                  transition: "background 0.2s ease",
                }}
              >
                {filteredCards.map((card: any, cardIndex: number) => (
                  <CardItem
                    key={card.id}
                    card={card}
                    index={cardIndex}
                    onClick={() => onCardClick(card.id)}
                    isDragDisabled={isViewer}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {/* Add Card */}
          {isAddingCard ? (
            <div className="mt-2.5">
              <input
                type="text"
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddCard();
                  if (e.key === "Escape") setIsAddingCard(false);
                }}
                placeholder="Enter card title..."
                className="w-full py-2 px-3 rounded-xl text-sm outline-none"
                style={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                }}
                autoFocus
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={handleAddCard}
                  className="py-1.5 px-4 rounded-lg text-sm font-medium transition-smooth cursor-pointer"
                  style={{
                    background: "var(--color-primary)",
                    color: "var(--color-primary-foreground)",
                  }}
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setIsAddingCard(false);
                    setNewCardTitle("");
                  }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/50 transition-smooth cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            canEditList && (
              <button
                onClick={() => setIsAddingCard(true)}
                className="mt-2.5 flex items-center gap-1.5 py-2 px-3 rounded-xl text-sm w-full transition-smooth hover:bg-white/40 cursor-pointer"
                style={{ color: "var(--color-muted-foreground)" }}
              >
                <Plus size={14} />
                Add a card
              </button>
            )
          )}
        </div>
      )}
    </Draggable>
  );
}
