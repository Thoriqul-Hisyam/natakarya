"use client"

import { useEffect, useState } from "react"
import { createCard } from "@/actions/card"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  boardId: string
  lists: { id: string, title: string }[]
}

export function CreateTaskModal({
  isOpen,
  onClose,
  boardId,
  lists,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState("")
  const [listId, setListId] = useState(lists[0]?.id || "")
  const [isLoading, setIsLoading] = useState(false)

  // Reset state ONLY when modal transitions from closed to open
  useEffect(() => {
    if (isOpen) {
      setTitle("")
      setListId(lists[0]?.id || "")
    }
  }, [isOpen]) // Remove lists from dependency to prevent reset on list updates while open

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !listId) return

    setIsLoading(true)
    try {
      await createCard({
        title: title.trim(),
        listId,
        boardId,
      })
      toast.success("Task created")
      setTitle("")
      onClose()
    } catch {
      toast.error("Failed to create task")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-8 rounded-[2rem] border-none shadow-2xl bg-white transition-all">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight text-[#1a2e35]">Create New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Task Title</Label>
            <Input
              id="title"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
              autoFocus
              className="h-12 rounded-2xl bg-secondary/30 border-none shadow-sm focus-visible:ring-2 focus-visible:ring-primary transition-all px-4"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="list" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Select List</Label>
            <Select
              disabled={isLoading}
              value={listId}
              onValueChange={setListId}
            >
              <SelectTrigger id="list" className="h-12 rounded-2xl bg-secondary/30 border-none shadow-sm focus:ring-2 focus:ring-primary px-4 transition-all">
                <SelectValue placeholder="Choose a list" />
              </SelectTrigger>
              <SelectContent>
                {lists.map((list) => {
                  let dotColor = "var(--color-muted-foreground)";
                  if (list.title === "To Do") dotColor = "#f87171";
                  if (list.title === "In Progress") dotColor = "#fb923c";
                  if (list.title === "In Review") dotColor = "#22d3ee";
                  if (list.title === "Completed") dotColor = "#a78bfa";

                  return (
                    <SelectItem key={list.id} value={list.id}>
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-2.5 h-2.5 rounded-full shadow-sm" 
                          style={{ background: dotColor }} 
                        />
                        <span className="font-medium">{list.title}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-6">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose} 
              disabled={isLoading}
              className="rounded-2xl h-12 px-6 hover:bg-secondary/50 transition-colors"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !title.trim()}
              className="rounded-2xl h-12 px-8 bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
