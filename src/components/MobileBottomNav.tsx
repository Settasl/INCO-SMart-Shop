import React from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Receipt,
  Menu,
} from "lucide-react";
import { sounds } from "../lib/sound";
import { UserProfile } from "../types";

interface MobileBottomNavProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  lowStockCount?: number;
  darkMode?: boolean;
  userPhoneOrEmail?: string | null;
  userProfile?: UserProfile | null;
  onToggleDarkMode?: () => void;
  onOpenScan?: () => void;
  onOpenQuickSale?: () => void;
  onOpenStockValuation?: () => void;
  onOpenQuickRestock?: () => void;
  onOpenSalesReport?: () => void;
  onOpenAIAssistant?: () => void;
  onOpenWhatsappOrder?: () => void;
  onOpenAudit?: () => void;
  onOpenPrintSheet?: () => void;
  onOpenHistory?: () => void;
  onOpenSettings?: () => void;
  onOpenAuth?: () => void;
  onOpenChat?: () => void;
  onOpenProfile?: () => void;
  onOpenAdminPortal?: () => void;
  onOpenSubscription?: () => void;
  onOpenMenu?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab = "dashboard",
  onSelectTab,
  onOpenScan,
  onOpenQuickSale,
  onOpenMenu,
}) => {
  return (
    <div className="md:hidden fixed bottom-2 inset-x-3 z-40">
      <div className="bg-[#252525]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 shadow-2xl flex items-center justify-around">
        {/* 1. Dashboard */}
        <button
          onClick={() => {
            sounds.playClick();
            if (onSelectTab) onSelectTab("dashboard");
          }}
          className={`flex flex-col items-center gap-0.5 cursor-pointer py-1 px-2 min-w-[48px] transition-colors ${
            activeTab === "dashboard"
              ? "text-[#E5F107] font-bold"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Home</span>
        </button>

        {/* 2. Products */}
        <button
          onClick={() => {
            sounds.playClick();
            if (onSelectTab) onSelectTab("products");
          }}
          className={`flex flex-col items-center gap-0.5 cursor-pointer py-1 px-2 min-w-[48px] transition-colors ${
            activeTab === "products"
              ? "text-[#E5F107] font-bold"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Boxes className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Products</span>
        </button>

        {/* 3. Center Glowing Yellow POS Action Button */}
        <button
          onClick={() => {
            sounds.playClick();
            sounds.triggerHaptic(20);
            if (onSelectTab) onSelectTab("pos");
            else if (onOpenQuickSale) onOpenQuickSale();
          }}
          className="-mt-5 w-12 h-12 rounded-2xl bg-[#E5F107] text-[#252525] flex items-center justify-center shadow-lg shadow-[#E5F107]/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="POS Terminal"
        >
          <ShoppingCart className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* 4. Sales Orders */}
        <button
          onClick={() => {
            sounds.playClick();
            if (onSelectTab) onSelectTab("sales");
          }}
          className={`flex flex-col items-center gap-0.5 cursor-pointer py-1 px-2 min-w-[48px] transition-colors ${
            activeTab === "sales"
              ? "text-[#E5F107] font-bold"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Sales</span>
        </button>

        {/* 5. Menu Drawer Trigger */}
        <button
          onClick={() => {
            sounds.playClick();
            if (onOpenMenu) onOpenMenu();
            else if (onSelectTab) onSelectTab("tools");
          }}
          className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-[#E5F107] cursor-pointer py-1 px-2 min-w-[48px] transition-colors"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Menu</span>
        </button>
      </div>
    </div>
  );
};
