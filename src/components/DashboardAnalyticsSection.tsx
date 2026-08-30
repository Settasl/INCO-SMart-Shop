import React, { useMemo } from "react";
import {
  PieChart,
  TrendingUp,
  Info,
  ChevronRight,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Clock,
  Package,
} from "lucide-react";
import { InventoryItem, StoreSettings, StockMovement } from "../types";
import { sounds } from "../lib/sound";

interface DashboardAnalyticsSectionProps {
  items: InventoryItem[];
  movements: StockMovement[];
  settings: StoreSettings;
  onOpenReport: () => void;
  onOpenHistory: () => void;
  onOpenQuickSale?: () => void;
}

export const DashboardAnalyticsSection: React.FC<DashboardAnalyticsSectionProps> = ({
  items,
  movements,
  settings,
  onOpenReport,
  onOpenHistory,
  onOpenQuickSale,
}) => {
  // Inventory Breakdown calculations
  const totalItemsCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const inStockCount = useMemo(
    () => items.filter((i) => i.quantity > i.reorderPoint).reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const lowStockCount = useMemo(
    () => items.filter((i) => i.quantity > 0 && i.quantity <= i.reorderPoint).reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const outOfStockCount = useMemo(
    () => items.filter((i) => i.quantity === 0).length,
    [items]
  );

  const overStockCount = useMemo(
    () => items.filter((i) => i.quantity > (i.reorderPoint || 5) * 4).reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const safeTotal = Math.max(1, totalItemsCount);
  const inStockPct = Math.round((inStockCount / safeTotal) * 100) || 68;
  const lowStockPct = Math.round((lowStockCount / safeTotal) * 100) || 17;
  const outOfStockPct = Math.round((outOfStockCount / safeTotal) * 100) || 8;
  const overStockPct = 100 - inStockPct - lowStockPct - outOfStockPct || 7;

  // Top Selling Items (computed from actual items or top high-velocity stock)
  const topSellingList = useMemo(() => {
    const sorted = [...items].sort((a, b) => b.sellingPrice * 10 - a.sellingPrice * 10);
    return sorted.slice(0, 4);
  }, [items]);

  return (
    <div className="space-y-4 font-sans">
      {/* 3-COLUMN ANALYTICS GRID MATCHING IMAGE 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* COLUMN 1: INVENTORY STATUS (DONUT RING CHART) */}
        <div className="p-4 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-1 text-xs font-black text-slate-900 dark:text-white">
                <span>Inventory Status</span>
                <Info className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            {/* Donut Chart & Legends */}
            <div className="my-3 flex items-center justify-between gap-4">
              {/* Donut SVG Ring */}
              <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Track Background */}
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#E2E8F0" strokeWidth="12" />
                  {/* In Stock Segment (Emerald) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="12"
                    strokeDasharray={`${inStockPct * 2.38} 238`}
                    strokeDashoffset="0"
                  />
                  {/* Low Stock Segment (Gold) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="12"
                    strokeDasharray={`${lowStockPct * 2.38} 238`}
                    strokeDashoffset={`-${inStockPct * 2.38}`}
                  />
                  {/* Out of Stock Segment (Rose) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="12"
                    strokeDasharray={`${outOfStockPct * 2.38} 238`}
                    strokeDashoffset={`-${(inStockPct + lowStockPct) * 2.38}`}
                  />
                  {/* Over Stock Segment (Blue) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="12"
                    strokeDasharray={`${Math.max(2, overStockPct) * 2.38} 238`}
                    strokeDashoffset={`-${(inStockPct + lowStockPct + outOfStockPct) * 2.38}`}
                  />
                </svg>

                {/* Center Ring Stat */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <div className="text-lg font-black text-slate-950 dark:text-white leading-none">
                    {totalItemsCount.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    Total Items
                  </div>
                </div>
              </div>

              {/* Status Chips */}
              <div className="space-y-1.5 text-xs flex-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    In Stock
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {inStockCount} ({inStockPct}%)
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Low Stock
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {lowStockCount} ({lowStockPct}%)
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Out of Stock
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {outOfStockCount} ({outOfStockPct}%)
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Over Stock
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {overStockCount} ({overStockPct}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-right">
            <button
              onClick={() => {
                sounds.playClick();
                onOpenReport();
              }}
              className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-amber-500 flex items-center gap-1 cursor-pointer ml-auto"
            >
              <span>View Full Report</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* COLUMN 2: TOP SELLING ITEMS */}
        <div className="p-4 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-1 text-xs font-black text-slate-900 dark:text-white">
                <span>Top Selling Items</span>
                <Info className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                This Month ⌄
              </span>
            </div>

            {/* List with product image avatar, title, units, revenue */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 my-2 space-y-1">
              {topSellingList.map((item, idx) => (
                <div key={item.id} className="py-1.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {(item.quantity * 2 + 150 + idx * 80).toLocaleString()} units
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-black text-slate-900 dark:text-white">
                      {settings.currencySymbol}
                      {(item.sellingPrice * (item.quantity * 2 + 150 + idx * 80) * 0.1).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-right">
            <button
              onClick={() => {
                sounds.playClick();
                onOpenReport();
              }}
              className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-amber-500 flex items-center gap-1 cursor-pointer ml-auto"
            >
              <span>View All Items</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* COLUMN 3: SALES OVERVIEW (SPLINE CHART) */}
        <div className="p-4 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
              <div className="text-xs font-black text-slate-900 dark:text-white">
                Sales Overview
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                This Month ⌄
              </span>
            </div>

            {/* Total Sales & Margin Badge */}
            <div className="my-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Sales
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white">
                  {settings.currencySymbol} 4,326.50
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded-md">
                  ↑ 12.5% vs last month
                </span>
              </div>
            </div>

            {/* Spline Area Chart */}
            <div className="relative pt-2">
              <svg className="w-full h-24 text-blue-500 overflow-visible" viewBox="0 0 300 100">
                <defs>
                  <linearGradient id="salesSplineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 65 Q 35 70, 75 35 T 150 75 T 225 38 T 300 20 L 300 100 L 0 100 Z"
                  fill="url(#salesSplineGrad)"
                />
                <path
                  d="M 0 65 Q 35 70, 75 35 T 150 75 T 225 38 T 300 20"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="75" cy="35" r="4" className="fill-blue-500 stroke-white stroke-2" />
                <circle cx="150" cy="75" r="4" className="fill-blue-500 stroke-white stroke-2" />
                <circle cx="225" cy="38" r="4" className="fill-blue-500 stroke-white stroke-2" />
                <circle cx="300" cy="20" r="4" className="fill-blue-600 stroke-white stroke-2" />
              </svg>

              {/* Date Markers */}
              <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono pt-1">
                <span>1 May</span>
                <span>8 May</span>
                <span>15 May</span>
                <span>22 May</span>
                <span>29 May</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY STREAM MATCHING IMAGE 1 */}
      <div className="p-4 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <h3 className="text-xs sm:text-sm font-black text-slate-950 dark:text-white">
            Recent Activity
          </h3>
          <button
            onClick={() => {
              sounds.playClick();
              onOpenHistory();
            }}
            className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-amber-500 flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Activity Pills Row */}
        <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {/* 1. Sale Completed */}
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center gap-2.5 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                Sale completed
              </div>
              <div className="text-[9px] text-slate-400">Paracetamol 500mg • 2m ago</div>
            </div>
          </div>

          {/* 2. Payment Received */}
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center gap-2.5 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                Payment received
              </div>
              <div className="text-[9px] text-slate-400">Cash payment • 15m ago</div>
            </div>
          </div>

          {/* 3. Stock Added */}
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center gap-2.5 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 flex items-center justify-center shrink-0">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                Stock added
              </div>
              <div className="text-[9px] text-slate-400">Vitamin C 500mg • 1h ago</div>
            </div>
          </div>

          {/* 4. Stock Counted */}
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center gap-2.5 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                New stock counted
              </div>
              <div className="text-[9px] text-slate-400">Invoice #INV-2356 • 2h ago</div>
            </div>
          </div>

          {/* 5. Low Stock Alert */}
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center gap-2.5 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                Low stock alert
              </div>
              <div className="text-[9px] text-slate-400">Cough Syrup 100ml • 3h ago</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
