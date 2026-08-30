import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Minus,
  Edit2,
  Trash2,
  Barcode,
  Package,
  Layers,
  Tag,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowUpDown,
  Grid,
  List,
  DollarSign,
  PlusCircle,
  MapPin,
  CheckSquare,
  Square,
  Mail,
  Check,
  AlertTriangle,
  Boxes,
  Zap,
  Hand,
  MoveHorizontal,
} from "lucide-react";
import { InventoryItem, Category, StoreSettings } from "../types";
import { CATEGORIES } from "../data/sampleData";
import { SwipeableStockRow } from "./SwipeableStockRow";

interface QuickTallyViewProps {
  items: InventoryItem[];
  settings: StoreSettings;
  activeFilter: "all" | "low_stock" | "out_of_stock";
  setActiveFilter: (filter: "all" | "low_stock" | "out_of_stock") => void;
  onUpdateQuantity: (id: string, delta: number, note?: string) => void;
  onSetExactQuantity: (id: string, newQuantity: number, note?: string) => void;
  onAddItem: (item: Omit<InventoryItem, "id" | "lastCountedAt">) => void;
  onUpdateItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
  onDeleteBatchItems?: (ids: string[]) => void;
  onScanItemBarcode: (item: InventoryItem) => void;
  onOpenLowStockEmailAlert?: () => void;
  onQuickSellItem?: (item: InventoryItem) => void;
}

