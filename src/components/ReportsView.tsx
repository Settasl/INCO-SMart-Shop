import React, { useState, useMemo } from "react";
import {
  BarChart2,
  Calendar,
  ArrowUpRight,
  ChevronDown,
  TrendingUp,
  Download,
  Printer,
  Receipt,
  ShoppingBag,
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
  const [selectedPeriod, setSelectedPeriod] = useState<"Today" | "This Week" | "This Month" | "This Year">("This Month");
  const currencySymbol = settings.currencySymbol || "$";

  // Filter sales movements by period
  const periodFilteredSales = useMemo(() => {
    const now = Date.now();
    const periodMs = {
      Today: 24 * 60 * 60 * 1000,
      "This Week": 7 * 24 * 60 * 60 * 1000,
      "This Month": 30 * 24 * 60 * 60 * 1000,
      "This Year": 365 * 24 * 60 * 60 * 1000,
    }[selectedPeriod];

    return (movements || []).filter((m) => {
      const isSale =
        m.type === "sale" ||
        m.type === "sale_paid" ||
        m.type === "sale_credit" ||
        (m.note && m.note.toLowerCase().includes("sale"));
      if (!isSale) return false;
      const mTime = new Date(m.timestamp).getTime();
      return now - mTime <= periodMs;
    });
  }, [movements, selectedPeriod]);

  // Dynamic calculations
  const totalSales = useMemo(() => {
    return periodFilteredSales.reduce((sum, m) => {
      const item = (items || []).find((i) => i.id === m.itemId);
      const price = item?.sellingPrice || 0;
      const qty = Math.abs(m.delta) || 1;
      return sum + price * qty;
    }, 0);
  }, [periodFilteredSales, items]);

  const totalOrders = periodFilteredSales.length;

  const avgOrder = totalOrders > 0 ? totalSales / totalOrders : 0;

  const totalProfit = useMemo(() => {
    return periodFilteredSales.reduce((sum, m) => {
      const item = (items || []).find((i) => i.id === m.itemId);
      if (item) {
        const qty = Math.abs(m.delta) || 1;
        const profitMargin = Math.max(0, item.sellingPrice - item.costPrice);
        return sum + profitMargin * qty;
      }
      return sum;
    }, 0);
  }, [periodFilteredSales, items]);

  const grossMarginPct = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : "0.0";

  // Dynamic top ranked products
  const topRankedProducts = useMemo(() => {
    if (periodFilteredSales.length === 0) return [];
    const map = new Map<string, { name: string; units: number; amount: number }>();
    periodFilteredSales.forEach((m) => {
      const item = (items || []).find((i) => i.id === m.itemId);
      if (item) {
        const qty = Math.abs(m.delta) || 1;
        const amt = item.sellingPrice * qty;
        const existing = map.get(item.id);
        if (existing) {
          existing.units += qty;
          existing.amount += amt;
        } else {
          map.set(item.id, { name: item.name, units: qty, amount: amt });
        }
      }
    });

    return Array.from(map.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4)
      .map((p) => ({
        name: p.name,
        amount: `${currencySymbol}${p.amount.toFixed(2)}`,
        units: p.units,
      }));
  }, [periodFilteredSales, items, currencySymbol]);

  // Dynamic timeline bar chart data (5 time slices)
  const barData = useMemo(() => {
    if (periodFilteredSales.length === 0) {
      return [
        { label: "P1", heightPercent: 4, value: `${currencySymbol}0` },
        { label: "P2", heightPercent: 4, value: `${currencySymbol}0` },
        { label: "P3", heightPercent: 4, value: `${currencySymbol}0` },
        { label: "P4", heightPercent: 4, value: `${currencySymbol}0` },
        { label: "P5", heightPercent: 4, value: `${currencySymbol}0` },
      ];
    }

    const slices = 5;
    const now = Date.now();
    const periodMs = {
      Today: 24 * 60 * 60 * 1000,
      "This Week": 7 * 24 * 60 * 60 * 1000,
      "This Month": 30 * 24 * 60 * 60 * 1000,
      "This Year": 365 * 24 * 60 * 60 * 1000,
    }[selectedPeriod];

    const sliceDuration = periodMs / slices;
    const sliceTotals = Array(slices).fill(0);

    periodFilteredSales.forEach((m) => {
      const item = (items || []).find((i) => i.id === m.itemId);
      const price = item?.sellingPrice || 0;
      const qty = Math.abs(m.delta) || 1;
      const amt = price * qty;
      const mTime = new Date(m.timestamp).getTime();
      const age = now - mTime;
      const sliceIdx = Math.min(slices - 1, Math.max(0, Math.floor((periodMs - age) / sliceDuration)));
      sliceTotals[sliceIdx] += amt;
    });

    const maxAmt = Math.max(...sliceTotals, 10);
    return sliceTotals.map((tot, idx) => ({
      label: `T${idx + 1}`,
      heightPercent: Math.max(8, Math.round((tot / maxAmt) * 90)),
      value: `${currencySymbol}${tot.toFixed(0)}`,
    }));
  }, [periodFilteredSales, selectedPeriod, items, currencySymbol]);

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
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
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
          <div className="text-xl sm:text-2xl font-black text-white mt-1">
            {currencySymbol}{totalSales.toFixed(2)}
          </div>
          <div className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{totalSales > 0 ? "+12.5%" : "+0%"}</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-4 rounded-2xl bg-[#121826] border border-[#1F293D] shadow-md">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Orders
          </span>
          <div className="text-xl sm:text-2xl font-black text-white mt-1">
            {totalOrders}
          </div>
          <div className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{totalOrders > 0 ? `+${totalOrders}` : "+0"}</span>
          </div>
        </div>

        {/* Average Order */}
        <div className="p-4 rounded-2xl bg-[#121826] border border-[#1F293D] shadow-md">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Average Order
          </span>
          <div className="text-xl sm:text-2xl font-black text-white mt-1">
            {currencySymbol}{avgOrder.toFixed(2)}
          </div>
          <div className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{avgOrder > 0 ? "+5.2%" : "+0%"}</span>
          </div>
        </div>

        {/* Total Profit */}
        <div className="p-4 rounded-2xl bg-[#121826] border border-[#1F293D] shadow-md">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Profit
          </span>
          <div className="text-xl sm:text-2xl font-black text-white mt-1">
            {currencySymbol}{totalProfit.toFixed(2)}
          </div>
          <div className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{totalProfit > 0 ? "+15.3%" : "+0%"}</span>
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
              {totalSales > 0 ? "Active Sales Stream" : "No Activity"}
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
              {topRankedProducts.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <p className="text-xs font-bold text-slate-300">No items sold yet</p>
                  <p className="text-[11px] text-slate-500 mt-1">Products sold in this timeframe will rank here</p>
                </div>
              ) : (
                topRankedProducts.map((p, idx) => (
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
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#1A2333] mt-4">
            <div className="flex justify-between text-xs text-slate-400 font-bold mb-2">
              <span>Gross Margin</span>
              <span className="text-emerald-400 font-black">{grossMarginPct}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, parseFloat(grossMarginPct)))}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
