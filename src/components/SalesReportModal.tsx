import React, { useState, useMemo } from "react";
import {
  X,
  TrendingUp,
  Calendar,
  DollarSign,
  Package,
  AlertTriangle,
  FileSpreadsheet,
  CloudUpload,
  Printer,
  CheckCircle2,
  BarChart2,
  Sparkles,
  ArrowUpRight,
  ExternalLink,
} from "lucide-react";
import { InventoryItem, StockMovement, StoreSettings, CreditRecord } from "../types";
import { requestGoogleDriveToken, uploadFileToDrive } from "../lib/googleDrive";

interface SalesReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  movements: StockMovement[];
  settings: StoreSettings;
  credits?: CreditRecord[];
  cashAtHand?: number;
}

type PeriodType = "today" | "week" | "month" | "all";

export const SalesReportModal: React.FC<SalesReportModalProps> = ({
  isOpen,
  onClose,
  items,
  movements,
  settings,
  credits = [],
  cashAtHand = 0,
}) => {
  const [period, setPeriod] = useState<PeriodType>("week");
  const [isDriveUploading, setIsDriveUploading] = useState(false);
  const [driveResult, setDriveResult] = useState<{ url?: string; msg?: string; error?: string } | null>(null);

  // Filter movements by period
  const filteredMovements = useMemo(() => {
    const now = new Date();
    return movements.filter((m) => {
      if (m.type !== "remove_stock" && m.type !== "sale") return false;
      const mDate = new Date(m.timestamp);
      if (isNaN(mDate.getTime())) return true;

      if (period === "today") {
        return (
          mDate.getDate() === now.getDate() &&
          mDate.getMonth() === now.getMonth() &&
          mDate.getFullYear() === now.getFullYear()
        );
      } else if (period === "week") {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return mDate >= sevenDaysAgo;
      } else if (period === "month") {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return mDate >= thirtyDaysAgo;
      }
      return true; // all time
    });
  }, [movements, period]);

  // Aggregate sales per item
  const salesByItem = useMemo(() => {
    const map = new Map<string, { item?: InventoryItem; itemName: string; qtySold: number; estimatedRevenue: number }>();

    filteredMovements.forEach((m) => {
      const existing = map.get(m.itemId) || {
        item: items.find((i) => i.id === m.itemId),
        itemName: m.itemName,
        qtySold: 0,
        estimatedRevenue: 0,
      };

      const soldQty = Math.abs(m.delta);
      const itemRef = existing.item || items.find((i) => i.id === m.itemId);
      const price = itemRef ? itemRef.sellingPrice : 0;

      existing.qtySold += soldQty;
      existing.estimatedRevenue += soldQty * price;
      if (itemRef) existing.item = itemRef;

      map.set(m.itemId, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.qtySold - a.qtySold);
  }, [filteredMovements, items]);

  // Key metrics
  const totalUnitsSold = useMemo(() => {
    return salesByItem.reduce((sum, s) => sum + s.qtySold, 0);
  }, [salesByItem]);

  const totalRevenue = useMemo(() => {
    return salesByItem.reduce((sum, s) => sum + s.estimatedRevenue, 0);
  }, [salesByItem]);

  const totalEstimatedCost = useMemo(() => {
    return salesByItem.reduce((sum, s) => {
      const cost = s.item ? s.item.costPrice : 0;
      return sum + s.qtySold * cost;
    }, 0);
  }, [salesByItem]);

  const totalMargin = totalRevenue - totalEstimatedCost;

  // Products with low stock that were sold in this period
  const lowStockSoldProducts = useMemo(() => {
    return salesByItem.filter((s) => {
      if (!s.item) return false;
      return s.item.quantity <= s.item.reorderPoint;
    });
  }, [salesByItem]);

  if (!isOpen) return null;

  // Generate CSV data string
  const generateCSVContent = () => {
    const headers = ["Item Name", "Quantity Sold", "Selling Price", "Estimated Revenue", "Current Stock", "Stock Status"];
    const rows = salesByItem.map((s) => [
      `"${s.itemName.replace(/"/g, '""')}"`,
      s.qtySold,
      s.item ? s.item.sellingPrice : 0,
      s.estimatedRevenue.toFixed(2),
      s.item ? s.item.quantity : "N/A",
      s.item
        ? s.item.quantity === 0
          ? "OUT OF STOCK"
          : s.item.quantity <= s.item.reorderPoint
          ? "LOW STOCK"
          : "OK"
        : "UNKNOWN",
    ]);

    return [
      `Sales Report (${period.toUpperCase()}) - ${settings.storeName}`,
      `Generated At: ${new Date().toLocaleString()}`,
      `Total Revenue: ${settings.currencySymbol}${totalRevenue.toFixed(2)}`,
      `Total Units Sold: ${totalUnitsSold}`,
      "",
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");
  };

  // Download CSV
  const handleDownloadCSV = () => {
    const content = generateCSVContent();
    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + content);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Inco_Sales_Report_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Google Drive
  const handleExportToGoogleDrive = async () => {
    setIsDriveUploading(true);
    setDriveResult(null);
    try {
      const token = await requestGoogleDriveToken();
      const fileName = `Inco_Sales_Report_${period}_${new Date().toISOString().slice(0, 10)}.csv`;
      const csvContent = generateCSVContent();

      const result = await uploadFileToDrive(token, fileName, csvContent, "text/csv");

      if (result.success) {
        setDriveResult({
          url: result.fileUrl,
          msg: `Saved "${fileName}" to your Google Drive!`,
        });
      } else {
        setDriveResult({
          error: result.error || "Failed uploading report to Google Drive.",
        });
      }
    } catch (err: any) {
      console.error(err);
      setDriveResult({
        error: err.message || "Failed connecting to Google Drive OAuth.",
      });
    } finally {
      setIsDriveUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col my-6 max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <BarChart2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">Sales & Stock Reports</h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-400 text-slate-950">
                  Analytics
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Revenue metrics, top-selling items, and low-stock reorder warnings.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Period Selector Tabs */}
          <div className="flex items-center justify-between flex-wrap gap-3 p-1.5 bg-slate-950 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(["today", "week", "month", "all"] as PeriodType[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                    period === p
                      ? "bg-yellow-400 text-slate-950 shadow"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  {p === "today" ? "Today" : p === "week" ? "Last 7 Days" : p === "month" ? "Last 30 Days" : "All Time"}
                </button>
              ))}
            </div>

            {/* Export Bar */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportToGoogleDrive}
                disabled={isDriveUploading}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow"
                title="Save report directly to Google Drive"
              >
                <CloudUpload className="w-3.5 h-3.5" />
                <span>{isDriveUploading ? "Exporting..." : "Save to Google Drive"}</span>
              </button>

              <button
                onClick={handleDownloadCSV}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* Drive Upload Notification */}
          {driveResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                driveResult.error
                  ? "bg-red-950/80 border-red-800 text-red-200"
                  : "bg-emerald-950/80 border-emerald-800 text-emerald-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {driveResult.error ? (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <span>{driveResult.error || driveResult.msg}</span>
              </div>
              {driveResult.url && (
                <a
                  href={driveResult.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-emerald-500 text-slate-950 font-bold rounded-lg text-[11px] flex items-center gap-1 shrink-0 hover:bg-emerald-400"
                >
                  <span>Open Drive File</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {/* Metrics Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Total Revenue */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] uppercase font-bold tracking-wider">Total Sales</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">
                {settings.currencySymbol}
                {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Est. gross sales revenue</div>
            </div>

            {/* Units Sold */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] uppercase font-bold tracking-wider">Units Sold</span>
                <Package className="w-4 h-4 text-yellow-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">{totalUnitsSold}</div>
              <div className="text-[10px] text-slate-400 mt-1">Items deducted from stock</div>
            </div>

            {/* Estimated Margin */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] uppercase font-bold tracking-wider">Est. Margin</span>
                <TrendingUp className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400">
                {settings.currencySymbol}
                {totalMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Revenue minus cost price</div>
            </div>

            {/* Transactions Count */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] uppercase font-bold tracking-wider">Sales Logs</span>
                <Calendar className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">{filteredMovements.length}</div>
              <div className="text-[10px] text-slate-400 mt-1">Recorded movement logs</div>
            </div>
          </div>

          {/* Cash at Hand vs Cash Out on Credit Breakdown */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-yellow-400/20 text-yellow-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Cash at Hand vs Credit Ledger</h4>
                  <p className="text-[11px] text-slate-400">
                    Liquidity tracking: cash collected vs outstanding customer debt
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Current Cash at Hand</div>
                <div className="font-black text-base text-emerald-400 font-mono">
                  {settings.currencySymbol}
                  {cashAtHand.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Total Credit Extended</div>
                <div className="font-black text-lg text-white">
                  {settings.currencySymbol}
                  {credits.reduce((sum, c) => sum + c.totalAmount, 0).toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500">{credits.length} total credited sales</div>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="text-[10px] text-emerald-400 uppercase font-bold">Debt Recovered (Cash In)</div>
                <div className="font-black text-lg text-emerald-400">
                  {settings.currencySymbol}
                  {credits.reduce((sum, c) => sum + c.amountPaid, 0).toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500">Collected repayments</div>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-amber-900/60 bg-amber-950/20">
                <div className="text-[10px] text-amber-400 uppercase font-bold">Cash Out on Credit (Owed)</div>
                <div className="font-black text-lg text-amber-400">
                  {settings.currencySymbol}
                  {credits
                    .filter((c) => c.status !== "paid")
                    .reduce((sum, c) => sum + c.amountOutstanding, 0)
                    .toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-400">
                  {credits.filter((c) => c.status !== "paid" && c.amountOutstanding > 0).length} active debtors
                </div>
              </div>
            </div>
          </div>

          {/* LOW STOCK SOLD WARNING BOX */}
          {lowStockSoldProducts.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/80 text-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
                <h3 className="text-sm font-bold text-white">
                  Low Stock Alert ({lowStockSoldProducts.length} items sold recently are running low!)
                </h3>
              </div>
              <p className="text-xs text-amber-300/80 mb-3">
                These items were sold in this period and have now dropped below their reorder threshold. Reorder soon from suppliers:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {lowStockSoldProducts.map((s) => (
                  <div
                    key={s.itemName}
                    className="p-2.5 bg-slate-950 border border-amber-900/60 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{s.itemName}</div>
                      <div className="text-[10px] text-slate-400">Sold {s.qtySold} {s.item?.unit || "pcs"}</div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                        s.item?.quantity === 0
                          ? "bg-red-500/20 text-red-400 border border-red-500/40"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                      }`}>
                        {s.item?.quantity === 0 ? "Out of stock" : `${s.item?.quantity} left`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Best-Selling Products Ranking */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span>Best-Selling Products ({salesByItem.length})</span>
              </h3>
            </div>

            {salesByItem.length === 0 ? (
              <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-400 text-xs">
                No sales or stock deductions recorded for this selected time period ({period}).
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800">
                {salesByItem.map((s, idx) => {
                  const maxSold = salesByItem[0]?.qtySold || 1;
                  const pct = Math.min(100, Math.round((s.qtySold / maxSold) * 100));

                  return (
                    <div key={s.itemName} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/50 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 font-bold text-xs flex items-center justify-center shrink-0 text-yellow-400">
                          #{idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white truncate">{s.itemName}</span>
                            {s.item && (
                              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-bold shrink-0">
                                {s.item.category}
                              </span>
                            )}
                          </div>
                          {/* Visual Sales Bar */}
                          <div className="w-full bg-slate-900 rounded-full h-1.5 mt-2 overflow-hidden border border-slate-800 max-w-xs">
                            <div
                              className="bg-yellow-400 h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 text-xs text-right shrink-0 border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">Qty Sold</div>
                          <div className="font-bold text-white text-sm">
                            {s.qtySold} <span className="text-xs font-normal text-slate-400">{s.item?.unit || "pcs"}</span>
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">Est. Sales</div>
                          <div className="font-bold text-emerald-400 text-sm">
                            {settings.currencySymbol}
                            {s.estimatedRevenue.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
