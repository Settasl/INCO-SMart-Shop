import React from "react";
import {
  Sparkles,
  Scan,
  Boxes,
  History,
  MessageCircle,
  Mail,
  Printer,
  Download,
  Headphones,
  Settings,
  Shield,
  Crown,
  FileText,
  Truck,
  TrendingUp,
  PieChart,
  DollarSign,
  ChevronRight,
  Zap,
} from "lucide-react";
import { UserProfile, StoreSettings, InventoryItem } from "../types";
import { BrandLogo } from "./BrandLogo";
import { sounds } from "../lib/sound";

interface ToolsPageViewProps {
  userProfile: UserProfile | null;
  settings: StoreSettings;
  items: InventoryItem[];
  onOpenScanner: () => void;
  onOpenAIAssistant: () => void;
  onOpenAudit: () => void;
  onOpenHistory: () => void;
  onOpenWhatsappOrder: () => void;
  onOpenLowStockEmail: () => void;
  onOpenPrintSheet: () => void;
  onExportCSV: () => void;
  onOpenChat: () => void;
  onOpenSettings: () => void;
  onOpenSubscription: () => void;
  onOpenAdminPortal: () => void;
  onOpenQuickSale: () => void;
  onOpenQuickRestock: () => void;
  onOpenStockValuation: () => void;
  onOpenSalesReport: () => void;
}

