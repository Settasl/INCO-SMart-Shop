import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  Edit2,
  Trash2,
} from "lucide-react";
import { InventoryItem, StoreSettings } from "../types";
import { sounds } from "../lib/sound";

interface ProductsViewProps {
  items: InventoryItem[];
  settings: StoreSettings;
  onAddItem: (item: Partial<InventoryItem>) => void;
  onUpdateItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
  onUpdateQuantity: (id: string, delta: number, note?: string) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  items,
  settings,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onUpdateQuantity,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New item form state
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Electronics");
  const [newPrice, setNewPrice] = useState("");
  const [newCost, setNewCost] = useState("");
  const [newStock, setNewStock] = useState("");

  const categories = useMemo(() => {
    const set = new Set<string>(["All"]);
    items.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set);
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchCat =
        selectedCategory === "All" ||
        item.category.toLowerCase().includes(selectedCategory.toLowerCase());
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    sounds.playStockAdd();
    onAddItem({
      name: newName.trim(),
      category: newCategory,
      sellingPrice: parseFloat(newPrice) || 0,
      costPrice: parseFloat(newCost) || 0,
      quantity: parseInt(newStock) || 0,
      unit: "pcs",
      reorderPoint: 5,
    });

    setIsAddModalOpen(false);
    setNewName("");
    setNewPrice("");
    setNewCost("");
    setNewStock("");
  };

  const getItemImage = (item: InventoryItem) => {
    if (item.notes && item.notes.startsWith("http")) return item.notes;
    // Default electronics or item thumbnail
    return "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=160&auto=format&fit=crop&q=80";
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#252525] dark:text-white tracking-tight">Products Catalog</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Total items: {items.length} in active catalog</p>
        </div>

        <div className="flex items-center gap-2.5 flex-1 sm:max-w-lg justify-end">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 rounded-xl text-xs sm:text-sm font-semibold text-[#252525] dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#252525] dark:focus:border-[#E5F107] transition-colors shadow-xs"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-[#252525] dark:text-slate-200 focus:outline-hidden focus:border-[#252525] dark:focus:border-[#E5F107] cursor-pointer shadow-xs"
          >
            {categories.map((c) => (
              <option key={c} value={c} className="bg-white dark:bg-[#252525] text-[#252525] dark:text-white">
                {c}
              </option>
            ))}
          </select>

          {/* Yellow + Add Product Button matching the brand */}
          <button
            onClick={() => {
              sounds.playClick();
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 bg-[#E5F107] hover:bg-[#d2dc00] text-[#252525] font-black text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Products Table Card */}
      <div className="rounded-2xl bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Stock</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/10 font-medium text-slate-700 dark:text-slate-300">
              {filteredItems.map((item) => {
                const isOutOfStock = item.quantity === 0;
                const isLowStock = !isOutOfStock && item.quantity <= (item.reorderPoint || 5);
                const statusLabel = isOutOfStock
                  ? "Out of Stock"
                  : isLowStock
                  ? "Low Stock"
                  : "In Stock";

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
                    {/* Product */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={getItemImage(item)}
                          alt={item.name}
                          className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="font-bold text-[#252525] dark:text-white text-xs sm:text-sm">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {item.sku || item.barcode || "SKU-AUTO"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                      {item.category}
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4 font-black text-[#252525] dark:text-white">
                      ${item.sellingPrice.toFixed(2)}
                    </td>

                    {/* Stock */}
                    <td className="py-3 px-4 font-bold text-[#252525] dark:text-white">
                      {item.quantity} {item.unit || "pcs"}
                    </td>

                    {/* Status Pill */}
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full inline-block ${
                          isOutOfStock
                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                            : isLowStock
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-[#E5F107] text-[#252525] border border-black/10"
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            sounds.playStockAdd();
                            onUpdateQuantity(item.id, 1, "Quick restock");
                          }}
                          className="px-2 py-1 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 text-[#252525] dark:text-white rounded text-xs font-bold cursor-pointer"
                          title="Add 1 to stock"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => {
                            sounds.playStockRemove();
                            onUpdateQuantity(item.id, -1, "Quick count reduction");
                          }}
                          className="px-2 py-1 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 text-[#252525] dark:text-white rounded text-xs font-bold cursor-pointer"
                          title="Reduce 1 from stock"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => {
                            sounds.playClick();
                            onDeleteItem(item.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Delete item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#252525]/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#1E1E1E] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-[#252525] dark:text-white">Add New Product</h3>

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Product Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Wireless Headset Pro"
                  className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-[#252525] dark:text-white focus:outline-hidden focus:border-[#252525] dark:focus:border-[#E5F107]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Category</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Electronics"
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-[#252525] dark:text-white focus:outline-hidden focus:border-[#252525] dark:focus:border-[#E5F107]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Initial Stock</label>
                  <input
                    type="number"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    placeholder="25"
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-[#252525] dark:text-white focus:outline-hidden focus:border-[#252525] dark:focus:border-[#E5F107]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Selling Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="240.00"
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-[#252525] dark:text-white focus:outline-hidden focus:border-[#252525] dark:focus:border-[#E5F107]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Cost Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                    placeholder="140.00"
                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-[#252525] dark:text-white focus:outline-hidden focus:border-[#252525] dark:focus:border-[#E5F107]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#E5F107] hover:bg-[#d2dc00] text-[#252525] font-black text-xs cursor-pointer shadow-xs"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
