import React, { useState } from "react";
import { ClipboardCheck, AlertTriangle, CheckCircle2, TrendingDown, TrendingUp, Save, RefreshCw, X } from "lucide-react";
import { InventoryItem, StoreSettings } from "../types";

interface AuditModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  settings: StoreSettings;
  onApplyAudit: (counts: Record<string, number>, auditTitle: string) => void;
}

export const AuditModeModal: React.FC<AuditModeModalProps> = ({
  isOpen,
  onClose,
  items,
  settings,
  onApplyAudit,
}) => {
  const [auditTitle, setAuditTitle] = useState("Stock Audit " + new Date().toLocaleDateString());
  // counts state holds itemId -> counted quantity
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    items.forEach((item) => {
      initial[item.id] = item.quantity;
    });
    return initial;
  });

  const [filter, setFilter] = useState<"all" | "discrepancy_only">("all");

  if (!isOpen) return null;

  // Calculate variances
  let totalDiscrepanciesCount = 0;
  let totalVarianceUnits = 0;
  let totalVarianceCostValue = 0;

  items.forEach((item) => {
    const counted = counts[item.id] ?? item.quantity;
    const diff = counted - item.quantity;
    if (diff !== 0) {
      totalDiscrepanciesCount++;
      totalVarianceUnits += diff;
      totalVarianceCostValue += diff * item.costPrice;
    }
  });

  const handleSetCount = (itemId: string, val: number) => {
    setCounts((prev) => ({
      ...prev,
      [itemId]: Math.max(0, val),
    }));
  };

  const handleApply = () => {
    if (confirm(`Apply physical audit counts? This will update system inventory levels for ${totalDiscrepanciesCount} items.`)) {
      onApplyAudit(counts, auditTitle);
      onClose();
    }
  };

  const displayedItems = items.filter((item) => {
    if (filter === "discrepancy_only") {
      const counted = counts[item.id] ?? item.quantity;
      return counted !== item.quantity;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-yellow-400 text-slate-950 font-black rounded-xl">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Physical Stock Take / Audit</h3>
              <p className="text-xs text-slate-500">
                Count physical shelf stock & reconcile system variance
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audit Title & Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <label className="block text-[10px] font-bold uppercase text-slate-500">Audit Session Name</label>
            <input
              type="text"
              value={auditTitle}
              onChange={(e) => setAuditTitle(e.target.value)}
              className="w-full mt-1 bg-white px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
            />
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-500">Items with Variance</div>
              <div className="text-lg font-black text-amber-700">{totalDiscrepanciesCount} SKUs</div>
            </div>
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-500">Cost Value Difference</div>
              <div
                className={`text-lg font-black ${
                  totalVarianceCostValue < 0 ? "text-rose-600" : totalVarianceCostValue > 0 ? "text-emerald-600" : "text-slate-800"
                }`}
              >
                {totalVarianceCostValue > 0 ? "+" : ""}
                {settings.currencySymbol}
                {totalVarianceCostValue.toFixed(2)}
              </div>
            </div>
            {totalVarianceCostValue < 0 ? (
              <TrendingDown className="w-6 h-6 text-rose-500" />
            ) : (
              <TrendingUp className="w-6 h-6 text-emerald-500" />
            )}
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center justify-between mb-2 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-lg border ${
                filter === "all" ? "bg-slate-900 text-white border-slate-900" : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              All Items ({items.length})
            </button>
            <button
              onClick={() => setFilter("discrepancy_only")}
              className={`px-3 py-1 rounded-lg border ${
                filter === "discrepancy_only" ? "bg-amber-600 text-white border-amber-600" : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              Discrepancies Only ({totalDiscrepanciesCount})
            </button>
          </div>
        </div>

        {/* Items Table */}
        <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 sticky top-0 font-bold text-slate-700 border-b border-slate-200">
              <tr>
                <th className="p-3">Item Name</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-center">System Stock</th>
                <th className="p-3 text-center">Physical Count</th>
                <th className="p-3 text-center">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedItems.map((item) => {
                const counted = counts[item.id] ?? item.quantity;
                const diff = counted - item.quantity;

                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{item.name}</td>
                    <td className="p-3 text-slate-500">{item.category}</td>
                    <td className="p-3 text-center font-bold text-slate-600">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="number"
                        min="0"
                        value={counted}
                        onChange={(e) => handleSetCount(item.id, parseInt(e.target.value, 10) || 0)}
                        className={`w-20 text-center font-black py-1 px-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 ${
                          diff !== 0 ? "bg-amber-50 border-amber-400 text-amber-900" : "bg-white border-slate-300 text-slate-900"
                        }`}
                      />
                    </td>
                    <td className="p-3 text-center font-bold">
                      {diff === 0 ? (
                        <span className="text-emerald-600 flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Match
                        </span>
                      ) : diff > 0 ? (
                        <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-black">
                          +{diff} (Surplus)
                        </span>
                      ) : (
                        <span className="text-rose-700 bg-rose-100 px-2 py-0.5 rounded font-black">
                          {diff} (Missing)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Action Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              // Reset all counted to system
              const reset: Record<string, number> = {};
              items.forEach((i) => (reset[i.id] = i.quantity));
              setCounts(reset);
            }}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-100"
          >
            <RefreshCw className="w-4 h-4" /> Reset Counts
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="flex items-center gap-1.5 px-5 py-2 bg-yellow-400 text-slate-950 font-black text-xs rounded-lg hover:bg-yellow-300 shadow-sm"
            >
              <Save className="w-4 h-4" /> Apply Audit ({totalDiscrepanciesCount} Updates)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
