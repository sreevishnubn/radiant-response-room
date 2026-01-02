import { useState } from "react";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Plus, 
  BarChart3, 
  PieChart, 
  LineChart, 
  Table2,
  FileText,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type WidgetType = "bar" | "pie" | "line" | "table" | "text";

interface Widget {
  id: string;
  type: WidgetType;
  title: string;
}

const widgetTypes = [
  { type: "bar" as WidgetType, label: "Bar Chart", icon: BarChart3 },
  { type: "pie" as WidgetType, label: "Pie Chart", icon: PieChart },
  { type: "line" as WidgetType, label: "Line Chart", icon: LineChart },
  { type: "table" as WidgetType, label: "Table", icon: Table2 },
  { type: "text" as WidgetType, label: "Text Block", icon: FileText },
];

interface DashboardBuilderProps {
  onSave: (widgets: Widget[]) => void;
  disabled?: boolean;
}

export const DashboardBuilder = ({ onSave, disabled }: DashboardBuilderProps) => {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [dashboardName, setDashboardName] = useState("My Dashboard");
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);

  const addWidget = (type: WidgetType) => {
    const widgetInfo = widgetTypes.find(w => w.type === type);
    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type,
      title: widgetInfo?.label || "New Widget"
    };
    setWidgets([...widgets, newWidget]);
    setShowWidgetPicker(false);
  };

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id));
  };

  const handleSave = () => {
    onSave(widgets);
  };

  const getWidgetIcon = (type: WidgetType) => {
    const widget = widgetTypes.find(w => w.type === type);
    return widget?.icon || BarChart3;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <LayoutDashboard className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Dashboard Builder</h3>
      </div>

      <Input
        value={dashboardName}
        onChange={(e) => setDashboardName(e.target.value)}
        placeholder="Dashboard name..."
        className="bg-muted/50"
      />

      {/* Widgets grid */}
      <div className="min-h-[200px] rounded-xl border border-dashed border-border bg-muted/30 p-4">
        {widgets.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Add widgets to build your dashboard
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {widgets.map((widget) => {
              const Icon = getWidgetIcon(widget.type);
              return (
                <motion.div
                  key={widget.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group relative flex flex-col items-center justify-center rounded-lg border border-border bg-card p-4"
                >
                  <button
                    onClick={() => removeWidget(widget.id)}
                    className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                  <Icon className="h-8 w-8 text-primary" />
                  <p className="mt-2 text-xs text-muted-foreground">{widget.title}</p>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add widget section */}
      <div className="relative">
        <Button
          onClick={() => setShowWidgetPicker(!showWidgetPicker)}
          variant="outline"
          className="w-full gap-2"
          disabled={disabled}
        >
          <Plus className="h-4 w-4" />
          Add Widget
        </Button>

        {showWidgetPicker && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-border bg-card p-2 shadow-lg"
          >
            <div className="grid grid-cols-5 gap-2">
              {widgetTypes.map((widget) => {
                const Icon = widget.icon;
                return (
                  <button
                    key={widget.type}
                    onClick={() => addWidget(widget.type)}
                    className="flex flex-col items-center gap-1 rounded-lg p-2 transition-colors hover:bg-muted"
                  >
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="text-[10px] text-muted-foreground">{widget.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      <Button
        onClick={handleSave}
        disabled={disabled || widgets.length === 0}
        className="w-full"
      >
        Save Dashboard
      </Button>
    </div>
  );
};
