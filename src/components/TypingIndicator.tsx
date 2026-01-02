import { motion } from "framer-motion";
import { Bot, Loader2 } from "lucide-react";

export const TypingIndicator = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-4 bg-secondary/30 px-4 py-6 md:px-8"
    >
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
        <Bot className="h-4 w-4" />
        {/* Spinning ring around avatar */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">Processing...</span>
        </div>
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-primary/50"
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.4, 1, 0.4] 
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};
