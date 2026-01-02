import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { FileText, Upload, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface AnalyzeInputProps {
  onAnalyze: (data: { text?: string; file?: File }) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const AnalyzeInput = ({ onAnalyze, isLoading, disabled }: AnalyzeInputProps) => {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleAnalyze = () => {
    if (text.trim() || file) {
      onAnalyze({ text: text.trim() || undefined, file: file || undefined });
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Data Analysis</h3>
      </div>
      
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your data or text to analyze..."
        disabled={disabled}
        className="min-h-[120px] resize-none bg-muted/50 border-border"
        rows={5}
      />

      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          accept=".csv,.json,.txt,.xlsx,.xls"
        />
        
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload File
        </Button>

        {file && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5"
          >
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">{file.name}</span>
            <button
              onClick={removeFile}
              className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          </motion.div>
        )}
      </div>

      <Button
        onClick={handleAnalyze}
        disabled={disabled || isLoading || (!text.trim() && !file)}
        className="w-full gap-2"
      >
        {isLoading ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <Sparkles className="h-4 w-4" />
            </motion.div>
            Analyzing...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Analyze Data
          </>
        )}
      </Button>
    </div>
  );
};
