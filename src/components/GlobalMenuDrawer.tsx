import React from "react";
import {
  X,
  Scan,
  ShoppingCart,
  Boxes,
  PieChart,
  Truck,
  Users,
  DollarSign,
  Sparkles,
  MessageCircle,
  ClipboardCheck,
  Printer,
  Mail,
  BarChart2,
  History,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Headphones,
  Settings,
  Crown,
  Shield,
  LogOut,
  LayoutDashboard,
  Package,
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { sounds } from "../lib/sound";
import { UserProfile, StoreSettings } from "../types";

interface GlobalMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: string;
  onSelectView: (view: string) => void;
  userProfile?: UserProfile | null;
  settings: StoreSettings;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenScanner: () => void;
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
  onOpenLowStockEmail?: () => void;
  onLogout?: () => void;
}

export const GlobalMenuDrawer: React.FC<GlobalMenuDrawerProps> = ({
  isOpen,
  onClose,
  activeView,
  onSelectView,
  userProfile,
  settings,
  darkMode,
  onToggleDarkMode,
  onOpenScanner,
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
  onOpenLowStockEmail,
  onLogout,
}) => {
  if (!isOpen) return null;

  const isSuperAdmin =
    userProfile?.identifier?.toLowerCase() === "settaholdings@gmail.com";

  const handleAction = (cb: () => void) => {
    sounds.playClick();
    onClose();
    cb();
  };

  const navigateTo = (view: string) => {
    sounds.playClick();
    onClose();
    onSelectView(view);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="INCO Smart Menu"
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide-out Menu Panel */}
      <aside className="relative w-full max-w-md bg-[#252525] text-white border-l border-white/10 shadow-2xl flex flex-col h-full z-10 overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#252525]/95 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <BrandLogo size="xs" theme="yellowAppIcon" showText={false} animated={false} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight text-white uppercase">
                  INCO
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#252525] bg-[#E5F107] px-1.5 py-0.5 rounded-md">
                  Smart Menu
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Smart Business. Simplified.</p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-[#1E1E1E] border border-white/10 text-slate-400 hover:text-white hover:border-white/20 cursor-pointer transition-colors"
            title="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-none">
          {/* User Account / Profile Banner */}
          <div className="p-3.5 rounded-2xl bg-[#1E1E1E] border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#E5F107] text-[#252525] font-black text-sm flex items-center justify-center shrink-0 shadow-md">
                {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : "S"}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate">
                  {userProfile?.displayName || "Setta Holdings"}
                </div>
                <div className="text-xs text-[#E5F107] font-semibold truncate">
                  {isSuperAdmin ? "Super Admin" : "Active Merchant"}
                </div>
              </div>
            </div>
            <button
              onClick={() => handleAction(onOpenProfile)}
              className="px-3 py-1.5 rounded-xl bg-[#2A2A2A] hover:bg-[#333333] text-xs font-bold text-white cursor-pointer transition-colors shrink-0 border border-white/5"
            >
              Profile
            </button>
          </div>

          {/* SECTION 1: Core Navigation Pages */}
          <div className="space-y-2">
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1">
              Store Navigation
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
                { id: "pos", label: "POS Terminal", icon: ShoppingCart },
                { id: "products", label: "Products", icon: Package },
                { id: "stock", label: "Stock Counter", icon: Boxes },
                { id: "sales", label: "Sales & Orders", icon: BarChart2 },
                { id: "reports", label: "Reports", icon: PieChart },
                { id: "suppliers", label: "Suppliers", icon: Truck },
                { id: "valuation", label: "Stock Valuation", icon: DollarSign },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigateTo(item.id)}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#E5F107] text-[#252525] border-[#E5F107] font-black shadow-md"
                        : "bg-[#1E1E1E] border-white/10 text-slate-300 hover:bg-[#2A2A2A] hover:text-white"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-[#252525]" : "text-[#E5F107]"}`} />
                    <span className="text-xs font-bold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: Operations & Hardware Launchers */}
          <div className="space-y-2">
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1">
              Operations & Quick Actions
            </div>
            <div className="space-y-1.5">
              <button
                onClick={() => handleAction(onOpenScanner)}
                className="w-full p-3 rounded-xl bg-[#1E1E1E] border border-white/10 hover:border-[#E5F107] flex items-center justify-between text-slate-200 hover:text-white transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#E5F107]/10 text-[#E5F107] flex items-center justify-center">
                    <Scan className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-white">Barcode Camera Scanner</div>
                    <div className="text-[10px] text-slate-400">Scan barcodes via live camera</div>
                  </div>
                </div>
                <span className="text-[10px] bg-[#E5F107] text-[#252525] px-2 py-0.5 rounded font-black">
                  Instant
                </span>
              </button>

              <button
                onClick={() => handleAction(onOpenQuickSale)}
                className="w-full p-3 rounded-xl bg-[#1E1E1E] border border-white/10 hover:border-[#E5F107] flex items-center justify-between text-slate-200 hover:text-white transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-white">1-Tap Cash Sale Modal</div>
                    <div className="text-[10px] text-slate-400">Record cash / MOMO checkout</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleAction(onOpenQuickRestock)}
                className="w-full p-3 rounded-xl bg-[#1E1E1E] border border-white/10 hover:border-[#E5F107] flex items-center justify-between text-slate-200 hover:text-white transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-white">Bulk Purchase & Restock</div>
                    <div className="text-[10px] text-slate-400">Add inventory from suppliers</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleAction(onOpenStockValuation)}
                className="w-full p-3 rounded-xl bg-[#1E1E1E] border border-white/10 hover:border-[#E5F107] flex items-center justify-between text-slate-200 hover:text-white transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <PieChart className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-white">Stock Financials & Valuation</div>
                    <div className="text-[10px] text-slate-400">Total cost vs retail profit margin</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* SECTION 3: Smart Tools */}
          <div className="space-y-2">
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1">
              Smart Utilities & Intelligence
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleAction(onOpenAIAssistant)}
                className="p-3 rounded-xl bg-[#1E1E1E] border border-white/10 hover:border-[#E5F107] flex flex-col items-start gap-1.5 cursor-pointer text-left transition-colors"
              >
                <Sparkles className="w-4 h-4 text-[#E5F107]" />
                <span className="text-xs font-bold text-white">AI Assistant</span>
                <span className="text-[10px] text-slate-400">Voice & photo OCR</span>
              </button>

              <button
                onClick={() => handleAction(onOpenWhatsappOrder)}
                className="p-3 rounded-xl bg-[#1E1E1E] border border-white/10 hover:border-emerald-400 flex flex-col items-start gap-1.5 cursor-pointer text-left transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">WhatsApp Order</span>
                <span className="text-[10px] text-slate-400">Direct receipt text</span>
              </button>

              <button
                onClick={() => handleAction(onOpenAudit)}
                className="p-3 rounded-xl bg-[#1E1E1E] border border-white/10 hover:border-blue-400 flex flex-col items-start gap-1.5 cursor-pointer text-left transition-colors"
              >
                <ClipboardCheck className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white">Stock Audit Mode</span>
                <span className="text-[10px] text-slate-400">Discrepancy check</span>
              </button>

              <button
                onClick={() => handleAction(onOpenPrintSheet)}
                className="p-3 rounded-xl bg-[#1E1E1E] border border-white/10 hover:border-[#E5F107] flex flex-col items-start gap-1.5 cursor-pointer text-left transition-colors"
              >
                <Printer className="w-4 h-4 text-[#E5F107]" />
                <span className="text-xs font-bold text-white">Print Sheets</span>
                <span className="text-[10px] text-slate-400">Count lists & labels</span>
              </button>
            </div>
          </div>

          {/* SECTION 4: Preferences & Support */}
          <div className="space-y-2">
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1">
              Preferences & Support
            </div>
            <div className="space-y-1.5">
              {/* Dark mode toggle */}
              <button
                onClick={() => {
                  sounds.playClick();
                  onToggleDarkMode();
                }}
                className="w-full p-3 rounded-xl bg-[#1E1E1E] border border-white/10 hover:border-[#E5F107] flex items-center justify-between text-slate-200 hover:text-white transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#2A2A2A] text-[#E5F107] flex items-center justify-center">
                    {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </div>
                  <span className="text-xs font-bold text-white">
                    {darkMode ? "Switch to Light Theme" : "Switch to Dark Theme"}
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-semibold">
                  {darkMode ? "Dark Mode" : "Light Mode"}
                </span>
              </button>

              {/* Customer support desk */}
              <button
                onClick={() => handleAction(onOpenChat)}
                className="w-full p-3 rounded-xl bg-[#1E1E1E] border border-white/10 hover:border-[#E5F107] flex items-center justify-between text-slate-200 hover:text-white transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#E5F107]/10 text-[#E5F107] flex items-center justify-center">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-white">24/7 Live Support Desk</div>
                    <div className="text-[10px] text-slate-400">Chat with support team</div>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </button>

              {/* Settings modal */}
              <button
                onClick={() => handleAction(onOpenSettings)}
                className="w-full p-3 rounded-xl bg-[#1E1E1E] border border-white/10 hover:border-[#E5F107] flex items-center justify-between text-slate-200 hover:text-white transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#2A2A2A] text-slate-300 flex items-center justify-center">
                    <Settings className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white">Store Configuration & Settings</span>
                </div>
              </button>

              {/* Super Admin Desk */}
              {isSuperAdmin && (
                <button
                  onClick={() => handleAction(onOpenAdminPortal)}
                  className="w-full p-3 rounded-xl bg-[#E5F107] text-[#252525] font-black text-xs flex items-center justify-center gap-2 hover:bg-[#d2dc00] cursor-pointer shadow-md transition-colors"
                >
                  <Shield className="w-4 h-4 fill-[#252525]" />
                  <span>SUPER ADMIN DESK</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#252525] flex items-center justify-between shrink-0">
          <button
            onClick={() => handleAction(onOpenAuth)}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-[#E5F107] cursor-pointer transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Switch Account / Sign Out</span>
          </button>
          <span className="text-[10px] text-slate-500 font-mono">v2.4 • INCO OS</span>
        </div>
      </aside>
    </div>
  );
};
