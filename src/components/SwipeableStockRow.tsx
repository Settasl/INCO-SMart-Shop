import React, { useState, useRef } from "react";
import {
  Plus,
  Minus,
  Barcode,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MapPin,
  Check,
  Zap,
  ChevronRight,
  MoveHorizontal
} from "lucide-react";
import { InventoryItem, StoreSettings } from "../types";
import { sounds } from "../lib/sound";

interface SwipeableStockRowProps {
  item: InventoryItem;
  settings: StoreSettings;
  isSelected: boolean;
  isOutOfStock: boolean;
  isLowStock: boolean;
  currentFlash?: { type: "up" | "down" | "set"; timestamp: number };
  onToggleSelect: () => void;
  onQuantityWithFlash: (id: string, delta: number, note?: string) => void;
  onExactQuantityWithFlash: (id: string, newQuantity: number, note?: string) => void;
  onScanItemBarcode: (item: InventoryItem) => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
  onQuickSellItem?: (item: InventoryItem) => void;
}

export const SwipeableStockRow: React.FC<SwipeableStockRowProps> = ({
  item,
  settings,
  isSelected,
  isOutOfStock,
  isLowStock,
  currentFlash,
  onToggleSelect,
  onQuantityWithFlash,
  onExactQuantityWithFlash,
  onScanItemBarcode,
  onEditItem,
  onDeleteItem,
  onQuickSellItem,
}) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeFeedback, setSwipeFeedback] = useState<"plus" | "minus" | null>(null);

  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const isPointerDownRef = useRef(false);

  // Swipe Threshold in px
  const SWIPE_THRESHOLD = 50;
  const MAX_DRAG = 85;

  // Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input") || target.closest("select")) {
      return;
    }
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    currentXRef.current = currentX;
    const diff = currentX - startXRef.current;

    const clamped = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, diff));
    setOffsetX(clamped);

    if (clamped > SWIPE_THRESHOLD) {
      setSwipeFeedback("plus");
    } else if (clamped < -SWIPE_THRESHOLD) {
      setSwipeFeedback("minus");
    } else {
      setSwipeFeedback(null);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (offsetX > SWIPE_THRESHOLD) {
      sounds.playStockAdd();
      sounds.triggerHaptic(15);
      onQuantityWithFlash(item.id, 1, "Quick Swipe +1");
    } else if (offsetX < -SWIPE_THRESHOLD) {
      sounds.playStockRemove();
      sounds.triggerHaptic(15);
      onQuantityWithFlash(item.id, -1, "Quick Swipe -1");
    }

    setOffsetX(0);
    setSwipeFeedback(null);
  };

  // Pointer / Mouse Drag Handlers (for desktop gesture feel)
  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input") || target.closest("select")) {
      return;
    }
    isPointerDownRef.current = true;
    startXRef.current = e.clientX;
    currentXRef.current = e.clientX;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return;
    const diff = e.clientX - startXRef.current;
    if (Math.abs(diff) > 5) {
      setIsDragging(true);
      const clamped = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, diff));
      setOffsetX(clamped);

      if (clamped > SWIPE_THRESHOLD) {
        setSwipeFeedback("plus");
      } else if (clamped < -SWIPE_THRESHOLD) {
        setSwipeFeedback("minus");
      } else {
        setSwipeFeedback(null);
      }
    }
  };

  const handlePointerUp = () => {
    if (isPointerDownRef.current) {
      isPointerDownRef.current = false;
      if (isDragging) {
        setIsDragging(false);
        if (offsetX > SWIPE_THRESHOLD) {
          sounds.playStockAdd();
          sounds.triggerHaptic(15);
          onQuantityWithFlash(item.id, 1, "Quick Drag +1");
        } else if (offsetX < -SWIPE_THRESHOLD) {
          sounds.playStockRemove();
          sounds.triggerHaptic(15);
          onQuantityWithFlash(item.id, -1, "Quick Drag -1");
        }
      }
      setOffsetX(0);
      setSwipeFeedback(null);
    }
  };

  return (
    <div className="relative overflow-hidden group select-none bg-slate-900">
      {/* Background Action Reveal Underneath */}
      <div className="absolute inset-0 flex items-center justify-between pointer-events-none px-3 font-black text-xs">
        {/* Left Side: Swipe Right Indicator (+1 Stock) */}
        <div
          className={`flex items-center gap-1.5 text-white px-2.5 py-1.5 rounded-lg transition-all duration-150 ${
            offsetX > 20
              ? "bg-emerald-600 opacity-100 scale-100 shadow-md neon-glow-emerald"
              : "opacity-0 scale-90"
          }`}
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span className="font-bold text-[11px]">+1 Stock</span>
        </div>

        {/* Right Side: Swipe Left Indicator (-1 Stock) */}
        <div
          className={`flex items-center gap-1.5 text-white px-2.5 py-1.5 rounded-lg transition-all duration-150 ${
            offsetX < -20
              ? "bg-rose-600 opacity-100 scale-100 shadow-md"
              : "opacity-0 scale-90"
          }`}
        >
          <span className="font-bold text-[11px]">-1 Stock</span>
          <Minus className="w-4 h-4 stroke-[3]" />
        </div>
      </div>

      {/* Foreground Sliding Content Container */}
      <div
        id={`tally-item-row-${item.id}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
        className={`p-2.5 sm:p-3 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-2.5 relative z-10 ${
          isSelected
            ? "bg-yellow-50/90 dark:bg-yellow-950/40 border-l-4 border-yellow-400"
            : isOutOfStock
            ? "bg-rose-50/70 dark:bg-rose-950/30"
            : isLowStock
            ? "bg-amber-50/60 dark:bg-amber-950/25"
            : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850"
        }`}
      >
        {/* Left Checkbox & Item Info */}
        <div className="flex items-start sm:items-center gap-2.5 flex-1 min-w-0">
          {/* Selection Checkbox */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              sounds.playClick();
              sounds.triggerHaptic(10);
              onToggleSelect();
            }}
            className={`mt-0.5 sm:mt-0 p-1 rounded-md transition-all shrink-0 ${
              isSelected
                ? "bg-yellow-400 text-slate-950 shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 border border-slate-300 dark:border-slate-700"
            }`}
            title={isSelected ? "Deselect item" : "Select item for batch actions"}
          >
            {isSelected ? (
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            ) : (
              <div className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Item Details */}
          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                {item.name}
              </span>

              {/* Category Tag */}
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700">
                {item.category}
              </span>

              {/* Stock Status Badge */}
              {isOutOfStock ? (
                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800 flex items-center gap-0.5">
                  <XCircle className="w-2.5 h-2.5 text-rose-600 dark:text-rose-400" /> Out of Stock
                </span>
              ) : isLowStock ? (
                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 flex items-center gap-0.5">
                  <AlertCircle className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" /> Low (≤{item.reorderPoint})
                </span>
              ) : (
                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" /> In Stock
                </span>
              )}
            </div>

            <div className="flex items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
              <span>
                Selling:{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  {settings.currencySymbol}
                  {item.sellingPrice.toFixed(2)}
                </strong>{" "}
                <span className="text-[10px] text-slate-400">/{item.unit}</span>
              </span>
              <span>
                Cost:{" "}
                <span className="text-slate-600 dark:text-slate-400">
                  {settings.currencySymbol}
                  {item.costPrice.toFixed(2)}
                </span>
              </span>
              {item.barcode && (
                <span className="flex items-center gap-0.5 text-slate-400 dark:text-slate-500 font-mono text-[10px]">
                  <Barcode className="w-3 h-3" /> {item.barcode}
                </span>
              )}
              {item.location && (
                <span className="flex items-center gap-0.5 text-slate-400 dark:text-slate-500 text-[10px]">
                  <MapPin className="w-2.5 h-2.5 text-slate-400 dark:text-slate-500" /> {item.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Counter Control Cluster */}
        <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0 border-t md:border-t-0 pt-1.5 md:pt-0 border-slate-100 dark:border-slate-800">
          {/* Quick Adjust Stepper */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700">
            <button
              onClick={() => {
                sounds.playStockRemove();
                sounds.triggerHaptic(15);
                onQuantityWithFlash(item.id, -5);
              }}
              className="px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
              title="Subtract 5"
            >
              -5
            </button>
            <button
              onClick={() => {
                sounds.playStockRemove();
                sounds.triggerHaptic(10);
                onQuantityWithFlash(item.id, -1);
              }}
              className="p-1 bg-white dark:bg-slate-700 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 rounded shadow-2xs font-bold transition-colors"
              title="Subtract 1"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            {/* Direct Numeric Input with Flash Animation */}
            <div className="mx-1 text-center relative">
              <input
                type="number"
                min="0"
                value={item.quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  sounds.playClick();
                  onExactQuantityWithFlash(
                    item.id,
                    isNaN(val) ? 0 : Math.max(0, val)
                  );
                }}
                className={`w-12 text-center font-black text-sm py-0.5 rounded border transition-all duration-300 ${
                  currentFlash?.type === "up"
                    ? "bg-emerald-200 text-emerald-950 border-emerald-500 ring-2 ring-emerald-500 scale-105 shadow-xs"
                    : currentFlash?.type === "down"
                    ? "bg-rose-200 text-rose-950 border-rose-500 ring-2 ring-rose-500 scale-105 shadow-xs"
                    : currentFlash?.type === "set"
                    ? "bg-yellow-200 text-slate-950 border-yellow-500 ring-2 ring-yellow-400 scale-105 shadow-xs"
                    : isOutOfStock
                    ? "bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-800"
                    : isLowStock
                    ? "bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800"
                    : "bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700"
                }`}
              />
              <div className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold lowercase -mt-0.5">
                {item.unit}
              </div>
            </div>

            <button
              onClick={() => {
                sounds.playStockAdd();
                sounds.triggerHaptic(10);
                onQuantityWithFlash(item.id, 1);
              }}
              className="p-1 bg-yellow-400 text-slate-950 hover:bg-yellow-300 rounded shadow-2xs font-bold transition-colors"
              title="Add 1"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </button>
            <button
              onClick={() => {
                sounds.playStockAdd();
                sounds.triggerHaptic(15);
                onQuantityWithFlash(item.id, 5);
              }}
              className="px-1.5 py-0.5 text-[10px] font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
              title="Add 5"
            >
              +5
            </button>
            <button
              onClick={() => {
                sounds.playStockAdd();
                sounds.triggerHaptic(20);
                onQuantityWithFlash(item.id, 24);
              }}
              className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 rounded transition-colors"
              title="Add Crate/Carton (24)"
            >
              +24
            </button>
          </div>

          {/* Quick Actions (Sell / Barcode / Edit / Delete) */}
          <div className="flex items-center gap-0.5">
            {/* 1-Tap Quick Sell Button */}
            {item.quantity > 0 && onQuickSellItem && (
              <button
                type="button"
                onClick={() => {
                  sounds.playCashSale();
                  sounds.triggerHaptic(20);
                  onQuickSellItem(item);
                }}
                className="px-2 py-1 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-[11px] rounded-md shadow-xs transition-transform active:scale-95 flex items-center gap-1 neon-glow-amber"
                title={`Quick Sell 1 ${item.unit} of "${item.name}" (${settings.currencySymbol}${item.sellingPrice.toFixed(2)})`}
              >
                <Zap className="w-3 h-3 fill-slate-950" />
                <span>Sell</span>
              </button>
            )}

            <button
              onClick={() => {
                sounds.playClick();
                sounds.triggerHaptic(10);
                onScanItemBarcode(item);
              }}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
              title="Scan/Assign Barcode"
            >
              <Barcode className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                sounds.triggerHaptic(10);
                onEditItem(item);
              }}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
              title="Edit Item Details"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                sounds.playBeep();
                if (confirm(`Are you sure you want to delete "${item.name}" from inventory?`)) {
                  sounds.playStockRemove();
                  onDeleteItem(item.id);
                }
              }}
              className="p-1.5 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors"
              title="Delete Item"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
