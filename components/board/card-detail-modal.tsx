"use client";

import { useEffect, useState } from "react";
import { getCardById, updateCard, assignMember, addLabel } from "@/actions/card";
import {
  createComment,
  createChecklist,
  createChecklistItem,
  toggleChecklistItem,
  deleteChecklist,
  deleteChecklistItem,
} from "@/actions/comment";
import {
  X,
  Calendar,
  Tag,
  Users,
  CheckSquare,
  MessageSquare,
  Paperclip,
  AlignLeft,
  Clock,
  Trash2,
  Plus,
  Send,
  FileIcon,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import Image from "next/image";
import { deleteCard } from "@/actions/card";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import { Editor } from "@/components/ui/editor";
import { FileUpload } from "@/components/ui/file-upload";
import { addAttachment, deleteAttachment } from "@/actions/attachment";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CardDetailModalProps {
  cardId: string;
  boardId: string;
  labels: any[];
  members: any[];
  onClose: () => void;
  role: string;
}

import { getCardActivities } from "@/actions/activity";

export function CardDetailModal({
  cardId,
  boardId,
  labels,
  members,
  onClose,
  role,
}: CardDetailModalProps) {
  const [card, setCard] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [addingChecklist, setAddingChecklist] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState<Record<string, string>>({});
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [showAttachmentUploader, setShowAttachmentUploader] = useState(false);

  const isViewer = role === "VIEWER";
  const isMember = role === "MEMBER";
  const isAdmin = role === "ADMIN";
  const isOwner = role === "OWNER";

  const canEditCard = isOwner || isAdmin || isMember;
  const canDeleteCard = isOwner || isAdmin || isMember;
  const canDeleteChecklist = isOwner || isAdmin; // Leaders only? or members too? I'll allow members for card contents.
  // Actually, I'll allow members to delete their own card contents.
  const canModifyContents = isOwner || isAdmin || isMember;

  useEffect(() => {
    loadCard();
  }, [cardId]);

  const loadCard = async () => {
    try {
      const [data, acts] = await Promise.all([
        getCardById(cardId),
        getCardActivities(cardId)
      ]);
      setCard(data);
      setActivities(acts);
      setTitle(data?.title || "");
      setDescription(data?.description || "");
      setDueDate(data?.dueDate ? format(new Date(data.dueDate), "yyyy-MM-dd") : "");
    } catch {
      toast.error("Failed to load card");
    } finally {
      setLoading(false);
    }
  };

  const handleTitleUpdate = async () => {
    if (!title.trim() || title === card?.title) {
      setEditingTitle(false);
      return;
    }
    try {
      await updateCard(cardId, { title: title.trim() });
      setCard({ ...card, title: title.trim() });
      setEditingTitle(false);
    } catch {
      toast.error("Failed to update title");
    }
  };

  const handleDescriptionUpdate = async () => {
    try {
      await updateCard(cardId, { description: description.trim() });
      setCard({ ...card, description: description.trim() });
      setEditingDesc(false);
      toast.success("Description updated");
    } catch {
      toast.error("Failed to update description");
    }
  };

  const handleDueDateUpdate = async (date: Date | undefined) => {
    try {
      await updateCard(cardId, { dueDate: date || null });
      setCard({ ...card, dueDate: date || null });
      setDueDate(date ? format(date, "yyyy-MM-dd") : "");
      toast.success("Due date updated");
    } catch {
      toast.error("Failed to update due date");
    }
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    try {
      const comment = await createComment({
        content: newComment.trim(),
        cardId,
        boardId,
      });
      setCard({
        ...card,
        comments: [comment, ...(card?.comments || [])],
      });
      setNewComment("");
    } catch {
      toast.error("Failed to add comment");
    }
  };

  const handleAddChecklist = async () => {
    if (!newChecklistTitle.trim()) return;
    try {
      const checklist = await createChecklist({
        title: newChecklistTitle.trim(),
        cardId,
        boardId,
      });
      setCard({
        ...card,
        checklists: [...(card?.checklists || []), checklist],
      });
      setNewChecklistTitle("");
      setAddingChecklist(false);
    } catch {
      toast.error("Failed to create checklist");
    }
  };

  const handleAddItem = async (checklistId: string) => {
    const itemTitle = newItemTitle[checklistId]?.trim();
    if (!itemTitle) return;
    try {
      const item = await createChecklistItem({
        title: itemTitle,
        checklistId,
        boardId,
      });
      setCard({
        ...card,
        checklists: card.checklists.map((cl: any) =>
          cl.id === checklistId
            ? { ...cl, items: [...cl.items, item] }
            : cl
        ),
      });
      setNewItemTitle({ ...newItemTitle, [checklistId]: "" });
    } catch {
      toast.error("Failed to add item");
    }
  };

  const handleToggleItem = async (itemId: string, checklistId: string) => {
    try {
      await toggleChecklistItem(itemId, boardId);
      setCard({
        ...card,
        checklists: card.checklists.map((cl: any) =>
          cl.id === checklistId
            ? {
                ...cl,
                items: cl.items.map((i: any) =>
                  i.id === itemId ? { ...i, isCompleted: !i.isCompleted } : i
                ),
              }
            : cl
        ),
      });
    } catch {
      toast.error("Failed to toggle item");
    }
  };

  const handleAssignMember = async (userId: string) => {
    try {
      await assignMember(cardId, userId, boardId);
      await loadCard();
    } catch {
      toast.error("Failed to assign member");
    }
  };

  const handleAddLabel = async (labelId: string) => {
    try {
      await addLabel(cardId, labelId, boardId);
      await loadCard();
    } catch {
      toast.error("Failed to update label");
    }
  };

  const handleDeleteCard = async () => {
    try {
      await deleteCard(cardId);
      toast.success("Card deleted");
      onClose();
    } catch {
      toast.error("Failed to delete card");
    }
  };

  const handleDeleteChecklist = async (checklistId: string) => {
    try {
      await deleteChecklist(checklistId, boardId);
      setCard({
        ...card,
        checklists: card.checklists.filter((cl: any) => cl.id !== checklistId),
      });
      toast.success("Checklist deleted");
    } catch {
      toast.error("Failed to delete checklist");
    }
  };

  const handleAddAttachment = async (file: any) => {
    try {
      await addAttachment({
        cardId,
        url: file.url,
        name: file.name,
        type: file.type || "unknown",
        size: file.size,
      });
      await loadCard();
      setShowAttachmentUploader(false);
      toast.success("Attachment uploaded");
    } catch (error: any) {
      toast.error(error.message || "Failed to add attachment");
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await deleteAttachment(attachmentId);
      await loadCard();
      toast.success("Attachment deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete attachment");
    }
  };

  const handleDeleteItem = async (itemId: string, checklistId: string) => {
    try {
      await deleteChecklistItem(itemId, boardId);
      setCard({
        ...card,
        checklists: card.checklists.map((cl: any) =>
          cl.id === checklistId
            ? { ...cl, items: cl.items.filter((i: any) => i.id !== itemId) }
            : cl
        ),
      });
    } catch {
      toast.error("Failed to delete item");
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
        <div
          className="relative w-full max-w-2xl rounded-2xl p-8 z-10"
          style={{ background: "var(--color-card)" }}
        >
          <div className="animate-pulse space-y-4">
            <div className="h-6 rounded bg-[var(--color-secondary)] w-1/2" />
            <div className="h-4 rounded bg-[var(--color-secondary)] w-full" />
            <div className="h-4 rounded bg-[var(--color-secondary)] w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!card) return null;

  const cardLabels = card.labels?.map((cl: any) => cl.label.id) || [];
  const cardMemberIds = card.members?.map((cm: any) => cm.user.id) || [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl fade-in z-10"
        style={{
          background: "var(--color-card)",
          boxShadow: "var(--shadow-dropdown)",
        }}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-start justify-between p-6 pb-3 z-10" style={{ background: "var(--color-card)" }}>
          <div className="flex-1">
            {editingTitle && !isViewer ? (
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleUpdate}
                onKeyDown={(e) => e.key === "Enter" && handleTitleUpdate()}
                className="text-lg font-bold bg-transparent outline-none border-b-2 w-full"
                style={{ borderColor: "var(--color-primary)" }}
                autoFocus
              />
            ) : (
              <h2
                className={`text-lg font-bold ${!isViewer ? 'cursor-pointer hover:opacity-70' : ''} transition-smooth`}
                onClick={() => !isViewer && setEditingTitle(true)}
              >
                {card.title}
              </h2>
            )}
            <p className="text-xs mt-1" style={{ color: "var(--color-muted-foreground)" }}>
              in list <strong>{card.list.title}</strong>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canDeleteCard && (
              <ConfirmModal
                title="Delete Card"
                description="Are you sure you want to delete this card? This action cannot be undone."
                onConfirm={handleDeleteCard}
              >
                <button
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-smooth cursor-pointer"
                  title="Delete Card"
                >
                  <Trash2 size={16} />
                </button>
              </ConfirmModal>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--color-secondary)] transition-smooth cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Labels */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Tag size={14} style={{ color: "var(--color-muted-foreground)" }} />
                <span className="text-sm font-semibold">Labels</span>
              </div>
              {canModifyContents && (
                <button
                  onClick={() => setShowLabelPicker(!showLabelPicker)}
                  className="text-xs py-1 px-2 rounded-lg hover:bg-[var(--color-secondary)] transition-smooth cursor-pointer"
                  style={{ color: "var(--color-primary)" }}
                >
                  {showLabelPicker ? "Done" : "+ Add"}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {card.labels?.map((cl: any) => (
                <span
                  key={cl.id}
                  className="text-xs font-semibold py-1 px-2.5 rounded-lg"
                  style={{
                    background: cl.label.color + "20",
                    color: cl.label.color,
                  }}
                >
                  {cl.label.name}
                </span>
              ))}
            </div>
            {showLabelPicker && (
              <div className="mt-2 p-2 rounded-xl flex flex-wrap gap-1.5" style={{ background: "var(--color-background)" }}>
                {labels.map((label: any) => (
                  <button
                    key={label.id}
                    onClick={() => handleAddLabel(label.id)}
                    className="text-xs font-semibold py-1 px-2.5 rounded-lg transition-smooth cursor-pointer"
                    style={{
                      background: cardLabels.includes(label.id)
                        ? label.color
                        : label.color + "20",
                      color: cardLabels.includes(label.id)
                        ? "#fff"
                        : label.color,
                    }}
                  >
                    {label.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Members */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users size={14} style={{ color: "var(--color-muted-foreground)" }} />
                <span className="text-sm font-semibold">Members</span>
              </div>
              {canModifyContents && (
                <button
                  onClick={() => setShowMemberPicker(!showMemberPicker)}
                  className="text-xs py-1 px-2 rounded-lg hover:bg-[var(--color-secondary)] transition-smooth cursor-pointer"
                  style={{ color: "var(--color-primary)" }}
                >
                  {showMemberPicker ? "Done" : "+ Add"}
                </button>
              )}
            </div>
            <div className="flex -space-x-1.5">
              {card.members?.map((cm: any) => (
                <div
                  key={cm.id}
                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                  style={{
                    borderColor: "var(--color-card)",
                    background: "var(--color-muted)",
                    color: "var(--color-muted-foreground)",
                  }}
                  title={cm.user.name || ""}
                >
                  {cm.user.image ? (
                    <img src={cm.user.image} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    (cm.user.name?.charAt(0) || "?").toUpperCase()
                  )}
                </div>
              ))}
            </div>
            {showMemberPicker && (
              <div className="mt-2 p-2 rounded-xl space-y-1" style={{ background: "var(--color-background)" }}>
                {members.map((m: any) => (
                  <button
                    key={m.id}
                    onClick={() => handleAssignMember(m.user.id)}
                    className="w-full flex items-center gap-2 py-1.5 px-2 rounded-lg text-sm hover:bg-[var(--color-secondary)] transition-smooth cursor-pointer"
                    style={{
                      background: cardMemberIds.includes(m.user.id)
                        ? "var(--color-primary)" + "30"
                        : "transparent",
                    }}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{
                        background: "var(--color-muted)",
                        color: "var(--color-muted-foreground)",
                      }}
                    >
                      {m.user.image ? (
                        <img src={m.user.image} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        (m.user.name?.charAt(0) || "?").toUpperCase()
                      )}
                    </div>
                    <span>{m.user.name || m.user.email}</span>
                    {cardMemberIds.includes(m.user.id) && (
                      <span className="ml-auto text-xs" style={{ color: "var(--color-success)" }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Due Date */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calendar size={14} style={{ color: "var(--color-muted-foreground)" }} />
                <span className="text-sm font-semibold">Due Date</span>
              </div>
            </div>
            
            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal rounded-xl h-10 bg-[var(--color-card)] border-[var(--color-border)] hover:bg-[var(--color-secondary)]/50",
                    !card.dueDate && "text-muted-foreground"
                  )}
                  disabled={!canModifyContents}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  {card.dueDate ? (
                    format(new Date(card.dueDate), "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-xl bg-white border-[var(--color-border)] shadow-xl z-[110]" align="start">
                <ShadcnCalendar
                  mode="single"
                  selected={card.dueDate ? new Date(card.dueDate) : undefined}
                  onSelect={(date) => {
                    handleDueDateUpdate(date);
                    setShowDatePicker(false);
                  }}
                  initialFocus
                  className="rounded-xl"
                />
                {card.dueDate && (
                  <div className="p-3 border-t border-[var(--color-border)] flex">
                     <Button 
                       variant="ghost" 
                       size="sm" 
                       className="text-xs ml-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                       onClick={() => {
                          handleDueDateUpdate(undefined);
                          setShowDatePicker(false);
                        }}
                     >
                       Remove Due Date
                     </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlignLeft size={14} style={{ color: "var(--color-muted-foreground)" }} />
              <span className="text-sm font-semibold">Description</span>
            </div>
            {editingDesc && !isViewer ? (
              <div>
                <Editor
                  value={description}
                  onChange={setDescription}
                  placeholder="Write a more detailed description..."
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleDescriptionUpdate}
                    className="py-1.5 px-4 rounded-lg text-sm font-medium cursor-pointer"
                    style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingDesc(false);
                      setDescription(card.description || "");
                    }}
                    className="py-1.5 px-3 rounded-lg text-sm hover:bg-[var(--color-secondary)] transition-smooth cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => !isViewer && setEditingDesc(true)}
                className={`py-2 px-3 rounded-xl text-sm ${!isViewer ? 'cursor-pointer' : ''} min-h-[60px]`}
                style={{
                  background: "var(--color-background)",
                  color: card.description ? "var(--color-foreground)" : "var(--color-muted-foreground)",
                }}
              >
                {card.description ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: card.description }} />
                ) : (
                  isViewer ? "No description" : "Add a description..."
                )}
              </div>
            )}
          </div>

          {/* Attachments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Paperclip size={14} style={{ color: "var(--color-muted-foreground)" }} />
                <span className="text-sm font-semibold">Attachments</span>
              </div>
              {canModifyContents && (
                <button
                  onClick={() => setShowAttachmentUploader(!showAttachmentUploader)}
                  className="text-xs py-1 px-2 rounded-lg hover:bg-[var(--color-secondary)] transition-smooth cursor-pointer"
                  style={{ color: "var(--color-primary)" }}
                >
                  {showAttachmentUploader ? "Cancel" : "+ Add"}
                </button>
              )}
            </div>
            
            {showAttachmentUploader && (
              <div className="mb-4">
                <FileUpload
                  endpoint="cardAttachment"
                  onClientUploadComplete={async (res) => {
                    if (res && res.length > 0) {
                      try {
                        await Promise.all(res.map(file => handleAddAttachment(file)));
                      } catch (e: any) {
                        toast.error(e.message || "Error uploading files");
                      }
                    }
                  }}
                />
              </div>
            )}

            {card.attachments?.length > 0 && (
              <div className="space-y-2 mt-2">
                {card.attachments.map((attachment: any) => (
                  <div key={attachment.id} className="group relative flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--color-secondary)] transition-smooth border border-transparent hover:border-[var(--color-border)]">
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-black/5 flex-shrink-0 rounded-lg flex items-center justify-center overflow-hidden"
                    >
                      {attachment.type.startsWith("image/") ? (
                        <img src={attachment.url} alt={attachment.name} className="w-full h-full object-cover" />
                      ) : (
                        <FileIcon size={20} className="text-muted-foreground" />
                      )}
                    </a>
                    <div className="flex-1 min-w-0">
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold truncate block hover:underline"
                        style={{ color: "var(--color-foreground)" }}
                      >
                        {attachment.name}
                      </a>
                      <div className="text-xs flex items-center gap-2 mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                        <span>{format(new Date(attachment.createdAt), "MMM d, yyyy")}</span>
                        <span>•</span>
                        <span>{(attachment.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    </div>
                    {canModifyContents && (
                      <ConfirmModal
                        title="Delete Attachment"
                        description="Are you sure you want to delete this attachment?"
                        onConfirm={() => handleDeleteAttachment(attachment.id)}
                      >
                        <button className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-smooth">
                          <Trash2 size={16} />
                        </button>
                      </ConfirmModal>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checklists */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckSquare size={14} style={{ color: "var(--color-muted-foreground)" }} />
                <span className="text-sm font-semibold">Checklists</span>
              </div>
              {canModifyContents && (
                <button
                  onClick={() => setAddingChecklist(!addingChecklist)}
                  className="text-xs py-1 px-2 rounded-lg hover:bg-[var(--color-secondary)] transition-smooth cursor-pointer"
                  style={{ color: "var(--color-primary)" }}
                >
                  + Add Checklist
                </button>
              )}
            </div>

            {addingChecklist && (
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="text"
                  value={newChecklistTitle}
                  onChange={(e) => setNewChecklistTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddChecklist()}
                  placeholder="Checklist title..."
                  className="flex-1 py-1.5 px-3 rounded-xl text-sm outline-none"
                  style={{ background: "var(--color-background)", border: "1px solid var(--color-border)" }}
                  autoFocus
                />
                <button
                  onClick={handleAddChecklist}
                  className="py-1.5 px-3 rounded-lg text-sm font-medium cursor-pointer"
                  style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
                >
                  Add
                </button>
              </div>
            )}

            {card.checklists?.map((checklist: any) => {
              const total = checklist.items.length;
              const done = checklist.items.filter((i: any) => i.isCompleted).length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;

              return (
                <div key={checklist.id} className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{checklist.title}</span>
                      {canModifyContents && (
                        <ConfirmModal
                          title="Delete Checklist"
                          description="Are you sure you want to delete this checklist?"
                          onConfirm={() => handleDeleteChecklist(checklist.id)}
                        >
                          <button className="text-muted-foreground hover:text-destructive transition-smooth cursor-pointer">
                            <Trash2 size={12} />
                          </button>
                        </ConfirmModal>
                      )}
                    </div>
                    <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                      {done}/{total}
                    </span>
                  </div>
                  {total > 0 && (
                    <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: "var(--color-secondary)" }}>
                      <div className="h-full rounded-full transition-smooth" style={{ width: `${pct}%`, background: pct === 100 ? "var(--color-success)" : "var(--color-info)" }} />
                    </div>
                  )}
                  <div className="space-y-1">
                    {checklist.items.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-2 py-1">
                        <input
                          type="checkbox"
                          checked={item.isCompleted}
                          onChange={() => handleToggleItem(item.id, checklist.id)}
                          className="w-4 h-4 rounded cursor-pointer accent-[var(--color-info)]"
                        />
                        <span
                          className="text-sm flex-1"
                          style={{
                            textDecoration: item.isCompleted ? "line-through" : "none",
                            color: item.isCompleted ? "var(--color-muted-foreground)" : "var(--color-foreground)",
                          }}
                        >
                          {item.title}
                        </span>
                        {canModifyContents && (
                          <ConfirmModal
                            title="Delete Item"
                            description="Are you sure you want to delete this item?"
                            onConfirm={() => handleDeleteItem(item.id, checklist.id)}
                          >
                            <button className="text-muted-foreground hover:text-destructive transition-smooth opacity-0 group-hover:opacity-100 cursor-pointer">
                              <Trash2 size={12} />
                            </button>
                          </ConfirmModal>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Add item */}
                  {canModifyContents && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <input
                        type="text"
                        value={newItemTitle[checklist.id] || ""}
                        onChange={(e) =>
                          setNewItemTitle({ ...newItemTitle, [checklist.id]: e.target.value })
                        }
                        onKeyDown={(e) => e.key === "Enter" && handleAddItem(checklist.id)}
                        placeholder="Add item..."
                        className="flex-1 py-1 px-2 rounded-lg text-xs outline-none"
                        style={{ background: "var(--color-background)", border: "1px solid var(--color-border)" }}
                      />
                      <button
                        onClick={() => handleAddItem(checklist.id)}
                        className="p-1 rounded-md hover:bg-[var(--color-secondary)] transition-smooth cursor-pointer"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Comments */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={14} style={{ color: "var(--color-muted-foreground)" }} />
              <span className="text-sm font-semibold">Comments</span>
            </div>

            <div className="flex items-start gap-2 mb-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: "var(--color-muted)", color: "var(--color-muted-foreground)" }}
              >
                You
              </div>
              <div className="flex-1">
                <Editor
                  value={newComment}
                  onChange={setNewComment}
                  placeholder="Write a comment..."
                />
                <button
                  onClick={handleComment}
                  disabled={!newComment.trim()}
                  className="mt-1.5 flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-sm font-medium disabled:opacity-40 cursor-pointer"
                  style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
                >
                  <Send size={12} />
                  Comment
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {card.comments?.map((comment: any) => (
                <div key={comment.id} className="flex items-start gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: "var(--color-muted)", color: "var(--color-muted-foreground)" }}
                  >
                    {comment.user.image ? (
                      <img
                        src={comment.user.image}
                        alt=""
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      (comment.user.name?.charAt(0) || "?").toUpperCase()
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{comment.user.name}</span>
                      <span className="text-[10px]" style={{ color: "var(--color-muted-foreground)" }}>
                        {format(new Date(comment.createdAt), "MMM d, h:mm a")}
                      </span>
                    </div>
                    <div 
                      className="text-sm mt-1 prose prose-sm dark:prose-invert max-w-none break-words" 
                      style={{ color: "var(--color-foreground)" }}
                      dangerouslySetInnerHTML={{ __html: comment.content }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Timeline */}
          {activities.length > 0 && (
            <div className="pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
              <div className="flex items-center gap-2 mb-4">
                <AlignLeft size={14} style={{ color: "var(--color-muted-foreground)" }} />
                <span className="text-sm font-semibold">Activity</span>
              </div>
              <div className="space-y-4 pl-1">
                {activities.map((act) => (
                  <div key={act.id} className="flex gap-3 relative">
                    <div className="absolute left-[15px] top-8 bottom-[-16px] w-[2px] bg-[var(--color-secondary)] z-0" />
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 z-10"
                      style={{ background: "var(--color-muted)", color: "var(--color-muted-foreground)" }}
                    >
                      {act.user.image ? (
                        <img 
                          src={act.user.image} 
                          alt="" 
                          className="w-full h-full rounded-full object-cover" 
                        />
                      ) : (
                        (act.user.name?.charAt(0) || "?").toUpperCase()
                      )}
                    </div>
                    <div className="text-sm pt-1">
                      <span className="font-semibold">{act.user.name}</span>{" "}
                      <span className="text-muted-foreground">{act.action}</span>{" "}
                      <span className="font-medium">"{act.entityTitle}"</span>
                      <p className="text-[10px] mt-0.5 text-muted-foreground">
                        {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
