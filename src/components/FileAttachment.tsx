import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Paperclip, X, File, Image, FileText, Film, Music } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AttachedFile {
  id: string;
  file: File;
  preview?: string;
}

interface FileAttachmentProps {
  attachments: AttachedFile[];
  onAttach: (files: AttachedFile[]) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

const getFileIcon = (type: string) => {
  if (type.startsWith("image/")) return Image;
  if (type.startsWith("video/")) return Film;
  if (type.startsWith("audio/")) return Music;
  if (type.includes("pdf") || type.includes("document")) return FileText;
  return File;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const FileAttachment = ({
  attachments,
  onAttach,
  onRemove,
  disabled,
}: FileAttachmentProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    const newAttachments: AttachedFile[] = files.map((file) => {
      const attachment: AttachedFile = {
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
      };

      // Create preview for images
      if (file.type.startsWith("image/")) {
        attachment.preview = URL.createObjectURL(file);
      }

      return attachment;
    });

    onAttach(newAttachments);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Attachment previews */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2 px-1"
          >
            {attachments.map((attachment) => {
              const Icon = getFileIcon(attachment.file.type);
              const isImage = attachment.file.type.startsWith("image/");

              return (
                <motion.div
                  key={attachment.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={cn(
                    "group relative flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-2",
                    isImage ? "h-16 w-16" : "pr-8"
                  )}
                >
                  {isImage && attachment.preview ? (
                    <img
                      src={attachment.preview}
                      alt={attachment.file.name}
                      className="h-full w-full rounded object-cover"
                    />
                  ) : (
                    <>
                      <Icon className="h-4 w-4 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-foreground">
                          {attachment.file.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatFileSize(attachment.file.size)}
                        </p>
                      </div>
                    </>
                  )}
                  
                  <button
                    onClick={() => onRemove(attachment.id)}
                    className={cn(
                      "absolute flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100",
                      isImage ? "-right-1.5 -top-1.5" : "right-1 top-1/2 -translate-y-1/2"
                    )}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Attach button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl transition-all",
          "bg-muted text-muted-foreground hover:bg-muted/80",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <Paperclip className="h-5 w-5" />
      </button>
    </div>
  );
};
