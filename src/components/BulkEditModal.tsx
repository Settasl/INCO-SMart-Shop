import React, { useState } from "react";
import {
  X,
  Sliders,
  FolderPlus,
  MapPin,
  DollarSign,
  TrendingUp,
  Package,
  Layers,
  AlertTriangle,
  Check,
  CheckCircle2,
  RefreshCw,
  Boxes,
} from "lucide-react";
import { InventoryItem, Category, StoreSettings } from "../types";
import { CATEGORIES } from "../data/sampleData";
import { sounds } from "../lib/sound";

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: InventoryItem[];
  settings: StoreSettings;
  onApplyBulkChanges: (updates: Array<{ id: string; changes: Partial<InventoryItem> }>) => void;
}

export const BulkEditModal: React.FC<BulkEditModalProps> = ({
  isOpen,
  onClose,
  selectedItems,
  settings,
  onApplyBulkChanges,
}) => {
  // Category Action
  const [categoryMode, setCategoryMode] = useState<"keep" | "change">("keep");
  const [newCategory, setNewCategory] = useState<Category>("Beverages");

  // Location Action
  const [locationMode, setLocationMode] = useState<"keep" | "change">("keep");
  const [newLocation, setNewLocation] = useState<string>("");

  // Selling Price Action
  const [sellingPriceMode, setSellingPriceMode] = useState<
    "keep" | "fixed" | "increase_pct" | "decrease_pct" | "add_amount" | "sub_amount"
  >("keep");
  const [sellingPriceValue, setSellingPriceValue] = useState<number>(0);

  // Cost Price Action
  const [costPriceMode, setCostPriceMode] = useState<
    "keep" | "fixed" | "increase_pct" | "decrease_pct" | "add_amount" | "sub_amount"
  >("keep");
  const [costPriceValue, setCostPriceValue] = useState<number>(0);

  // Stock Quantity Action
  const [stockMode, setStockMode] = useState<"keep" | "add" | "subtract" | "set_exact">("keep");
  const [stockValue, setStockValue] = useState<number>(0);

  // Reorder Point
  const [reorderMode, setReorderMode] = useState<"keep" | "set">("keep");
  const [reorderValue, setReorderValue] = useState<number>(5);

  // Unit Action
  const [unitMode, setUnitMode] = useState<"keep" | "change">("keep");
  const [newUnit, setNewUnit] = useState<string>("pcs");

  if (!isOpen) return null;

  // Calculate changes for each item
  const calculateItemUpdates = () => {
    return selectedItems.map((item) => {
      const changes: Partial<InventoryItem> = {};

      // 1. Category
      if (categoryMode === "change" && newCategory) {
        changes.category = newCategory;
      }

      // 2. Location
      if (locationMode === "change") {
        changes.location = newLocation.trim();
      }

      // 3. Selling Price
      if (sellingPriceMode === "fixed") {
        changes.sellingPrice = Math.max(0, sellingPriceValue);
      } else if (sellingPriceMode === "increase_pct") {
        const factor = 1 + (sellingPriceValue / 100);
        changes.sellingPrice = Math.max(0, Number((item.sellingPrice * factor).toFixed(2)));
      } else if (sellingPriceMode === "decrease_pct") {
        const factor = Math.max(0, 1 - (sellingPriceValue / 100));
        changes.sellingPrice = Math.max(0, Number((item.sellingPrice * factor).toFixed(2)));
      } else if (sellingPriceMode === "add_amount") {
        changes.sellingPrice = Math.max(0, Number((item.sellingPrice + sellingPriceValue).toFixed(2)));
      } else if (sellingPriceMode === "sub_amount") {
        changes.sellingPrice = Math.max(0, Number((item.sellingPrice - sellingPriceValue).toFixed(2)));
      }

      // 4. Cost Price
      if (costPriceMode === "fixed") {
        changes.costPrice = Math.max(0, costPriceValue);
      } else if (costPriceMode === "increase_pct") {
        const factor = 1 + (costPriceValue / 100);
        changes.costPrice = Math.max(0, Number((item.costPrice * factor).toFixed(2)));
      } else if (costPriceMode === "decrease_pct") {
        const factor = Math.max(0, 1 - (costPriceValue / 100));
        changes.costPrice = Math.max(0, Number((item.costPrice * factor).toFixed(2)));
      } else if (costPriceMode === "add_amount") {
        changes.costPrice = Math.max(0, Number((item.costPrice + costPriceValue).toFixed(2)));
      } else if (costPriceMode === "sub_amount") {
        changes.costPrice = Math.max(0, Number((item.costPrice - costPriceValue).toFixed(2)));
      }

      // 5. Stock Quantity
      if (stockMode === "set_exact") {
        changes.quantity = Math.max(0, Math.round(stockValue));
      } else if (stockMode === "add") {
        changes.quantity = Math.max(0, item.quantity + Math.round(stockValue));
      } else if (stockMode === "subtract") {
        changes.quantity = Math.max(0, item.quantity - Math.round(stockValue));
      }

      // 6. Reorder Point
      if (reorderMode === "set") {
        changes.reorderPoint = Math.max(0, Math.round(reorderValue));
      }

      // 7. Unit
      if (unitMode === "change" && newUnit) {
        changes.unit = newUnit.trim();
      }

      return { id: item.id, changes };
    });
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const updates = calculateItemUpdates();
    // Filter out items that have no actual changes
    const actualUpdates = updates.filter((u) => Object.keys(u.changes).length > 0);

    if (actualUpdates.length === 0) {
      onClose();
      return;
    }

    sounds.playStockAdd();
    sounds.triggerHaptic(20);
    onApplyBulkChanges(actualUpdates);
    onClose();
  };

  const hasAnyChanges =
    categoryMode !== "keep" ||
    locationMode !== "keep" ||
    sellingPriceMode !== "keep" ||
    costPriceMode !== "keep" ||
    stockMode !== "keep" ||
    reorderMode !== "keep" ||
    unitMode !== "keep";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-edit-title"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 id="bulk-edit-title" className="text-base sm:text-lg font-black text-white leading-tight">
                Bulk Edit {selectedItems.length} {selectedItems.length === 1 ? "Item" : "Items"}
              </h2>
              <p className="text-xs text-slate-400">
                Apply synchronized updates to categories, prices, storage, or stock counts.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Items Summary Pill Scroller */}
        <div className="bg-slate-100 dark:bg-slate-850 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
          <span className="font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
            Target Items:
          </span>
          <div className="flex items-center gap-1.5 flex-nowrap">
            {selectedItems.map((item) => (
              <span
                key={item.id}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold whitespace-nowrap text-micro flex items-center gap-1 shadow-2xs"
              >
                <span>{item.name}</span>
                <span className="text-slate-400 text-nano">({item.quantity})</span>
              </span>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleApply} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Section 1: Category & Storage */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <FolderPlus className="w-3.5 h-3.5 text-amber-500" />
              <span>Category & Storage Location</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Product Category
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={categoryMode === "keep" ? "KEEP" : newCategory}
                    onChange={(e) => {
                      if (e.target.value === "KEEP") {
                        setCategoryMode("keep");
                      } else {
                        setCategoryMode("change");
                        setNewCategory(e.target.value as Category);
                      }
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-400"
                  >
                    <option value="KEEP">— Keep Existing Categories —</option>
                    {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                      <option key={cat} value={cat}>
                        Change to: {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Aisle / Shelf Location
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={locationMode}
                    onChange={(e) => setLocationMode(e.target.value as any)}
                    className="w-1/2 px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-400"
                  >
                    <option value="keep">Keep Location</option>
                    <option value="change">Set Location</option>
                  </select>
                  {locationMode === "change" && (
                    <input
                      type="text"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      placeholder="e.g. Shelf A-2"
                      className="w-1/2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-400"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Pricing Adjustments */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              <span>Pricing Adjustments</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Selling Price */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Selling Price
                </label>
                <select
                  value={sellingPriceMode}
                  onChange={(e) => setSellingPriceMode(e.target.value as any)}
                  className="w-full mb-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-400"
                >
                  <option value="keep">Keep Current Selling Prices</option>
                  <option value="fixed">Set Fixed Price ({settings.currencySymbol})</option>
                  <option value="increase_pct">Increase by % (Markup)</option>
                  <option value="decrease_pct">Decrease by % (Discount)</option>
                  <option value="add_amount">Add Fixed Amount (+{settings.currencySymbol})</option>
                  <option value="sub_amount">Subtract Amount (-{settings.currencySymbol})</option>
                </select>

                {sellingPriceMode !== "keep" && (
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={sellingPriceValue || ""}
                      onChange={(e) => setSellingPriceValue(parseFloat(e.target.value) || 0)}
                      placeholder={
                        sellingPriceMode.includes("pct")
                          ? "e.g. 10 (for 10%)"
                          : `e.g. 15.00 ${settings.currencySymbol}`
                      }
                      required
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-400"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">
                      {sellingPriceMode.includes("pct") ? "%" : settings.currencySymbol}
                    </span>
                  </div>
                )}
              </div>

              {/* Cost Price */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cost Price
                </label>
                <select
                  value={costPriceMode}
                  onChange={(e) => setCostPriceMode(e.target.value as any)}
                  className="w-full mb-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-400"
                >
                  <option value="keep">Keep Current Cost Prices</option>
                  <option value="fixed">Set Fixed Cost ({settings.currencySymbol})</option>
                  <option value="increase_pct">Increase Cost by %</option>
                  <option value="decrease_pct">Decrease Cost by %</option>
                  <option value="add_amount">Add Fixed Amount (+{settings.currencySymbol})</option>
                  <option value="sub_amount">Subtract Amount (-{settings.currencySymbol})</option>
                </select>

                {costPriceMode !== "keep" && (
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={costPriceValue || ""}
                      onChange={(e) => setCostPriceValue(parseFloat(e.target.value) || 0)}
                      placeholder={
                        costPriceMode.includes("pct")
                          ? "e.g. 5 (for 5%)"
                          : `e.g. 10.00 ${settings.currencySymbol}`
                      }
                      required
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-400"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">
                      {costPriceMode.includes("pct") ? "%" : settings.currencySymbol}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Stock Quantity & Inventory Level */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-blue-500" />
              <span>Stock Quantities & Reorder Thresholds</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Stock Quantity */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Stock Quantity (Restock / Adjust)
                </label>
                <select
                  value={stockMode}
                  onChange={(e) => setStockMode(e.target.value as any)}
                  className="w-full mb-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-400"
                >
                  <option value="keep">Keep Current Stock Quantities</option>
                  <option value="add">Bulk Restock: Add (+N) to each</option>
                  <option value="subtract">Bulk Deduct: Subtract (-N) from each</option>
                  <option value="set_exact">Set Exact Count (N units)</option>
                </select>

                {stockMode !== "keep" && (
                  <input
                    type="number"
                    min="0"
                    value={stockValue || ""}
                    onChange={(e) => setStockValue(parseInt(e.target.value, 10) || 0)}
                    placeholder="Enter quantity amount (e.g. 10)"
                    required
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-400"
                  />
                )}
              </div>

              {/* Reorder Point */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Low Stock Alert Level (Reorder Point)
                </label>
                <select
                  value={reorderMode}
                  onChange={(e) => setReorderMode(e.target.value as any)}
                  className="w-full mb-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-400"
                >
                  <option value="keep">Keep Reorder Thresholds</option>
                  <option value="set">Set Alert Threshold for All</option>
                </select>

                {reorderMode === "set" && (
                  <input
                    type="number"
                    min="0"
                    value={reorderValue}
                    onChange={(e) => setReorderValue(parseInt(e.target.value, 10) || 0)}
                    placeholder="e.g. 5"
                    required
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-400"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Unit of Measure */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-500" />
              <span>Unit of Measure</span>
            </h3>

            <div className="flex items-center gap-2">
              <select
                value={unitMode}
                onChange={(e) => setUnitMode(e.target.value as any)}
                className="w-1/2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-400"
              >
                <option value="keep">Keep Current Units</option>
                <option value="change">Change Unit to Standard</option>
              </select>

              {unitMode === "change" && (
                <select
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  className="w-1/2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-400"
                >
                  <option value="pcs">pcs (pieces)</option>
                  <option value="carton">carton</option>
                  <option value="box">box</option>
                  <option value="pack">pack</option>
                  <option value="bottle">bottle</option>
                  <option value="can">can</option>
                  <option value="sachet">sachet</option>
                  <option value="bag">bag</option>
                  <option value="kg">kg</option>
                  <option value="liter">liter</option>
                </select>
              )}
            </div>
          </div>

          {/* Actions Bar */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!hasAnyChanges}
              className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Apply Changes to {selectedItems.length} Items</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
