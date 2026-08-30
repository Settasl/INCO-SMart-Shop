import React from "react";
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  Truck,
  PieChart,
  BarChart2,
  Users,
  Settings,
  Sparkles,
  ChevronDown,
  Crown,
  Shield,
  LogOut,
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { UserProfile, StoreSettings } from "../types";
import { sounds } from "../lib/sound";

interface AppSidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  userProfile?: UserProfile | null;
  settings: StoreSettings;
  onOpenStockValuation: () => void;
  onOpenSalesReport: () => void;
  onOpenQuickRestock: () => void;
  onOpenQuickSale: () => void;
  onOpenSuppliers?: () => void;
  onOpenSettings: () => void;
  onOpenSubscription: () => void;
  onOpenProfile: () => void;
  onOpenAdminPortal: () => void;
  onLogout: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activeView,
  setActiveView,
  userProfile,
  settings,
  onOpenStockValuation,
  onOpenSalesReport,
  onOpenQuickRestock,
  onOpenQuickSale,
  onOpenSuppliers,
  onOpenSettings,
  onOpenSubscription,
  onOpenProfile,
  onOpenAdminPortal,
  onLogout,
}) => {
  const isSuperAdmin =
    userProfile?.identifier?.toLowerCase() === "settaholdings@gmail.com";

  const isProUser =
    isSuperAdmin ||
    userProfile?.subscription?.status === "active" ||
    userProfile?.subscription?.plan === "INCO Pro AI";

  return (
    <aside className="w-64 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800 p-4 flex flex-col justify-between hidden md:flex shrink-0 select-none z-20">
      {/* Top Logo & Branding */}
      <div>
        <div className="flex items-center gap-2.5 px-2 py-1 mb-6">
          <BrandLogo size="md" />
          <span className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-mono">
            SMART-SHOP
          </span>
        </div>

        {/* Navigation Items Matching Image 1 */}
        <nav className="space-y-1">
          {/* Dashboard (Active) */}
          <button
            onClick={() => {
              sounds.playClick();
              setActiveView("dashboard");
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeView === "dashboard"
                ? "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 shadow-xs border border-purple-100 dark:border-purple-900/50"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          {/* Stock */}
          <button
            onClick={() => {
              sounds.playClick();
              setActiveView("stock");
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeView === "stock"
                ? "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 shadow-xs border border-purple-100 dark:border-purple-900/50"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Stock</span>
          </button>

          {/* Sales */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenQuickSale();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Sales</span>
          </button>

          {/* Purchase */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenQuickRestock();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
          >
            <Truck className="w-4 h-4" />
            <span>Purchase</span>
          </button>

          {/* Valuation */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenStockValuation();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
          >
            <PieChart className="w-4 h-4" />
            <span>Valuation</span>
          </button>

          {/* Reports */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenSalesReport();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
          >
            <BarChart2 className="w-4 h-4" />
            <span>Reports</span>
          </button>

          {/* Suppliers */}
          <button
            onClick={() => {
              sounds.playClick();
              if (onOpenSuppliers) onOpenSuppliers();
              else onOpenQuickRestock();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>Suppliers</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenSettings();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </nav>
      </div>

      {/* Bottom Area: Upgrade Card & Store Manager Card */}
      <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
        {/* Business Plan Card Matching Image 1 */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-left">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Business Plan
          </div>
          <div className="text-xs font-black text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
            <span>INCO Master Plan</span>
            <span>🚀</span>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onOpenSubscription();
            }}
            className="w-full mt-2.5 py-1.5 px-3 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            {isProUser ? "Manage Plan" : "Upgrade Plan"}
          </button>
        </div>

        {/* User Card Matching Image 1 */}
        <button
          onClick={() => {
            sounds.playClick();
            onOpenProfile();
          }}
          className="w-full p-2 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-750 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
              {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : "M"}
            </div>
            <div className="text-left min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {userProfile?.displayName || "Store Manager"}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {isSuperAdmin ? "Super Admin" : "Store Admin"}
              </div>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        </button>

        {/* Secret Admin Backend Button: EXCLUSIVELY for settaholdings@gmail.com */}
        {isSuperAdmin && (
          <button
            onClick={() => {
              sounds.playClick();
              onOpenAdminPortal();
            }}
            className="w-full py-2 px-3 bg-slate-950 text-amber-400 border border-amber-400/50 rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-black transition-all cursor-pointer shadow-md"
          >
            <Shield className="w-3.5 h-3.5 fill-amber-400" />
            <span>ADMIN BACKEND</span>
          </button>
        )}
      </div>
    </aside>
  );
};
