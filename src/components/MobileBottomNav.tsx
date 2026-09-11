import React, { useState } from "react";
import {
  Boxes,
  Scan,
  ShoppingCart,
  Menu,
  X,
  TrendingUp,
  BarChart2,
  PackagePlus,
  MessageCircle,
  History,
  Settings,
  Sparkles,
  Headphones,
  Shield,
  Crown,
  LayoutDashboard,
  Truck,
  PieChart,
  Download,
  Mail,
  Printer,
} from "lucide-react";
import { sounds } from "../lib/sound";
import { UserProfile } from "../types";
import { BrandLogo } from "./BrandLogo";

interface MobileBottomNavProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  lowStockCount?: number;
  darkMode: boolean;
  userPhoneOrEmail?: string | null;
  userProfile?: UserProfile | null;
  onToggleDarkMode: () => void;
  onOpenScan: () => void;
  onOpenQuickSale: () => void;
  onOpenStockValuation: () => void;
  onOpenQuickRestock: () => void;
  onOpenSalesReport: () => void;
  onOpenAIAssistant: () => void;
  onOpenWhatsappOrder: () => void;
  onOpenAudit: () => void;
  onOpenPrintSheet: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onOpenChat: () => void;
  onOpenProfile: () => void;
  onOpenAdminPortal: () => void;
  onOpenSubscription: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab = "stock",
  onSelectTab,
  lowStockCount = 0,
  darkMode,
  userPhoneOrEmail,
  userProfile,
  onToggleDarkMode,
  onOpenScan,
  onOpenQuickSale,
  onOpenStockValuation,
  onOpenQuickRestock,
  onOpenSalesReport,
  onOpenAIAssistant,
  onOpenWhatsappOrder,
  onOpenAudit,
  onOpenPrintSheet,
  onOpenHistory,
  onOpenSettings,
  onOpenAuth,
  onOpenChat,
  onOpenProfile,
  onOpenAdminPortal,
  onOpenSubscription,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isSuperAdmin =
    (userProfile?.identifier || userPhoneOrEmail || "").toLowerCase() ===
    "settaholdings@gmail.com";

  return (
    <>
      {/* Expanded Tools / Menu Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200">
          <div
            className="absolute inset-0"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="relative bg-slate-950 text-white border-t border-slate-800 rounded-t-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <BrandLogo size="xs" theme="yellow" showText={false} animated={false} />
                <div>
                  <h3 className="text-base font-black text-white">
                    INCO Smart Tools Hub
                  </h3>
                  <p className="text-xs text-amber-400 font-semibold">Quick Launch & Utilities</p>
                </div>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Launch Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  if (onSelectTab) onSelectTab("valuation");
                  else onOpenStockValuation();
                }}
                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-400 flex flex-col items-center text-center gap-2 cursor-pointer transition-colors"
              >
                <PieChart className="w-6 h-6 text-emerald-400" />
                <span className="text-xs font-bold text-white">Valuation</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  if (onSelectTab) onSelectTab("reports");
                  else onOpenSalesReport();
                }}
                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-400 flex flex-col items-center text-center gap-2 cursor-pointer transition-colors"
              >
                <BarChart2 className="w-6 h-6 text-blue-400" />
                <span className="text-xs font-bold text-white">Reports</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  if (onSelectTab) onSelectTab("suppliers");
                  else onOpenQuickRestock();
                }}
                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-400 flex flex-col items-center text-center gap-2 cursor-pointer transition-colors"
              >
                <Truck className="w-6 h-6 text-purple-400" />
                <span className="text-xs font-bold text-white">Suppliers</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenAIAssistant();
                }}
                className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/50 flex flex-col items-center text-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-6 h-6 text-amber-400" />
                <span className="text-xs font-bold text-amber-300">AI Scanner</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenWhatsappOrder();
                }}
                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-400 flex flex-col items-center text-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-6 h-6 text-emerald-400" />
                <span className="text-xs font-bold text-white">WhatsApp</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenAudit();
                }}
                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-400 flex flex-col items-center text-center gap-2 cursor-pointer"
              >
                <Boxes className="w-6 h-6 text-indigo-400" />
                <span className="text-xs font-bold text-white">Audit Count</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenHistory();
                }}
                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-400 flex flex-col items-center text-center gap-2 cursor-pointer"
              >
                <History className="w-6 h-6 text-slate-300" />
                <span className="text-xs font-bold text-white">History</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenSettings();
                }}
                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-400 flex flex-col items-center text-center gap-2 cursor-pointer"
              >
                <Settings className="w-6 h-6 text-slate-300" />
                <span className="text-xs font-bold text-white">Settings</span>
              </button>
            </div>

            {/* Admin Portal Button: Only for settaholdings@gmail.com */}
            {isSuperAdmin && (
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenAdminPortal();
                }}
                className="w-full py-3.5 px-5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2.5 cursor-pointer shadow-md transition-all min-h-[46px]"
              >
                <Shield className="w-5 h-5 fill-slate-950" />
                <span>SUPER ADMIN DESK</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Dark & Yellow Bottom Dock (Mobile Only) */}
      <div className="md:hidden fixed bottom-3 inset-x-3 z-40">
        <div className="bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-3xl p-2.5 shadow-2xl flex items-center justify-around">
          {/* 1. Stock */}
          <button
            onClick={() => {
              sounds.playClick();
              if (onSelectTab) onSelectTab("stock");
            }}
            className={`flex flex-col items-center gap-1 cursor-pointer p-1.5 min-w-[48px] ${
              activeTab === "stock"
                ? "text-amber-400 font-black"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Boxes className="w-6 h-6" />
            <span className="text-xs font-bold">Stock</span>
          </button>

          {/* 2. Sale */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenQuickSale();
            }}
            className="flex flex-col items-center gap-1 text-slate-300 hover:text-amber-400 cursor-pointer p-1.5 min-w-[48px]"
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="text-xs font-bold">Sale</span>
          </button>

          {/* 3. Center Glowing Barcode Scanner */}
          <button
            onClick={() => {
              sounds.playClick();
              sounds.triggerHaptic(20);
              onOpenScan();
            }}
            className="-mt-6 w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-400/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Scan Barcode"
          >
            <Scan className="w-7 h-7 stroke-[2.5]" />
          </button>

          {/* 4. Support */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenChat();
            }}
            className="flex flex-col items-center gap-1 text-slate-300 hover:text-amber-400 cursor-pointer p-1.5 min-w-[48px]"
          >
            <Headphones className="w-6 h-6" />
            <span className="text-xs font-bold">Support</span>
          </button>

          {/* 5. Tools */}
          <button
            onClick={() => {
              sounds.playClick();
              if (onSelectTab) onSelectTab("tools");
              else setIsMenuOpen(true);
            }}
            className={`flex flex-col items-center gap-1 cursor-pointer p-1.5 min-w-[48px] ${
              activeTab === "tools"
                ? "text-amber-400 font-black"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Menu className="w-6 h-6" />
            <span className="text-xs font-bold">Tools</span>
          </button>
        </div>
      </div>
    </>
  );
};
