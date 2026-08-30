import React, { useState } from "react";
import {
  X,
  MessageCircle,
  Copy,
  Check,
  Send,
  Plus,
  Minus,
  Package,
  Sparkles,
  Phone,
  AlertTriangle,
} from "lucide-react";
import { InventoryItem, StoreSettings } from "../types";

interface WhatsAppOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  settings: StoreSettings;
  onShowToast: (message: string, type?: "success" | "info") => void;
}

export const WhatsAppOrderModal: React.FC<WhatsAppOrderModalProps> = ({
  isOpen,
  onClose,
  items,
  settings,
  onShowToast,
}) => {
  const [supplierPhone, setSupplierPhone] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [customNote, setCustomNote] = useState<string>(
    "Please confirm current stock availability and delivery schedule. Thank you!"
  );

  // Filter low stock and out of stock items
  const lowOrOutItems = items.filter((i) => i.quantity <= i.reorderPoint);

  // Editable custom quantities map (default to bringing them to reorder target * 2 or min 10)
  const [customOrderQtys, setCustomOrderQtys] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    lowOrOutItems.forEach((item) => {
      initial[item.id] = Math.max(1, item.reorderPoint > 0 ? item.reorderPoint * 2 : 12);
    });
    return initial;
  });

  if (!isOpen) return null;

  const handleQtyChange = (itemId: string, delta: number) => {
    setCustomOrderQtys((prev) => ({
      ...prev,
      [itemId]: Math.max(1, (prev[itemId] || 1) + delta),
    }));
  };

  // Generate formatted WhatsApp message text
  const totalEstCost = lowOrOutItems.reduce((sum, item) => {
    const orderQty = customOrderQtys[item.id] || Math.max(1, item.reorderPoint * 2);
    return sum + orderQty * item.costPrice;
  }, 0);

  const generateMessageText = () => {
    const lines = [
      `📦 *STOCK RESTOCK ORDER - ${settings.storeName.toUpperCase()}*`,
      `📅 Date: ${new Date().toLocaleDateString(undefined, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      })}`,
      `🏬 Store: ${settings.storeName}`,
      "----------------------------------------",
      ...lowOrOutItems.map((item, idx) => {
        const orderQty = customOrderQtys[item.id] || Math.max(1, item.reorderPoint * 2);
        const estCost = orderQty * item.costPrice;
        const statusBadge = item.quantity === 0 ? "🚨 [OUT OF STOCK]" : "⚠️ [LOW STOCK]";
        return `${idx + 1}. ${statusBadge} *${item.name}* (${item.category})\n   Order Qty: *${orderQty} ${item.unit}* (Current stock: ${item.quantity} ${item.unit})\n   Est. Cost: ${settings.currencySymbol}${estCost.toFixed(2)}${item.sku ? ` | SKU: ${item.sku}` : ""}`;
      }),
      "----------------------------------------",
      `💰 *Total Estimated Order Value:* ${settings.currencySymbol}${totalEstCost.toFixed(2)}`,
      `📝 *Note:* ${customNote}`,
    ];
    return lines.join("\n");
  };

  const handleCopyText = () => {
    const msg = generateMessageText();
    navigator.clipboard.writeText(msg);
    setCopied(true);
    onShowToast("WhatsApp supplier restock order copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    const msg = generateMessageText();
    const cleanPhone = supplierPhone.replace(/[^0-9]/g, "");
    if (cleanPhone) {
      window.open(
        `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`,
        "_blank"
      );
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    }
    onShowToast("Opening WhatsApp with restock order...");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col my-4 max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-emerald-950 text-white border-b border-emerald-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  WhatsApp Supplier Restock Order
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-400 text-slate-950">
                  Instant Dispatch
                </span>
              </div>
              <p className="text-xs text-emerald-300 font-medium">
                Auto-generates clean, professional WhatsApp restock orders for low & out-of-stock items.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-900/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50/50 dark:bg-slate-900/50">
          {/* Supplier Phone Input */}
          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Supplier WhatsApp Phone Number (Optional)
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={supplierPhone}
                  onChange={(e) => setSupplierPhone(e.target.value)}
                  placeholder="e.g. +2348012345678 or leave empty to choose contact in WhatsApp"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Items to Restock List */}
          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                Items Needing Restock ({lowOrOutItems.length} Products)
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Est. Total: {settings.currencySymbol}
                {totalEstCost.toFixed(2)}
              </span>
            </div>

            {lowOrOutItems.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {lowOrOutItems.map((item) => {
                  const qty = customOrderQtys[item.id] || Math.max(1, item.reorderPoint * 2);
                  return (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2">
                          <span
                            className={`font-semibold ${
                              item.quantity === 0 ? "text-rose-500" : "text-amber-500"
                            }`}
                          >
                            Current: {item.quantity} {item.unit}
                          </span>
                          <span>• Cost: {settings.currencySymbol}{item.costPrice.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Order Quantity Stepper */}
                      <div className="flex items-center gap-1.5 shrink-0 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => handleQtyChange(item.id, -1)}
                          className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-black text-xs min-w-[32px] text-center text-slate-900 dark:text-white">
                          {qty} {item.unit}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQtyChange(item.id, 1)}
                          className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                All inventory items are currently well-stocked above reorder points!
              </div>
            )}
          </div>

          {/* Custom Delivery Note */}
          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Supplier Message Note
            </label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleCopyText}
              className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-300" />
                  <span>Copy Order Message</span>
                </>
              )}
            </button>

            <button
              onClick={handleOpenWhatsApp}
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Send via WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
