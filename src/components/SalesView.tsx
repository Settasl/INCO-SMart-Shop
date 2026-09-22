import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  Search,
  ScanLine,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Receipt,
  Download,
} from "lucide-react";
import { StoreSettings, StockMovement } from "../types";
import { sounds } from "../lib/sound";

interface SalesViewProps {
  settings: StoreSettings;
  movements: StockMovement[];
  onBack?: () => void;
  onOpenScanner?: () => void;
}

export const SalesView: React.FC<SalesViewProps> = ({
  settings,
  movements,
  onBack,
  onOpenScanner,
}) => {
  const [activeFilter, setActiveFilter] = useState<"All" | "Completed" | "Pending" | "Cancelled">(
    "All"
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Orders matching the bottom-right mobile screen
  const showcaseOrders = useMemo(
    () => [
      {
        id: "#ORD-001",
        date: "Jan 30, 2024",
        amount: 240.0,
        itemsCount: 1,
        itemsSummary: "Bluetooth Speaker",
        status: "Completed",
        paymentMethod: "Cash POS",
      },
      {
        id: "#ORD-002",
        date: "Jan 30, 2024",
        amount: 180.0,
        itemsCount: 1,
        itemsSummary: "Smart Watch",
        status: "Completed",
        paymentMethod: "MOMO Pay",
      },
      {
        id: "#ORD-003",
        date: "Jan 30, 2024",
        amount: 120.0,
        itemsCount: 1,
        itemsSummary: "Wireless Earbuds",
        status: "Pending",
        paymentMethod: "Credit Book",
      },
      {
        id: "#ORD-004",
        date: "Jan 30, 2024",
        amount: 320.0,
        itemsCount: 2,
        itemsSummary: "Bluetooth Speaker + Power Bank",
        status: "Completed",
        paymentMethod: "Cash POS",
      },
      {
        id: "#ORD-005",
        date: "Jan 29, 2024",
        amount: 70.0,
        itemsCount: 2,
        itemsSummary: "Laptop Bag + USB Cable",
        status: "Completed",
        paymentMethod: "MOMO Pay",
      },
      {
        id: "#ORD-006",
        date: "Jan 29, 2024",
        amount: 120.0,
        itemsCount: 1,
        itemsSummary: "Wireless Earbuds",
        status: "Cancelled",
        paymentMethod: "Reversed",
      },
    ],
    []
  );

  const filterTabs = ["All", "Completed", "Pending", "Cancelled"] as const;

  const filteredOrders = useMemo(() => {
    return showcaseOrders.filter((ord) => {
      const matchFilter = activeFilter === "All" || ord.status === activeFilter;
      const matchSearch =
        ord.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ord.itemsSummary.toLowerCase().includes(searchQuery.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [showcaseOrders, activeFilter, searchQuery]);

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-200">
      {/* Top Header matching bottom-right mobile screen */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={() => {
                sounds.playClick();
                onBack();
              }}
              className="p-2 rounded-xl bg-[#121826] border border-[#1F293D] text-slate-300 hover:text-white cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Sales</h1>
        </div>

        <div className="flex items-center gap-2">
          {onOpenScanner && (
            <button
              onClick={() => {
                sounds.playClick();
                onOpenScanner();
              }}
              className="p-2 rounded-xl bg-[#121826] border border-[#1F293D] text-amber-400 hover:text-amber-300 cursor-pointer"
              title="Barcode Scanner"
            >
              <ScanLine className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs matching bottom-right screen */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filterTabs.map((tab) => {
          const isSelected = activeFilter === tab;
          return (
            <button
              key={tab}
              onClick={() => {
                sounds.playClick();
                setActiveFilter(tab);
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? "bg-amber-400 text-slate-950 font-black shadow-md"
                  : "bg-[#121826] text-slate-300 hover:text-white border border-[#1F293D]"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Orders List Cards matching the bottom-right screen */}
      <div className="space-y-3">
        {filteredOrders.map((ord) => (
          <div
            key={ord.id}
            className="p-4 rounded-2xl bg-[#121826] border border-[#1F293D] hover:border-amber-400/40 shadow-md flex items-center justify-between transition-colors"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white">{ord.id}</span>
                <span className="text-xs text-slate-400">• {ord.itemsSummary}</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">{ord.date}</div>
            </div>

            <div className="text-right">
              <div className="text-sm font-black text-white">${ord.amount.toFixed(2)}</div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                  ord.status === "Completed"
                    ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                    : ord.status === "Pending"
                    ? "bg-amber-950/60 text-amber-400 border border-amber-800/40"
                    : "bg-rose-950/60 text-rose-400 border border-rose-800/40"
                }`}
              >
                {ord.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
