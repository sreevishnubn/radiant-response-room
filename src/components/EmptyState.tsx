import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface EmptyStateProps {
  onSuggestionClick: (text: string) => void;
}

const suggestions = [
  "Explain quantum computing in simple terms",
  "Write a poem about technology",
  "What are the best practices for React?",
  "Help me brainstorm project ideas",
];

export const EmptyState = ({ onSuggestionClick }: EmptyStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-1 flex-col items-center justify-center px-4"
    >
      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>
      <h2 className="mb-2 text-2xl font-semibold text-foreground">
        How can I help you today?
      </h2>
      <p className="mb-8 text-center text-muted-foreground">
        Start a conversation or try one of these suggestions
      </p>
      <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={suggestion}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            onClick={() => onSuggestionClick(suggestion)}
            className="group rounded-xl border border-border bg-card p-4 text-left text-sm transition-all hover:border-primary/50 hover:bg-secondary/50"
          >
            <span className="text-foreground group-hover:text-primary transition-colors">
              {suggestion}
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};
