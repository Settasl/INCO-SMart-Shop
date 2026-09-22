import React, { useState } from "react";
import {
  BarChart2,
  Calendar,
  ArrowUpRight,
  ChevronDown,
  TrendingUp,
  Download,
  Printer,
} from "lucide-react";
import { StoreSettings, StockMovement, InventoryItem } from "../types";
import { sounds } from "../lib/sound";

interface ReportsViewProps {
  settings: StoreSettings;
  movements: StockMovement[];
  items: InventoryItem[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  settings,
  movements,
  items,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState("This Month");

  // Bar chart columns matching bottom-center screen
  const barData = [
    { label: "Jan 1", heightPercent: 45, value: "$1,820" },
    { label: "Jan 8", heightPercent: 78, value: "$3,140" },
    { label: "Jan 15", heightPercent: 30, value: "$1,210" },
    { label: "Jan 22", heightPercent: 92, value: "$3,690" },
    { label: "Jan 29", heightPercent: 65, value: "$2,680" },
  ];

  // Top products ranking matching bottom-center screen
  const topRankedProducts = [
    { name: "Bluetooth Speaker", amount: "$2,410.00", units: 25 },
    { name: "Smart Watch", amount: "$1,890.00", units: 18 },
    { name: "Wireless Earbuds", amount: "$1,290.00", units: 30 },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header & Subheader with Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Reports</h1>
          <p className="text-xs text-slate-400">Sales Report & Revenue Analytics</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#121826] border border-[#1F293D] text-xs font-bold text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-hidden cursor-pointer"
            >
              <option value="Today" className="bg-slate-900 text-white">Today</option>
              <option value="This Week" className="bg-slate-900 text-white">This Week</option>
              <option value="This Month" className="bg-slate-900 text-white">This Month</option>
              <option value="This Year" className="bg-slate-900 text-white">This Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards in a row matching bottom-center screen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Sales */}
        <div className="p-4 rounded-2xl bg-[#121826] border border-[#1F293D] shadow-md">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Sales
          </span>
          <div className="text-xl sm:text-2xl font-black text-white mt-1">$12,540.00</div>
          <div className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+12.5%</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-4 rounded-2xl bg-[#121826] border border-[#1F293D] shadow-md">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Orders
          </span>
          <div className="text-xl sm:text-2xl font-black text-white mt-1">320</div>
          <div className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+8.4%</span>
          </div>
        </div>

        {/* Average Order */}
        <div className="p-4 rounded-2xl bg-[#121826] border border-[#1F293D] shadow-md">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Average Order
          </span>
          <div className="text-xl sm:text-2xl font-black text-white mt-1">$39.19</div>
          <div className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+5.2%</span>
          </div>
        </div>

        {/* Total Profit */}
        <div className="p-4 rounded-2xl bg-[#121826] border border-[#1F293D] shadow-md">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Profit
          </span>
          <div className="text-xl sm:text-2xl font-black text-white mt-1">$4,215.00</div>
          <div className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+15.3%</span>
          </div>
        </div>
      </div>

      {/* Main Panels: Bar Chart and Top Products widget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Bar Chart (8 cols) */}
        <div className="lg:col-span-8 p-5 rounded-2xl bg-[#121826] border border-[#1F293D] shadow-md">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-black text-white">Revenue Timeline</h3>
              <p className="text-xs text-slate-400">Distribution over {selectedPeriod.toLowerCase()}</p>
            </div>
            <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/30">
              Gold Peak Period
            </span>
          </div>

          {/* Bar Chart Container */}
          <div className="h-64 flex items-end justify-between gap-4 pt-4 px-4 pb-2 border-b border-[#1A2333]">
            {barData.map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <span className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {bar.value}
                </span>
                <div
                  style={{ height: `${bar.heightPercent}%` }}
                  className="w-full max-w-[42px] bg-amber-400 group-hover:bg-amber-300 rounded-t-lg transition-all duration-300 shadow-md shadow-amber-400/20"
                />
                <span className="text-xs font-semibold text-slate-400 mt-1">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Top Products Widget (4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-[#121826] border border-[#1F293D] shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-white">Top Products</h3>
              <span className="text-xs text-slate-400 font-semibold">Total Gross</span>
            </div>

            <div className="space-y-3">
              {topRankedProducts.map((p, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#0B0F19] border border-[#1A2333] flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-white">{p.name}</div>
                    <div className="text-[10px] text-slate-400">{p.units} units sold</div>
                  </div>
                  <div className="text-sm font-black text-white">{p.amount}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#1A2333] mt-4">
            <div className="flex justify-between text-xs text-slate-400 font-bold mb-2">
              <span>Gross Margin</span>
              <span className="text-emerald-400 font-black">33.6%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full w-[67%]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
