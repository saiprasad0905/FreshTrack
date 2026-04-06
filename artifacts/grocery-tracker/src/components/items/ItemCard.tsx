import { differenceInDays, format } from "date-fns";
import { Check, Trash2, XCircle, AlertCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Item } from "@workspace/api-client-react";

interface ItemCardProps {
  item: Item;
  onConsume: (id: number) => void;
  onWaste: (id: number) => void;
  onDelete: (id: number) => void;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  Vegetables: "🥦",
  Fruits: "🍎",
  Dairy: "🥛",
  Meat: "🥩",
  Grains: "🌾",
  Spices: "🌶️",
  Other: "🛒"
};

export function ItemCard({ item, onConsume, onWaste, onDelete }: ItemCardProps) {
  const today = new Date();
  const expiryDate = new Date(item.expiryDate);
  const daysUntilExpiry = differenceInDays(expiryDate, today);

  // Determine status color and styling
  let statusConfig = {
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    shadow: "shadow-emerald-900/5",
    icon: <Clock className="w-4 h-4" />,
    label: `${daysUntilExpiry} days left`
  };

  if (item.status === 'consumed') {
    statusConfig = {
      color: "bg-muted text-muted-foreground border-border",
      shadow: "shadow-none",
      icon: <Check className="w-4 h-4" />,
      label: "Consumed"
    };
  } else if (item.status === 'wasted') {
    statusConfig = {
      color: "bg-muted text-muted-foreground border-border opacity-60",
      shadow: "shadow-none",
      icon: <XCircle className="w-4 h-4" />,
      label: "Wasted"
    };
  } else if (daysUntilExpiry < 0) {
    statusConfig = {
      color: "bg-destructive/10 text-destructive border-destructive/20",
      shadow: "shadow-destructive/5",
      icon: <AlertCircle className="w-4 h-4" />,
      label: "Expired"
    };
  } else if (daysUntilExpiry <= 1) {
    statusConfig = {
      color: "bg-red-100 text-red-700 border-red-200",
      shadow: "shadow-red-900/10",
      icon: <AlertCircle className="w-4 h-4" />,
      label: "Expiring Today!"
    };
  } else if (daysUntilExpiry <= 3) {
    statusConfig = {
      color: "bg-orange-100 text-orange-700 border-orange-300",
      shadow: "shadow-orange-900/10",
      icon: <Clock className="w-4 h-4" />,
      label: `${daysUntilExpiry} days left`
    };
  }

  const emoji = CATEGORY_EMOJIS[item.category] || CATEGORY_EMOJIS.Other;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={item.status === 'active' ? { y: -4 } : {}}
      className={cn(
        "group relative bg-card rounded-3xl p-5 border",
        "transition-all duration-300",
        statusConfig.shadow,
        item.status === 'active' ? "hover:shadow-xl hover:border-primary/30" : ""
      )}
      style={{ boxShadow: `var(--shadow-subtle)` }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center text-2xl shadow-sm">
            {emoji}
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg text-foreground line-clamp-1">
              {item.name}
            </h3>
            <p className="text-sm text-muted-foreground font-medium">
              {item.quantity} {item.unit}
            </p>
          </div>
        </div>
        <button 
          onClick={() => onDelete(item.id)}
          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
          title="Delete item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold w-fit border",
        statusConfig.color
      )}>
        {statusConfig.icon}
        {statusConfig.label}
      </div>

      {item.status === 'active' && (
        <div className="mt-5 grid grid-cols-2 gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => onConsume(item.id)}
            className="flex items-center justify-center gap-2 py-2.5 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-xl font-semibold transition-colors"
          >
            <Check className="w-4 h-4" />
            Ate it
          </button>
          <button
            onClick={() => onWaste(item.id)}
            className="flex items-center justify-center gap-2 py-2.5 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-xl font-semibold transition-colors"
          >
            <XCircle className="w-4 h-4" />
            Wasted
          </button>
        </div>
      )}
      
      {/* Visual indicator for missing actions when not hovered on active items */}
      {item.status === 'active' && (
        <div className="mt-5 h-10 rounded-xl bg-muted/30 flex items-center justify-center text-xs text-muted-foreground group-hover:hidden transition-all">
          Hover to update
        </div>
      )}
    </motion.div>
  );
}
