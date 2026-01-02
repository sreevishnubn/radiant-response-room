import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Bot, 
  Mic, 
  BarChart3, 
  Camera, 
  LayoutDashboard,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ChatMode = "agent" | "interact" | "analyze" | "scanner" | "dashboard";

interface ModeSelectorProps {
  currentMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
}

const modes = [
  { id: "agent" as ChatMode, label: "Agent", icon: Bot, description: "AI Chat Assistant" },
  { id: "interact" as ChatMode, label: "Interact", icon: Mic, description: "Voice Interaction" },
  { id: "analyze" as ChatMode, label: "Analyze", icon: BarChart3, description: "Data Analysis" },
  { id: "scanner" as ChatMode, label: "Scanner", icon: Camera, description: "Camera Scanner" },
  { id: "dashboard" as ChatMode, label: "Dashboard", icon: LayoutDashboard, description: "Create Dashboards" },
];

export const ModeSelector = ({ currentMode, onModeChange }: ModeSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleModeSelect = (mode: ChatMode) => {
    onModeChange(mode);
    setIsOpen(false);
  };

  const currentModeData = modes.find(m => m.id === currentMode);
  const CurrentIcon = currentModeData?.icon || Bot;

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl transition-all",
          isOpen 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        )}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-5 w-5" />
            </motion.div>
          ) : (
            <motion.div
              key="plus"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Plus className="h-5 w-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Mode options */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-14 left-0 z-50 w-56 rounded-xl border border-border bg-card p-2 shadow-xl"
            >
              <div className="mb-2 px-2 py-1">
                <p className="text-xs font-medium text-muted-foreground">Select Mode</p>
              </div>
              {modes.map((mode) => {
                const Icon = mode.icon;
                const isSelected = currentMode === mode.id;
                
                return (
                  <motion.button
                    key={mode.id}
                    onClick={() => handleModeSelect(mode.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all",
                      isSelected 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-muted text-foreground"
                    )}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="h-4 w-4" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{mode.label}</p>
                      <p className={cn(
                        "text-xs",
                        isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}>
                        {mode.description}
                      </p>
                    </div>
                    {isSelected && (
                      <motion.div
                        layoutId="selectedIndicator"
                        className="h-2 w-2 rounded-full bg-primary-foreground"
                      />
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
