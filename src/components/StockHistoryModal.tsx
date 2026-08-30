import React from "react";
import { History, ArrowUpRight, ArrowDownLeft, RefreshCw, X } from "lucide-react";
import { StockMovement, StoreSettings } from "../types";

interface StockHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  movements: StockMovement[];
  settings: StoreSettings;
  onClearHistory: () => void;
}

export const StockHistoryModal: React.FC<StockHistoryModalProps> = ({
  isOpen,
  onClose,
  movements,
  settings,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-slate-900 rounded-xl text-yellow-400 font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Stock Movement History</h3>
              <p className="text-xs text-slate-500">
                Audit log of all sales, restocks, counts & physical audits
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
          {movements.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No stock movements recorded yet. Any quick count, sale, or restock will appear here.
            </div>
          ) : (
            movements.map((mov) => {
              const isPositive = mov.delta > 0;
              return (
                <div key={mov.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2 rounded-lg font-bold ${
                        isPositive ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{mov.itemName}</div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(mov.timestamp).toLocaleString()} {mov.note ? `• ${mov.note}` : ""}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`font-black text-sm ${isPositive ? "text-emerald-700" : "text-rose-700"}`}>
                      {isPositive ? `+${mov.delta}` : mov.delta}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      New Total: {mov.newQuantity}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm("Clear movement history?")) onClearHistory();
            }}
            className="text-xs text-rose-600 hover:text-rose-800 font-bold"
          >
            Clear Log
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg hover:bg-slate-800"
          >
            Close Log
          </button>
        </div>
      </div>
    </div>
  );
};
