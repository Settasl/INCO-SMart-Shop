import React, { useState } from "react";
import { PackagePlus, Plus, Minus, Search, Check, X } from "lucide-react";
import { InventoryItem, StoreSettings } from "../types";

interface QuickRestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  settings: StoreSettings;
  onCompleteRestock: (deliveries: Array<{ item: InventoryItem; addQuantity: number; newCostPrice?: number }>) => void;
}

export const QuickRestockModal: React.FC<QuickRestockModalProps> = ({
  isOpen,
  onClose,
  items,
  settings,
  onCompleteRestock,
}) => {
  const [search, setSearch] = useState("");
  const [restockMap, setRestockMap] = useState<Record<string, { qty: number; cost?: number }>>({});

  if (!isOpen) return null;

  const filteredItems = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.barcode && i.barcode.includes(search)) ||
      (i.sku && i.sku.toLowerCase().includes(search))
  );

  const handleUpdateRestock = (itemId: string, addQty: number, cost?: number) => {
    setRestockMap((prev) => {
      const current = prev[itemId] || { qty: 0 };
      const newQty = Math.max(0, current.qty + addQty);
      if (newQty === 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return {
        ...prev,
        [itemId]: {
          qty: newQty,
          cost: cost !== undefined ? cost : current.cost,
        },
      };
    });
  };

  const selectedCount = Object.keys(restockMap).length;

  const handleSubmit = () => {
    if (selectedCount === 0) return;
    const deliveries = Object.entries(restockMap).map(([itemId, val]) => {
      const { qty, cost } = val as { qty: number; cost?: number };
      const item = items.find((i) => i.id === itemId)!;
      return {
        item,
        addQuantity: qty,
        newCostPrice: cost,
      };
    });

    onCompleteRestock(deliveries);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-blue-100 rounded-xl text-blue-900 font-bold">
              <PackagePlus className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Record Restock / Delivery (Stock In)</h3>
              <p className="text-xs text-slate-500">
                Receive wholesale goods & update stock quantities
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search items received from supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 mb-4">
          {filteredItems.map((item) => {
            const restockData = restockMap[item.id] || { qty: 0 };

            return (
              <div
                key={item.id}
                className={`p-3 flex items-center justify-between gap-3 ${
                  restockData.qty > 0 ? "bg-blue-50/50" : "hover:bg-slate-50"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs text-slate-900">{item.name}</div>
                  <div className="text-[10px] text-slate-500">
                    Current Stock: {item.quantity} {item.unit} | Cost: {settings.currencySymbol}{item.costPrice.toFixed(2)}
                  </div>
                </div>

                {/* Restock Quantity Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center bg-white border border-slate-300 rounded-lg p-0.5">
                    <button
                      onClick={() => handleUpdateRestock(item.id, -1)}
                      className="p-1 text-slate-600 hover:bg-slate-100 font-bold"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <input
                      type="number"
                      min="0"
                      value={restockData.qty}
                      onChange={(e) =>
                        handleUpdateRestock(item.id, parseInt(e.target.value, 10) - restockData.qty)
                      }
                      className="w-12 text-center font-black text-xs border-0 py-0.5 focus:ring-0 text-slate-900"
                    />

                    <button
                      onClick={() => handleUpdateRestock(item.id, 1)}
                      className="p-1 text-slate-600 hover:bg-slate-100 font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quick Preset Buttons (+12, +24) */}
                  <button
                    onClick={() => handleUpdateRestock(item.id, 12)}
                    className="px-2 py-1 text-[11px] font-bold bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-lg"
                  >
                    +12
                  </button>
                  <button
                    onClick={() => handleUpdateRestock(item.id, 24)}
                    className="px-2 py-1 text-[11px] font-bold bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-lg"
                  >
                    +24
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="text-xs font-bold text-slate-700">
            Items to restock: <span className="text-blue-700">{selectedCount}</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              disabled={selectedCount === 0}
              onClick={handleSubmit}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-md transition-colors disabled:opacity-50"
            >
              Save Restock ({selectedCount} items)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
