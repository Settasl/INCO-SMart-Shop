import React, { useMemo } from "react";
import {
  TrendingUp,
  DollarSign,
  Info,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { InventoryItem, StoreSettings } from "../types";
import { sounds } from "../lib/sound";

interface StockFinancialsBannerProps {
  items: InventoryItem[];
  settings: StoreSettings;
  cashAtHand?: number;
  onOpenStockValuation: () => void;
  onOpenQuickSale?: () => void;
  onOpenSalesReport?: () => void;
}

export const StockFinancialsBanner: React.FC<StockFinancialsBannerProps> = ({
  items,
  settings,
  cashAtHand = 145.5,
  onOpenStockValuation,
  onOpenQuickSale,
  onOpenSalesReport,
}) => {
  // Financial computations
  const totalUnits = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const totalCostValue = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity * i.costPrice, 0),
    [items]
  );

  const totalRetailValue = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity * i.sellingPrice, 0),
    [items]
  );

  const projectedProfit = Math.max(0, totalRetailValue - totalCostValue);
  const profitMargin =
    totalRetailValue > 0 ? (projectedProfit / totalRetailValue) * 100 : 0;

  const lowStockCount = useMemo(
    () => items.filter((i) => i.quantity <= i.reorderPoint).length,
    [items]
  );

  return (
    <div className="space-y-3 font-sans">
      {/* Header Bar Matching Image 1 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-slate-950 dark:text-white">
                Store Overview
              </h2>
              <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                LIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Real-time snapshot of your store's performance.
            </p>
          </div>
        </div>

        {/* Action Button: Valuation Report */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sounds.playClick();
              onOpenStockValuation();
            }}
            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all hover:bg-slate-50"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Valuation Report</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      </div>

      {/* 4 Crisp Lean Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* CARD 1: TOTAL SPENT (COST) */}
        <div className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                <span>Total Spent (Cost)</span>
                <Info className="w-3 h-3 text-slate-400" />
              </div>
            </div>

            <div className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white mt-1">
              {settings.currencySymbol}{" "}
              {totalCostValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>

            <div className="inline-block mt-1 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] font-bold border border-purple-200 dark:border-purple-800">
              Purchase Cost
            </div>

            <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium mt-1">
              Invested in {totalUnits} units
            </div>
          </div>

          {/* Mini Sparkline Chart */}
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <svg className="w-24 h-6 text-purple-500 overflow-visible" viewBox="0 0 100 25">
              <path
                d="M 0 18 Q 15 22, 30 14 T 60 18 T 85 8 T 100 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              <span>2 mins ago</span>
              <Clock className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* CARD 2: TOTAL RETAIL VALUE */}
        <div className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                <span>Total Retail Value</span>
                <Info className="w-3 h-3 text-slate-400" />
              </div>
            </div>

            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {settings.currencySymbol}{" "}
              {totalRetailValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>

            <div className="inline-block mt-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
              Expected Revenue
            </div>

            <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium mt-1">
              Revenue if 100% sold
            </div>
          </div>

          {/* Mini Sparkline Chart */}
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <svg className="w-24 h-6 text-emerald-500 overflow-visible" viewBox="0 0 100 25">
              <path
                d="M 0 20 Q 20 15, 40 18 T 70 8 T 100 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              <span>2 mins ago</span>
              <Clock className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* CARD 3: PROJECTED GROSS PROFIT */}
        <div className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                <span>Projected Gross Profit</span>
                <Info className="w-3 h-3 text-slate-400" />
              </div>
            </div>

            <div className="text-xl sm:text-2xl font-black text-amber-500 dark:text-amber-400 mt-1">
              +{settings.currencySymbol}{" "}
              {projectedProfit.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>

            <div className="inline-block mt-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-200 dark:border-amber-800">
              +{profitMargin.toFixed(1)}% Margin
            </div>

            <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium mt-1">
              Expected profit gain
            </div>
          </div>

          {/* Mini Sparkline Chart */}
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <svg className="w-24 h-6 text-amber-500 overflow-visible" viewBox="0 0 100 25">
              <path
                d="M 0 22 Q 25 12, 50 18 T 80 8 T 100 4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              <span>2 mins ago</span>
              <Clock className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* CARD 4: CASH IN HAND & OVERVIEW */}
        <div className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                <span>Cash In Hand & Overview</span>
              </div>
            </div>

            <div className="mt-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">In Hand</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {settings.currencySymbol}
                  {cashAtHand.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">Low Stock</span>
                <span className="text-sm font-black text-rose-500 dark:text-rose-400">
                  {lowStockCount} items
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium mt-1">
              {lowStockCount > 0 ? `${lowStockCount} item(s) need restock` : "All items in good stock"}
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={() => {
                sounds.playClick();
                if (onOpenSalesReport) onOpenSalesReport();
              }}
              className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-amber-500 flex items-center gap-0.5 cursor-pointer ml-auto"
            >
              <span>View</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