export const QuickTallyView: React.FC<QuickTallyViewProps> = ({
  items,
  settings,
  activeFilter,
  setActiveFilter,
  onUpdateQuantity,
  onSetExactQuantity,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onDeleteBatchItems,
  onScanItemBarcode,
  onOpenLowStockEmailAlert,
  onQuickSellItem,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"name" | "quantity_asc" | "quantity_desc" | "price">("quantity_asc");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Multi-select Batch state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isConfirmBatchDeleteOpen, setIsConfirmBatchDeleteOpen] = useState(false);

  // Quantity Flash animation tracker
  const [flashState, setFlashState] = useState<
    Record<string, { type: "up" | "down" | "set"; timestamp: number }>
  >({});

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Trigger quantity flash animation helper
  const handleQuantityWithFlash = (id: string, delta: number, note?: string) => {
    setFlashState((prev) => ({
      ...prev,
      [id]: { type: delta > 0 ? "up" : "down", timestamp: Date.now() },
    }));
    onUpdateQuantity(id, delta, note);

    setTimeout(() => {
      setFlashState((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 700);
  };

  const handleExactQuantityWithFlash = (id: string, newQuantity: number, note?: string) => {
    const currentItem = items.find((i) => i.id === id);
    const prevQty = currentItem ? currentItem.quantity : 0;
    const type = newQuantity > prevQty ? "up" : newQuantity < prevQty ? "down" : "set";

    setFlashState((prev) => ({
      ...prev,
      [id]: { type, timestamp: Date.now() },
    }));
    onSetExactQuantity(id, newQuantity, note);

    setTimeout(() => {
      setFlashState((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 700);
  };

  // Filter & Sort Logic
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        // Text Search
        const query = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !query ||
          item.name.toLowerCase().includes(query) ||
          (item.barcode && item.barcode.includes(query)) ||
          (item.sku && item.sku.toLowerCase().includes(query)) ||
          (item.location && item.location.toLowerCase().includes(query)) ||
          item.category.toLowerCase().includes(query);

        // Category Filter
        const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;

        // Stock Status Filter
        let matchesStatus = true;
        if (activeFilter === "low_stock") {
          matchesStatus = item.quantity <= item.reorderPoint && item.quantity > 0;
        } else if (activeFilter === "out_of_stock") {
          matchesStatus = item.quantity === 0;
        }

        return matchesQuery && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "quantity_asc") return a.quantity - b.quantity;
        if (sortBy === "quantity_desc") return b.quantity - a.quantity;
        if (sortBy === "price") return b.sellingPrice - a.sellingPrice;
        return 0;
      });
  }, [items, searchQuery, selectedCategory, activeFilter, sortBy]);

  // Selection helpers
  const areAllFilteredSelected =
    filteredItems.length > 0 && filteredItems.every((item) => selectedIds.includes(item.id));

  const toggleSelectAllFiltered = () => {
    if (areAllFilteredSelected) {
      const filteredIdSet = new Set(filteredItems.map((i) => i.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredIdSet.has(id)));
    } else {
      const allFilteredIds = filteredItems.map((i) => i.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const handleExecuteBatchDelete = () => {
    if (selectedIds.length === 0) return;
    if (onDeleteBatchItems) {
      onDeleteBatchItems(selectedIds);
    } else {
      selectedIds.forEach((id) => onDeleteItem(id));
    }
    setSelectedIds([]);
    setIsConfirmBatchDeleteOpen(false);
  };

  // Selected items summary calculations
  const selectedItemsList = useMemo(
    () => items.filter((i) => selectedIds.includes(i.id)),
    [items, selectedIds]
  );
  const selectedTotalValuation = useMemo(
    () => selectedItemsList.reduce((sum, i) => sum + i.quantity * i.sellingPrice, 0),
    [selectedItemsList]
  );

  return (
    <div className="space-y-4 pb-24 relative">
      {/* Search, Filter & View Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="tally-search-input"
              type="text"
              placeholder="Search by name, medicine, shoes, clothes, barcode, shelf..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 font-medium transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs bg-slate-200 dark:bg-slate-700 rounded-full w-4 h-4 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Select All Toggle Button */}
            <button
              id="tally-select-all-btn"
              onClick={toggleSelectAllFiltered}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-colors shrink-0 ${
                areAllFilteredSelected
                  ? "bg-yellow-400 text-slate-950 border-yellow-400"
                  : selectedIds.length > 0
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750"
              }`}
              title="Toggle Select All Filtered Items"
            >
              {areAllFilteredSelected ? (
                <CheckSquare className="w-4 h-4 text-slate-950" />
              ) : selectedIds.length > 0 ? (
                <div className="w-4 h-4 rounded bg-slate-800 dark:bg-yellow-400 text-white dark:text-slate-950 flex items-center justify-center text-[10px] font-black">
                  {selectedIds.length}
                </div>
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>
                {areAllFilteredSelected
                  ? "Selected All"
                  : selectedIds.length > 0
                  ? `Selected (${selectedIds.length})`
                  : "Select"}
              </span>
            </button>

            {/* Sort Dropdown */}
            <div className="relative flex-1 sm:flex-initial">
              <select
                id="tally-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full sm:w-auto pl-3 pr-8 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                <option value="quantity_asc">Lowest Stock First</option>
                <option value="quantity_desc">Highest Stock First</option>
                <option value="name">Alphabetical (A-Z)</option>
                <option value="price">Highest Selling Price</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg ${
                  viewMode === "list"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                }`}
                title="List View with Quick Swipe Gestures"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>

            {/* Add New Item Button */}
            <button
              id="tally-add-item-btn"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 dark:bg-yellow-400 text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-yellow-300 text-xs font-black rounded-xl transition-colors shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">Add Item</span>
            </button>
          </div>
        </div>

        {/* Category Pills Slider */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-medium border-t border-slate-100 dark:border-slate-800 pt-2.5">
          <button
            onClick={() => setSelectedCategory("All")}
            className={`px-3 py-1 rounded-full border transition-colors shrink-0 ${
              selectedCategory === "All"
                ? "bg-slate-900 dark:bg-yellow-400 text-white dark:text-slate-950 border-slate-900 dark:border-yellow-400 font-bold"
                : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            All Categories ({items.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = items.filter((i) => i.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full border transition-colors shrink-0 ${
                  selectedCategory === cat
                    ? "bg-slate-900 dark:bg-yellow-400 text-white dark:text-slate-950 border-slate-900 dark:border-yellow-400 font-bold"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Swipe Gesture Hint in List View */}
      {viewMode === "list" && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl text-[11px] text-slate-600 dark:text-slate-300 font-medium">
          <div className="flex items-center gap-1.5">
            <Hand className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />
            <span>
              <strong>Swipe Gestures:</strong> Swipe row <strong>Right 👉</strong> to add +1, swipe <strong>Left 👈</strong> to subtract -1.
            </span>
          </div>
          <span className="hidden sm:inline text-[10px] text-slate-500 dark:text-slate-400">
            Rapid stock counting without opening modals
          </span>
        </div>
      )}

      {/* Filter Status Bar if Active */}
      {activeFilter !== "all" && (
        <div className="flex items-center justify-between px-4 py-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-900 dark:text-amber-200 font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              Showing <strong>{activeFilter === "low_stock" ? "Low Stock Items" : "Out of Stock Items"}</strong> ({filteredItems.length} found)
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onOpenLowStockEmailAlert && (
              <button
                onClick={onOpenLowStockEmailAlert}
                className="text-amber-800 dark:text-amber-300 hover:text-amber-950 dark:hover:text-amber-100 font-bold flex items-center gap-1 bg-amber-100 dark:bg-amber-900/50 px-2 py-1 rounded-lg border border-amber-300 dark:border-amber-700"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Alert Summary</span>
              </button>
            )}
            <button
              onClick={() => setActiveFilter("all")}
              className="text-amber-700 dark:text-amber-300 hover:text-amber-900 font-bold underline"
            >
              Clear Filter
            </button>
          </div>
        </div>
      )}

      {/* Item List / Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">No Inventory Items Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? `No items matching "${searchQuery}" in ${selectedCategory}.`
              : "Your inventory list is empty. Add your first product to start counting!"}
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-400 text-slate-950 font-bold text-xs rounded-xl hover:bg-yellow-300 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Add New Item
          </button>
        </div>
      ) : viewMode === "list" ? (
        /* LIST VIEW WITH SWIPE GESTURES */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
          {filteredItems.map((item) => {
            const isOutOfStock = item.quantity === 0;
            const isLowStock = item.quantity <= item.reorderPoint && !isOutOfStock;
            const isSelected = selectedIds.includes(item.id);
            const currentFlash = flashState[item.id];

            return (
              <SwipeableStockRow
                key={item.id}
                item={item}
                settings={settings}
                isSelected={isSelected}
                isOutOfStock={isOutOfStock}
                isLowStock={isLowStock}
                currentFlash={currentFlash}
                onToggleSelect={() => toggleSelectItem(item.id)}
                onQuantityWithFlash={handleQuantityWithFlash}
                onExactQuantityWithFlash={handleExactQuantityWithFlash}
                onScanItemBarcode={onScanItemBarcode}
                onEditItem={(it) => setEditingItem(it)}
                onDeleteItem={onDeleteItem}
                onQuickSellItem={onQuickSellItem}
              />
            );
          })}
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredItems.map((item) => {
            const isOutOfStock = item.quantity === 0;
            const isLowStock = item.quantity <= item.reorderPoint && !isOutOfStock;
            const isSelected = selectedIds.includes(item.id);
            const currentFlash = flashState[item.id];

            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 shadow-xs flex flex-col justify-between gap-3 transition-all ${
                  isSelected
                    ? "border-yellow-400 dark:border-yellow-400 ring-2 ring-yellow-400/50 bg-yellow-50/50 dark:bg-yellow-950/30"
                    : isOutOfStock
                    ? "border-rose-300 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20"
                    : isLowStock
                    ? "border-amber-300 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/15"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                {/* Header Row: Checkbox, Name, Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleSelectItem(item.id)}
                      className={`p-1 rounded-md transition-all shrink-0 mt-0.5 ${
                        isSelected
                          ? "bg-yellow-400 text-slate-950 shadow-xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700"
                      }`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <div className="w-3.5 h-3.5" />}
                    </button>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                          {item.category}
                        </span>
                        {item.location && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            &bull; {item.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {isOutOfStock ? (
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 shrink-0">
                      Out of Stock
                    </span>
                  ) : isLowStock ? (
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 shrink-0">
                      Low Stock
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 shrink-0">
                      In Stock
                    </span>
                  )}
                </div>

                {/* Pricing & SKU */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    Price:{" "}
                    <strong className="text-slate-900 dark:text-white">
                      {settings.currencySymbol}
                      {item.sellingPrice.toFixed(2)}
                    </strong>
                  </div>
                  {item.sku && (
                    <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                      {item.sku}
                    </span>
                  )}
                </div>

                {/* Counter Cluster */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-300 dark:border-slate-700 flex-1 justify-between">
                    <button
                      onClick={() => handleQuantityWithFlash(item.id, -1)}
                      className="p-1.5 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg shadow-2xs hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <div className="text-center px-2">
                      <input
                        type="number"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          handleExactQuantityWithFlash(
                            item.id,
                            isNaN(val) ? 0 : Math.max(0, val)
                          );
                        }}
                        className={`w-12 text-center font-black text-sm py-0.5 rounded border transition-all ${
                          currentFlash?.type === "up"
                            ? "bg-emerald-200 text-emerald-950 border-emerald-500 ring-2 ring-emerald-500 scale-110"
                            : currentFlash?.type === "down"
                            ? "bg-rose-200 text-rose-950 border-rose-500 ring-2 ring-rose-500 scale-110"
                            : "bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700"
                        }`}
                      />
                      <span className="text-[10px] text-slate-400 block -mt-0.5">
                        {item.unit}
                      </span>
                    </div>

                    <button
                      onClick={() => handleQuantityWithFlash(item.id, 1)}
                      className="p-1.5 bg-yellow-400 text-slate-950 rounded-lg shadow-2xs hover:bg-yellow-300 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {item.quantity > 0 && onQuickSellItem && (
                      <button
                        type="button"
                        onClick={() => onQuickSellItem(item)}
                        className="px-2 py-1 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs rounded-lg shadow-xs transition-transform active:scale-95 flex items-center gap-1"
                        title={`Quick Sell 1 ${item.unit} of "${item.name}"`}
                      >
                        <Zap className="w-3 h-3 fill-slate-950" />
                        <span>Sell</span>
                      </button>
                    )}
                    <button
                      onClick={() => onScanItemBarcode(item)}
                      className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                      title="Barcode"
                    >
                      <Barcode className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingItem(item)}
                      className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Multi-Select Batch Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-950 dark:bg-slate-900 text-white rounded-2xl p-3 sm:px-5 sm:py-3.5 shadow-2xl border border-slate-700 dark:border-slate-700 flex items-center justify-between gap-4 max-w-lg w-[92%] sm:w-auto animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
              {selectedIds.length}
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm leading-tight text-white">
                {selectedIds.length} {selectedIds.length === 1 ? "Item" : "Items"} Selected
              </div>
              <div className="text-[10px] text-slate-400">
                Total Value:{" "}
                <strong className="text-yellow-400">
                  {settings.currencySymbol}
                  {selectedTotalValuation.toFixed(2)}
                </strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearSelection}
              className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => setIsConfirmBatchDeleteOpen(true)}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirm Batch Delete Modal */}
      {isConfirmBatchDeleteOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base">
                  Delete {selectedIds.length} Inventory {selectedIds.length === 1 ? "Item" : "Items"}?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <div className="max-h-40 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-xl p-2 bg-slate-50 dark:bg-slate-800/60 space-y-1 text-xs text-slate-700 dark:text-slate-300 font-medium">
              {selectedItemsList.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-1 border-b border-slate-200/60 dark:border-slate-700 last:border-0">
                  <span className="truncate max-w-[240px] font-semibold">{item.name}</span>
                  <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                    {item.quantity} {item.unit}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsConfirmBatchDeleteOpen(false)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteBatchDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-sm flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete {selectedIds.length} Items</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Item Modal */}
      {isAddModalOpen && (
        <ItemModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          settings={settings}
          onSave={(itemData) => {
            onAddItem(itemData);
            setIsAddModalOpen(false);
          }}
        />
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <ItemModal
          isOpen={!!editingItem}
          initialItem={editingItem}
          onClose={() => setEditingItem(null)}
          settings={settings}
          onSave={(itemData) => {
            onUpdateItem({ ...editingItem, ...itemData });
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
};

// Subcomponent: Item Add / Edit Modal
interface ItemModalProps {
  isOpen: boolean;
  initialItem?: InventoryItem;
  onClose: () => void;
  settings: StoreSettings;
  onSave: (itemData: Omit<InventoryItem, "id" | "lastCountedAt">) => void;
}

const ItemModal: React.FC<ItemModalProps> = ({
  initialItem,
  onClose,
  settings,
  onSave,
}) => {
  const [name, setName] = useState(initialItem?.name || "");
  const [category, setCategory] = useState<Category>(initialItem?.category || "Medicine & Healthcare");
  const [quantity, setQuantity] = useState<number>(initialItem?.quantity ?? 10);
  const [unit, setUnit] = useState<InventoryItem["unit"]>(initialItem?.unit || "pcs");
  const [reorderPoint, setReorderPoint] = useState<number>(initialItem?.reorderPoint ?? 5);
  const [costPrice, setCostPrice] = useState<number>(initialItem?.costPrice ?? 1.0);
  const [sellingPrice, setSellingPrice] = useState<number>(initialItem?.sellingPrice ?? 2.0);
  const [barcode, setBarcode] = useState(initialItem?.barcode || "");
  const [sku, setSku] = useState(initialItem?.sku || "");
  const [location, setLocation] = useState(initialItem?.location || "");
  const [notes, setNotes] = useState(initialItem?.notes || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      category,
      quantity,
      unit,
      reorderPoint,
      costPrice,
      sellingPrice,
      barcode: barcode.trim(),
      sku: sku.trim(),
      location: location.trim(),
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">
            {initialItem ? "Edit Inventory Item" : "Add New Item"}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold p-1 text-lg"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
          {/* Name */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Product Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Paracetamol 500mg, Running Sneakers, Cotton T-Shirt"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-yellow-400 text-sm font-semibold text-slate-900 dark:text-white"
            />
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-yellow-400 text-slate-900 dark:text-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Unit of Measure</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as any)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-yellow-400 text-slate-900 dark:text-white"
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="pair">Pair (Shoes/Socks)</option>
                <option value="pack">Pack</option>
                <option value="bottle">Bottle</option>
                <option value="can">Can</option>
                <option value="box">Box</option>
                <option value="strip">Strip (Pills)</option>
                <option value="set">Set / Kit</option>
                <option value="carton">Carton</option>
                <option value="crate">Crate</option>
                <option value="bag">Bag</option>
                <option value="sachet">Sachet</option>
                <option value="loaf">Loaf</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="roll">Roll</option>
              </select>
            </div>
          </div>

          {/* Stock & Reorder Threshold */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1">Current Stock Count</label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-black text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1">Reorder Alert Point</label>
              <input
                type="number"
                min="0"
                value={reorderPoint}
                onChange={(e) => setReorderPoint(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-sm text-amber-800 dark:text-amber-300"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">Triggers restock alert when at/below this.</span>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Cost Price ({settings.currencySymbol})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Selling Price ({settings.currencySymbol})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Barcode, SKU, Location */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Barcode / EAN</label>
              <input
                type="text"
                placeholder="13-digit barcode"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">SKU / Code</label>
              <input
                type="text"
                placeholder="e.g. MED-PARA"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Shelf Location</label>
              <input
                type="text"
                placeholder="e.g. Rack 1"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Notes / Supplier info</label>
            <input
              type="text"
              placeholder="e.g. Supplied by MedWholesale Ltd"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-yellow-400 text-slate-950 font-black rounded-xl hover:bg-yellow-300 shadow-sm"
            >
              {initialItem ? "Save Changes" : "Create Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
