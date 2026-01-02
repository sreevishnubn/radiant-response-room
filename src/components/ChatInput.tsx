import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const ChatInput = ({
  onSend,
  onStop,
  isLoading,
  disabled,
}: ChatInputProps) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (input.trim() && !isLoading && !disabled) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [input]);

  return (
    <div className="relative flex w-full items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-lg transition-all focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
      <Textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Message..."
        disabled={disabled}
        className={cn(
          "min-h-[44px] max-h-[200px] flex-1 resize-none border-0 bg-transparent px-3 py-3 text-base placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0",
          disabled && "cursor-not-allowed opacity-50"
        )}
        rows={1}
      />
      {isLoading ? (
        <Button
          onClick={onStop}
          size="icon"
          className="h-10 w-10 shrink-0 rounded-xl bg-muted text-muted-foreground hover:bg-muted/80"
        >
          <Square className="h-4 w-4 fill-current" />
        </Button>
      ) : (
        <Button
          onClick={handleSubmit}
          disabled={!input.trim() || disabled}
          size="icon"
          className={cn(
            "h-10 w-10 shrink-0 rounded-xl transition-all",
            input.trim()
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground"
          )}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
