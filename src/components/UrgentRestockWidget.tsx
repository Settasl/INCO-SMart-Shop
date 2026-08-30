import React, { useState } from "react";
import {
  AlertOctagon,
  Copy,
  Check,
  Zap,
  ChevronDown,
  ChevronUp,
  Package,
} from "lucide-react";
import { InventoryItem, StoreSettings } from "../types";

interface UrgentRestockWidgetProps {
  items: InventoryItem[];
  settings: StoreSettings;
  onQuickRestockItem: (itemId: string, addQuantity: number) => void;
  onOpenFullRestockModal?: () => void;
  onShowToast: (message: string, type?: "success" | "info") => void;
}

export const UrgentRestockWidget: React.FC<UrgentRestockWidgetProps> = ({
  items,
  settings,
  onQuickRestockItem,
  onOpenFullRestockModal,
  onShowToast,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedOrder, setCopiedOrder] = useState(false);

  // Filter out of stock items
  const outOfStockItems = items.filter((item) => item.quantity === 0);

  if (outOfStockItems.length === 0) {
    return null;
  }

  const handleRestockAll = () => {
    outOfStockItems.forEach((item) => {
      const qtyToAdd = Math.max(1, item.reorderPoint || 5);
      onQuickRestockItem(item.id, qtyToAdd);
    });
    onShowToast(`Restocked all ${outOfStockItems.length} items to reorder levels!`, "success");
  };

  const handleCopyOrderText = () => {
    const lines = [
      `🚨 *URGENT RESTOCK ORDER - ${settings.storeName.toUpperCase()}*`,
      `Date: ${new Date().toLocaleDateString()} | Total Out of Stock: ${outOfStockItems.length}`,
      "----------------------------------------",
      ...outOfStockItems.map((item, idx) => {
        const targetQty = Math.max(1, item.reorderPoint || 5);
        return `${idx + 1}. *${item.name}* - Order: ${targetQty} ${item.unit} (SKU: ${item.sku || "N/A"})`;
      }),
      "----------------------------------------",
      "Please confirm delivery availability.",
    ];

    navigator.clipboard.writeText(lines.join("\n"));
    setCopiedOrder(true);
    onShowToast("Urgent supplier restock order copied to clipboard!");
    setTimeout(() => setCopiedOrder(false), 2000);
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-rose-200/80 bg-rose-50/50 dark:bg-rose-950/20 dark:border-rose-900/50 shadow-xs backdrop-blur-md transition-all">
      <div className="p-3 sm:p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Left: Icon & Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-xs">
            <Package className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                Urgent Restock Required
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white shadow-xs">
                {outOfStockItems.length} Items Out of Stock
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Zero stock available in store. Add to supplier orders or restock with 1-tap.
            </p>
          </div>
        </div>

        {/* Right Action Buttons (Image 1) */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleCopyOrderText}
            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all hover:bg-slate-50"
          >
            {copiedOrder ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copiedOrder ? "Copied" : "Copy Order"}</span>
          </button>

          <button
            onClick={handleRestockAll}
            className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all hover:shadow-md"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>Restock All ({outOfStockItems.length})</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded item listing */}
      {isExpanded && (
        <div className="p-3 pt-0 border-t border-rose-100 dark:border-rose-900/40 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
          {outOfStockItems.map((item) => (
            <div
              key={item.id}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs"
            >
              <div className="min-w-0 pr-2">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.name}</div>
                <div className="text-[10px] text-slate-500">{item.category} • Target: {item.reorderPoint} {item.unit}</div>
              </div>
              <button
                onClick={() => {
                  onQuickRestockItem(item.id, Math.max(1, item.reorderPoint));
                  onShowToast(`Restocked ${item.name}!`);
                }}
                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 font-bold text-[11px] rounded-lg cursor-pointer"
              >
                + Restock
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
