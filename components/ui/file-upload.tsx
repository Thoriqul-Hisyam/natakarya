"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { UploadCloud, Loader2 } from "lucide-react";

interface FileUploadProps {
  endpoint: string; // Kept for compatibility but not strictly used
  onClientUploadComplete?: (res: any[]) => void;
  onUploadError?: (error: Error) => void;
  className?: string;
}

export const FileUpload = ({
  onClientUploadComplete,
  onUploadError,
  className
}: FileUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await uploadFiles(e.target.files);
    }
  };

  const uploadFiles = async (files: FileList | File[]) => {
    setIsUploading(true);
    
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload files");
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (onClientUploadComplete) {
        onClientUploadComplete(data.files);
      }
    } catch (error: any) {
      if (onUploadError) {
        onUploadError(error);
      } else {
        toast.error(`Upload error: ${error.message}`);
      }
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  return (
    <div 
      className={`relative p-6 bg-[var(--color-secondary)] rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-4 min-h-[160px] ${isDragOver ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5" : "border-[var(--color-border)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-secondary)]/80"} ${className || ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isUploading && inputRef.current?.click()}
    >
      <input 
        type="file" 
        multiple 
        ref={inputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        disabled={isUploading}
      />
      
      {isUploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-10 h-10 text-[var(--color-primary)] animate-spin" />
          <p className="text-sm font-medium text-[var(--color-foreground)]">Uploading files...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 pointer-events-none">
          <UploadCloud className={`w-10 h-10 ${isDragOver ? "text-[var(--color-primary)]" : "text-[var(--color-muted-foreground)]"}`} />
          <p className="text-sm font-medium text-[var(--color-foreground)]">
            <span className="text-[var(--color-primary)] font-semibold hover:underline">Choose files</span> or drag and drop
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Image, Video, Audio, or PDF
          </p>
        </div>
      )}
    </div>
  );
};