export const ToolsPageView: React.FC<ToolsPageViewProps> = ({
  userProfile,
  settings,
  items,
  onOpenScanner,
  onOpenAIAssistant,
  onOpenAudit,
  onOpenHistory,
  onOpenWhatsappOrder,
  onOpenLowStockEmail,
  onOpenPrintSheet,
  onExportCSV,
  onOpenChat,
  onOpenSettings,
  onOpenSubscription,
  onOpenAdminPortal,
  onOpenQuickSale,
  onOpenQuickRestock,
  onOpenStockValuation,
  onOpenSalesReport,
}) => {
  const isSuperAdmin =
    (userProfile?.identifier || "").toLowerCase() === "settaholdings@gmail.com";

  const lowStockItemsCount = items.filter(
    (i) => i.quantity <= i.reorderPoint
  ).length;

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Tools Hub Header Banner - Compact & Clean */}
      <div className="bg-slate-950 text-white border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md relative overflow-hidden">
        {/* Subtle Yellow Ambient Glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-xs">
                <Zap className="w-4 h-4 fill-slate-950" />
              </div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                INCO <span className="text-amber-400">Tools & Utilities</span>
              </h1>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-300 font-medium max-w-lg leading-relaxed">
              Automation, AI voice & photo scanner, barcode audits, WhatsApp catalog generator, and store settings.
            </p>
          </div>

          {/* Compact Quick Stats Pill */}
          <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl shrink-0 self-start sm:self-auto">
            <div className="text-left">
              <div className="text-[9px] uppercase font-bold tracking-wider text-amber-400">
                Total SKUs
              </div>
              <div className="text-sm font-black text-white">{items.length} items</div>
            </div>
            <div className="w-px h-6 bg-slate-800" />
            <div className="text-left">
              <div className="text-[9px] uppercase font-bold tracking-wider text-rose-400">
                Low Stock
              </div>
              <div className="text-sm font-black text-white">{lowStockItemsCount} items</div>
            </div>
          </div>
        </div>
      </div>

      {/* Super Admin Special Access Card (Only if settaholdings@gmail.com) */}
      {isSuperAdmin && (
        <div className="bg-gradient-to-r from-amber-950/70 via-slate-950 to-slate-950 border border-amber-400/80 rounded-2xl p-3.5 sm:p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-left">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md">
              <Shield className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-black text-amber-400">
                  SUPER ADMIN PORTAL
                </span>
                <span className="px-1.5 py-0.2 rounded-md bg-amber-400 text-slate-950 text-[9px] font-black uppercase tracking-wider">
                  Root
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                Manage merchants, approve $4.99/mo Pro subscriptions, verify KYC IDs, and update master data.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playSuccess();
              onOpenAdminPortal();
            }}
            className="w-full sm:w-auto px-4 py-2 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>Open Admin Desk</span>
            <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </div>
      )}

      {/* Core Tools Section */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-amber-400 px-1 flex items-center gap-1.5">
          <span>⚡ Smart Automation & Counting</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
          {/* 1. AI Voice & Photo Scanner */}
          <div
            onClick={() => {
              sounds.playClick();
              onOpenAIAssistant();
            }}
            className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-400 rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-500 font-bold text-[9px] border border-amber-400/30">
                  AI Powered
                </span>
              </div>
              <div>
                <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                  AI Voice & Photo Scanner
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                  Speak inventory counts in natural language or photograph product shelves to auto-update stock.
                </p>
              </div>
            </div>
            <div className="pt-2.5 flex items-center justify-between text-[11px] font-bold text-amber-500">
              <span>Launch AI Scanner</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 2. Barcode Camera Scanner */}
          <div
            onClick={() => {
              sounds.playClick();
              onOpenScanner();
            }}
            className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-400 rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-center">
                  <Scan className="w-4 h-4" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[9px]">
                  Hardware / Cam
                </span>
              </div>
              <div>
                <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                  Barcode Scanner & Matcher
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                  Scan UPC, EAN, or QR codes with your device camera to look up products or assign barcodes.
                </p>
              </div>
            </div>
            <div className="pt-2.5 flex items-center justify-between text-[11px] font-bold text-amber-500">
              <span>Open Scanner</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 3. Physical Stock Audit Count */}
          <div
            onClick={() => {
              sounds.playClick();
              onOpenAudit();
            }}
            className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-400 rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Boxes className="w-4 h-4" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold text-[9px]">
                  Stock Taking
                </span>
              </div>
              <div>
                <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                  Physical Stock Audit
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                  Perform comprehensive physical stock audits, calculate variances, and reconcile discrepancies.
                </p>
              </div>
            </div>
            <div className="pt-2.5 flex items-center justify-between text-[11px] font-bold text-amber-500">
              <span>Start Audit</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 4. Stock Movement History */}
          <div
            onClick={() => {
              sounds.playClick();
              onOpenHistory();
            }}
            className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-400 rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <History className="w-4 h-4" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 font-bold text-[9px]">
                  Audit Log
                </span>
              </div>
              <div>
                <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                  Movement History & Logs
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                  View chronological records of sales, restocks, quantity adjustments, and manual count edits.
                </p>
              </div>
            </div>
            <div className="pt-2.5 flex items-center justify-between text-[11px] font-bold text-amber-500">
              <span>View Log</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 5. WhatsApp Customer Ordering */}
          <div
            onClick={() => {
              sounds.playClick();
              onOpenWhatsappOrder();
            }}
            className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-400 rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 font-bold text-[9px]">
                  WhatsApp Ready
                </span>
              </div>
              <div>
                <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                  WhatsApp Order Generator
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                  Generate formatted product price lists and order templates ready to send to clients via WhatsApp.
                </p>
              </div>
            </div>
            <div className="pt-2.5 flex items-center justify-between text-[11px] font-bold text-amber-500">
              <span>Generate Order</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 6. Low Stock Email Alerts */}
          <div
            onClick={() => {
              sounds.playClick();
              onOpenLowStockEmail();
            }}
            className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-400 rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 font-bold text-[9px]">
                  Alerts
                </span>
              </div>
              <div>
                <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                  Automated Email Alerts
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                  Configure automated email notifications whenever products dip below critical reorder points.
                </p>
              </div>
            </div>
            <div className="pt-2.5 flex items-center justify-between text-[11px] font-bold text-amber-500">
              <span>Configure Alerts</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Reports, Exports & Store Config Section */}
      <div className="space-y-2.5 pt-1">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-amber-400 px-1 flex items-center gap-1.5">
          <span>📊 Reports, Exports & Store Setup</span>
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Printable Stock Taking Sheet */}
          <div
            onClick={() => {
              sounds.playClick();
              onOpenPrintSheet();
            }}
            className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-400 rounded-2xl p-3 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-1.5">
              <div className="w-7 h-7 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Printer className="w-4 h-4" />
              </div>
              <h3 className="font-black text-xs text-slate-900 dark:text-white">
                Print Stock Sheet
              </h3>
              <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-tight">
                Generate printable physical inventory count sheets.
              </p>
            </div>
            <div className="pt-2 text-[10px] font-bold text-amber-500 flex items-center justify-between">
              <span>Print Sheet</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>

          {/* Export CSV Data */}
          <div
            onClick={() => {
              sounds.playClick();
              onExportCSV();
            }}
            className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-400 rounded-2xl p-3 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-1.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Download className="w-4 h-4" />
              </div>
              <h3 className="font-black text-xs text-slate-900 dark:text-white">
                Export to CSV
              </h3>
              <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-tight">
                Download entire inventory to CSV spreadsheet.
              </p>
            </div>
            <div className="pt-2 text-[10px] font-bold text-amber-500 flex items-center justify-between">
              <span>Download CSV</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>

          {/* 24/7 Live Support Desk */}
          <div
            onClick={() => {
              sounds.playClick();
              onOpenChat();
            }}
            className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-400 rounded-2xl p-3 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-1.5">
              <div className="w-7 h-7 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Headphones className="w-4 h-4" />
              </div>
              <h3 className="font-black text-xs text-slate-900 dark:text-white">
                Live Support Desk
              </h3>
              <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-tight">
                Chat with 24/7 support & verified merchant community.
              </p>
            </div>
            <div className="pt-2 text-[10px] font-bold text-amber-500 flex items-center justify-between">
              <span>Open Support</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>

          {/* Store Settings & Currency */}
          <div
            onClick={() => {
              sounds.playClick();
              onOpenSettings();
            }}
            className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-400 rounded-2xl p-3 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-1.5">
              <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white flex items-center justify-center">
                <Settings className="w-4 h-4" />
              </div>
              <h3 className="font-black text-xs text-slate-900 dark:text-white">
                Store Settings
              </h3>
              <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-tight">
                Configure currency, sounds, thresholds, and backups.
              </p>
            </div>
            <div className="pt-2 text-[10px] font-bold text-amber-500 flex items-center justify-between">
              <span>Configure</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
