"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createWorkspace } from "@/actions/workspace";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CreateWorkspaceDialogProps {
  isOpen?: boolean;
  onClose?: () => void;
  showTrigger?: boolean;
}

export function CreateWorkspaceDialog({ 
  isOpen: controlledOpen, 
  onClose,
  showTrigger = true 
}: CreateWorkspaceDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (controlledOpen !== undefined) {
      if (!value && onClose) onClose();
    } else {
      setInternalOpen(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const workspace = await createWorkspace({ name: name.trim(), description: description.trim() || undefined });
      toast.success("Workspace created!");
      setOpen(false);
      setName("");
      setDescription("");
      router.push(`/dashboard/workspace/${workspace.id}`);
    } catch (error) {
      toast.error("Failed to create workspace");
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[480px] p-8 rounded-[2rem] border-none shadow-2xl bg-white transition-all z-[120]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight text-[#1a2e35]">Create Workspace</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="ws-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Workspace Name</Label>
            <Input
              id="ws-name"
              placeholder="e.g. My Team"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              autoFocus
              className="h-12 rounded-2xl bg-secondary/30 border-none shadow-sm focus-visible:ring-2 focus-visible:ring-primary transition-all px-4"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ws-desc" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Description (Optional)</Label>
            <Textarea
              id="ws-desc"
              placeholder="What's this workspace for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={3}
              className="rounded-2xl bg-secondary/30 border-none shadow-sm focus-visible:ring-2 focus-visible:ring-primary transition-all px-4 py-3 resize-none"
            />
          </div>
          <DialogFooter className="pt-6">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setOpen(false)} 
              disabled={loading}
              className="rounded-2xl h-12 px-6 hover:bg-secondary/50 transition-colors"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !name.trim()}
              className="rounded-2xl h-12 px-8 bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all font-bold"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Workspace
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  if (!showTrigger) return content;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 py-2.5 px-5 rounded-2xl font-bold text-sm transition-smooth bg-[#1a2e35] text-white hover:opacity-90 active:scale-[0.98] cursor-pointer shadow-md"
      >
        <Plus size={16} />
        New Workspace
      </button>
      {content}
    </>
  );
}
