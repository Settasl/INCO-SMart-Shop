import React, { useState, useMemo } from "react";
import {
  Zap,
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Check,
  ScanLine,
} from "lucide-react";
import { InventoryItem, StoreSettings } from "../types";
import { SalePaymentDetails } from "./QuickSaleModal";
import { sounds } from "../lib/sound";

interface InlineQuickSaleBarProps {
  items: InventoryItem[];
  settings: StoreSettings;
  onCompleteSale: (
    cart: Array<{ item: InventoryItem; quantity: number }>,
    totalAmount: number,
    paymentDetails?: SalePaymentDetails
  ) => void;
  onShowToast: (message: string, type?: "success" | "info") => void;
  onOpenFullPOSModal: () => void;
  onOpenScanner?: () => void;
}

export const InlineQuickSaleBar: React.FC<InlineQuickSaleBarProps> = ({
  items,
  settings,
  onCompleteSale,
  onShowToast,
  onOpenFullPOSModal,
  onOpenScanner,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // Available items in stock
  const inStockItems = useMemo(
    () => items.filter((i) => i.quantity > 0),
    [items]
  );

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return inStockItems.slice(0, 8);
    const q = searchQuery.toLowerCase().trim();
    return inStockItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.barcode && item.barcode.includes(q)) ||
        (item.sku && item.sku.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q)
    );
  }, [inStockItems, searchQuery]);

  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedItemId),
    [items, selectedItemId]
  );

  const lineTotal = selectedItem ? selectedItem.sellingPrice * quantity : 0;

  const handleSelectItem = (item: InventoryItem) => {
    sounds.playClick();
    sounds.triggerHaptic(10);
    setSelectedItemId(item.id);
    setSearchQuery(item.name);
    setIsDropdownOpen(false);
    if (quantity > item.quantity) {
      setQuantity(Math.max(1, item.quantity));
    }
  };

  const handleExecuteQuickSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) {
      sounds.playBeep();
      onShowToast("Please select an item to sell", "info");
      return;
    }

    if (quantity <= 0) {
      sounds.playBeep();
      onShowToast("Sale quantity must be at least 1", "info");
      return;
    }

    if (quantity > selectedItem.quantity) {
      sounds.playBeep();
      onShowToast(
        `Only ${selectedItem.quantity} ${selectedItem.unit} in stock!`,
        "info"
      );
      return;
    }

    sounds.playSuccess();
    sounds.triggerHaptic(25);

    onCompleteSale(
      [{ item: selectedItem, quantity }],
      lineTotal,
      {
        paymentStatus: "paid",
        customerName: "Walk-in Cash Customer",
        amountPaid: lineTotal,
        amountOutstanding: 0,
        notes: "Instant Quick Sale Bar (Cash)",
      }
    );

    // Reset bar
    setSelectedItemId("");
    setSearchQuery("");
    setQuantity(1);
    setIsDropdownOpen(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm transition-all">
      {/* Header Row */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-150 dark:border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-xs">
            <Zap className="w-4 h-4 fill-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-black text-slate-950 dark:text-white">
                Instant Quick Sale Bar
              </span>
              <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                LIVE STOCK DEDUCTION
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
              Select product, choose Paid Cash, and tap Sell for instant tally.
            </p>
          </div>
        </div>

        {/* Multi-Item POS Modal Action */}
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            onOpenFullPOSModal();
          }}
          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <ShoppingCart className="w-3.5 h-3.5 text-amber-500" />
          <span>Multi-Item POS</span>
        </button>
      </div>

      {/* Interactive Controls Row */}
      <form onSubmit={handleExecuteQuickSale} className="pt-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        {/* 1. SELECT PRODUCT OR SCAN BARCODE */}
        <div className="md:col-span-5 relative">
          <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-700 dark:text-slate-300 mb-1">
            Select Product or Scan Barcode
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder="Search name, barcode, or SKU..."
              className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-hidden focus:border-amber-400 focus:bg-white dark:focus:bg-slate-850 transition-all"
            />
            {onOpenScanner && (
              <button
                type="button"
                onClick={onOpenScanner}
                className="absolute right-2.5 top-2 text-slate-500 dark:text-slate-400 hover:text-amber-500 cursor-pointer"
                title="Scan Barcode"
              >
                <ScanLine className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl shadow-xl z-30 max-h-48 overflow-y-auto p-1 text-left">
              {filteredItems.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                  No matching in-stock products found
                </div>
              ) : (
                filteredItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectItem(item)}
                    className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                      selectedItemId === item.id
                        ? "bg-amber-50 dark:bg-amber-950/60 text-amber-950 dark:text-amber-300 font-black border border-amber-300 dark:border-amber-700"
                        : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {item.category} • {item.quantity} {item.unit} in stock
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-slate-950 dark:text-amber-400 text-xs">
                        {settings.currencySymbol}
                        {item.sellingPrice.toFixed(2)}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* 2. QUANTITY STEPPER */}
        <div className="md:col-span-2">
          <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-700 dark:text-slate-300 mb-1">
            Quantity
          </label>
          <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setQuantity((prev) => Math.max(1, prev - 1));
              }}
              className="p-1.5 text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer font-bold"
            >
              <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
            <input
              type="number"
              min={1}
              max={selectedItem?.quantity || 9999}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full text-center text-xs font-black bg-transparent border-none focus:outline-hidden text-slate-950 dark:text-white font-mono"
            />
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                if (selectedItem && quantity >= selectedItem.quantity) {
                  onShowToast(`Max ${selectedItem.quantity} in stock!`, "info");
                  return;
                }
                setQuantity((prev) => prev + 1);
              }}
              className="p-1.5 text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer font-bold"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* 3. PAYMENT TYPE */}
        <div className="md:col-span-2">
          <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-700 dark:text-slate-300 mb-1">
            Payment Type
          </label>
          <div className="flex items-center justify-center px-3 py-2 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 rounded-xl text-emerald-900 dark:text-emerald-300 font-black text-xs gap-1.5 shadow-xs">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>Paid Cash</span>
          </div>
        </div>

        {/* 4. SELL ACTION BUTTON */}
        <div className="md:col-span-3">
          <button
            type="submit"
            disabled={!selectedItem || selectedItem.quantity <= 0}
            className="w-full py-2 px-4 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Zap className="w-3.5 h-3.5 fill-slate-950" />
            <span>
              SELL {settings.currencySymbol}
              {lineTotal.toFixed(2)}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
