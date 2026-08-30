import React, { useState, useMemo } from "react";
import {
  X,
  TrendingUp,
  DollarSign,
  PieChart,
  FileSpreadsheet,
  Package,
  Layers,
  ArrowUpRight,
  Sparkles,
  Percent,
  CheckCircle2,
  AlertCircle,
  Calculator,
} from "lucide-react";
import { InventoryItem, StoreSettings } from "../types";

interface StockValuationModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  settings: StoreSettings;
  onShowToast: (message: string, type?: "success" | "info") => void;
}

export const StockValuationModal: React.FC<StockValuationModalProps> = ({
  isOpen,
  onClose,
  items,
  settings,
  onShowToast,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"cost_value" | "retail_value" | "profit" | "margin">("cost_value");

  if (!isOpen) return null;

  // 1. Overall Aggregates
  const totalCostValue = items.reduce((sum, i) => sum + i.quantity * i.costPrice, 0);
  const totalRetailValue = items.reduce((sum, i) => sum + i.quantity * i.sellingPrice, 0);
  const totalProjectedProfit = totalRetailValue - totalCostValue;
  const overallMargin = totalRetailValue > 0 ? (totalProjectedProfit / totalRetailValue) * 100 : 0;
  const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0);

  // 2. Category Breakdown
  const categoryStats = useMemo(() => {
    const map = new Map<
      string,
      { count: number; units: number; costVal: number; retailVal: number; profit: number }
    >();

    items.forEach((item) => {
      const cat = item.category || "General";
      const existing = map.get(cat) || { count: 0, units: 0, costVal: 0, retailVal: 0, profit: 0 };
      const itemCost = item.quantity * item.costPrice;
      const itemRetail = item.quantity * item.sellingPrice;

      map.set(cat, {
        count: existing.count + 1,
        units: existing.units + item.quantity,
        costVal: existing.costVal + itemCost,
        retailVal: existing.retailVal + itemRetail,
        profit: existing.profit + (itemRetail - itemCost),
      });
    });

    return Array.from(map.entries()).map(([category, stats]) => ({
      category,
      ...stats,
      margin: stats.retailVal > 0 ? (stats.profit / stats.retailVal) * 100 : 0,
      costSharePct: totalCostValue > 0 ? (stats.costVal / totalCostValue) * 100 : 0,
    }));
  }, [items, totalCostValue]);

  // 3. Filtered & Sorted Item Valuation List
  const itemValuations = useMemo(() => {
    const list = items
      .filter((i) => selectedCategory === "all" || i.category === selectedCategory)
      .map((item) => {
        const costVal = item.quantity * item.costPrice;
        const retailVal = item.quantity * item.sellingPrice;
        const profit = retailVal - costVal;
        const margin = retailVal > 0 ? (profit / retailVal) * 100 : 0;
        return {
          item,
          costVal,
          retailVal,
          profit,
          margin,
        };
      });

    return list.sort((a, b) => {
      if (sortBy === "cost_value") return b.costVal - a.costVal;
      if (sortBy === "retail_value") return b.retailVal - a.retailVal;
      if (sortBy === "profit") return b.profit - a.profit;
      if (sortBy === "margin") return b.margin - a.margin;
      return 0;
    });
  }, [items, selectedCategory, sortBy]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "SKU",
      "Item Name",
      "Category",
      "Quantity in Stock",
      "Unit Cost Price",
      "Unit Selling Price",
      "Total Cost Spent",
      "Total Retail Value (If Sold)",
      "Projected Profit",
      "Projected Margin %",
    ];

    const rows = itemValuations.map(({ item, costVal, retailVal, profit, margin }) => [
      `"${item.sku || ""}"`,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.category}"`,
      item.quantity,
      item.costPrice.toFixed(2),
      item.sellingPrice.toFixed(2),
      costVal.toFixed(2),
      retailVal.toFixed(2),
      profit.toFixed(2),
      margin.toFixed(1) + "%",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Store_Stock_Valuation_Report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast("Stock valuation exported to CSV!");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col my-4 max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-400/20 text-yellow-400 border border-amber-400/30">
              <PieChart className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  Stock Valuation & Profit Intelligence
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-yellow-400 text-slate-950">
                  Financials
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Comprehensive breakdown of total money spent to acquire stock vs potential sales revenue.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Export Valuation</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/50 dark:bg-slate-900/50">
          {/* 3 Large Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Card 1: Total Money Spent (Cost) */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Total Money Spent (Cost)
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
                {settings.currencySymbol}
                {totalCostValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Total money invested to buy all {totalUnits.toLocaleString()} units across {items.length} SKUs.
              </p>
            </div>

            {/* Card 2: Total Retail Value (If Sold All) */}
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 shadow-2xs">
              <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">
                Total Sales Revenue (If Sold All)
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
                {settings.currencySymbol}
                {totalRetailValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400/80 mt-1">
                Total cash incoming if every piece of stock is sold at selling price.
              </p>
            </div>

            {/* Card 3: Projected Profit & Margin */}
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-1">
                <span>Projected Gross Profit</span>
                <span className="bg-yellow-400 text-slate-950 px-2 py-0.5 rounded font-black text-[10px]">
                  +{overallMargin.toFixed(1)}% Gross Margin
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-800 dark:text-yellow-300 font-mono">
                +{settings.currencySymbol}
                {totalProjectedProfit.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400/80 mt-1">
                Total profit left over after deducting inventory acquisition cost.
              </p>
            </div>
          </div>

          {/* Category Breakdown Section */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-2xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-yellow-500" />
              <span>Category Capital Investment & Expected Returns</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {categoryStats.map((cat) => (
                <div
                  key={cat.category}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                      {cat.category}
                    </span>
                    <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.2 rounded font-bold">
                      {cat.units} units
                    </span>
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Cost Spent:</span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {settings.currencySymbol}
                        {cat.costVal.toFixed(2)}
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Sales Value:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">
                        {settings.currencySymbol}
                        {cat.retailVal.toFixed(2)}
                      </strong>
                    </div>
                    <div className="flex justify-between text-yellow-600 dark:text-yellow-400 pt-1 border-t border-slate-200 dark:border-slate-800 font-bold">
                      <span>Profit:</span>
                      <span>
                        +{settings.currencySymbol}
                        {cat.profit.toFixed(2)} ({cat.margin.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Item Detailed Valuation Table */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-3.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                Item-by-Item Valuation ({itemValuations.length} Items)
              </div>

              {/* Sorting & Filter Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-medium"
                >
                  <option value="all">All Categories</option>
                  {categoryStats.map((c) => (
                    <option key={c.category} value={c.category}>
                      {c.category}
                    </option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-medium"
                >
                  <option value="cost_value">Highest Cost Invested</option>
                  <option value="retail_value">Highest Sales Revenue</option>
                  <option value="profit">Highest Profit Potential</option>
                  <option value="margin">Highest Margin %</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">Item Name</th>
                    <th className="p-3">Quantity</th>
                    <th className="p-3">Unit Cost</th>
                    <th className="p-3">Unit Sell</th>
                    <th className="p-3">Total Cost Spent</th>
                    <th className="p-3">Total Sales Value</th>
                    <th className="p-3 text-right">Projected Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 font-medium">
                  {itemValuations.map(({ item, costVal, retailVal, profit, margin }) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
                    >
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.category} {item.sku ? `• SKU: ${item.sku}` : ""}
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded font-black text-xs ${
                            item.quantity === 0
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                              : item.quantity <= item.reorderPoint
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                          }`}
                        >
                          {item.quantity} {item.unit}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        {settings.currencySymbol}
                        {item.costPrice.toFixed(2)}
                      </td>
                      <td className="p-3 text-slate-800 dark:text-slate-200 font-bold">
                        {settings.currencySymbol}
                        {item.sellingPrice.toFixed(2)}
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                        {settings.currencySymbol}
                        {costVal.toFixed(2)}
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {settings.currencySymbol}
                        {retailVal.toFixed(2)}
                      </td>
                      <td className="p-3 text-right">
                        <div className="font-mono font-black text-yellow-600 dark:text-yellow-400">
                          +{settings.currencySymbol}
                          {profit.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {margin.toFixed(0)}% margin
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
