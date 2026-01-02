import { motion } from "framer-motion";
import { Bot } from "lucide-react";

export const TypingIndicator = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-4 bg-secondary/30 px-4 py-6 md:px-8"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
        <Bot className="h-4 w-4" />
      </div>
      <div className="flex items-center gap-1 pt-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-2 w-2 rounded-full bg-muted-foreground/50"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};
