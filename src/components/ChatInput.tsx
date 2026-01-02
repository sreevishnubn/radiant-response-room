import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModeSelector, ChatMode } from "./ModeSelector";
import { VoiceInput } from "./VoiceInput";
import { AnalyzeInput } from "./AnalyzeInput";
import { ScannerInput } from "./ScannerInput";
import { DashboardBuilder } from "./DashboardBuilder";

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
  const [mode, setMode] = useState<ChatMode>("agent");
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

  const handleVoiceTranscript = (text: string) => {
    onSend(text);
  };

  const handleAnalyze = (data: { text?: string; file?: File }) => {
    if (data.text) {
      onSend(`[Analyze] ${data.text}`);
    } else if (data.file) {
      onSend(`[Analyze] Analyzing file: ${data.file.name}`);
    }
  };

  const handleScanCapture = (imageData: string) => {
    onSend(`[Scanner] Captured image for analysis`);
  };

  const handleDashboardSave = (widgets: any[]) => {
    onSend(`[Dashboard] Created dashboard with ${widgets.length} widgets`);
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

  // Render different input based on mode
  if (mode === "interact") {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 shadow-lg">
        <div className="mb-4 flex items-center gap-2">
          <ModeSelector currentMode={mode} onModeChange={setMode} />
          <span className="text-sm font-medium text-muted-foreground">Voice Interaction</span>
        </div>
        <VoiceInput onTranscript={handleVoiceTranscript} disabled={disabled} />
      </div>
    );
  }

  if (mode === "analyze") {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 shadow-lg">
        <div className="mb-4 flex items-center gap-2">
          <ModeSelector currentMode={mode} onModeChange={setMode} />
          <span className="text-sm font-medium text-muted-foreground">Data Analysis</span>
        </div>
        <AnalyzeInput onAnalyze={handleAnalyze} isLoading={isLoading} disabled={disabled} />
      </div>
    );
  }

  if (mode === "scanner") {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 shadow-lg">
        <div className="mb-4 flex items-center gap-2">
          <ModeSelector currentMode={mode} onModeChange={setMode} />
          <span className="text-sm font-medium text-muted-foreground">Camera Scanner</span>
        </div>
        <ScannerInput onCapture={handleScanCapture} disabled={disabled} />
      </div>
    );
  }

  if (mode === "dashboard") {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 shadow-lg">
        <div className="mb-4 flex items-center gap-2">
          <ModeSelector currentMode={mode} onModeChange={setMode} />
          <span className="text-sm font-medium text-muted-foreground">Dashboard Builder</span>
        </div>
        <DashboardBuilder onSave={handleDashboardSave} disabled={disabled} />
      </div>
    );
  }

  // Default: Agent mode (chat)
  return (
    <div className="relative flex w-full items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-lg transition-all focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
      <ModeSelector currentMode={mode} onModeChange={setMode} />
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
