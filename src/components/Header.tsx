import React from "react";
import {
  Headphones,
  Search,
  Bell,
  ScanLine,
  User,
  Boxes,
  PieChart,
  BarChart2,
  Truck,
  Wrench,
  Moon,
  Sun,
  Shield,
  Zap,
  Sparkles,
} from "lucide-react";
import { StoreSettings, UserProfile } from "../types";
import { BrandLogo } from "./BrandLogo";
import { sounds } from "../lib/sound";
import { useBusiness } from "../context/BusinessContext";

interface HeaderProps {
  activeView: string;
  onSelectView: (view: string) => void;
  settings: StoreSettings;
  userPhoneOrEmail?: string | null;
  userProfile?: UserProfile | null;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onOpenScanner?: () => void;
  onOpenNotifications?: () => void;
  onOpenChat: () => void;
  onOpenProfile?: () => void;
  onOpenAuth: () => void;
  onOpenToolsDrawer?: () => void;
  onToggleDarkMode?: () => void;
  darkMode?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onSelectView,
  settings,
  userPhoneOrEmail,
  userProfile,
  searchQuery = "",
  onSearchChange,
  onOpenScanner,
  onOpenNotifications,
  onOpenChat,
  onOpenProfile,
  onOpenAuth,
  onOpenToolsDrawer,
  onToggleDarkMode,
  darkMode = false,
}) => {
  const { activeBusiness, userRole } = useBusiness();
  const isSuperAdmin =
    (userProfile?.identifier || userPhoneOrEmail || "").toLowerCase() ===
    "settaholdings@gmail.com";

  const handleOpenAccount = () => {
    sounds.playClick();
    if (onOpenProfile) onOpenProfile();
    else onOpenAuth();
  };

  const handleOpenSupport = () => {
    sounds.playClick();
    onOpenChat();
  };

  const navLinks = [
    { id: "stock", label: "Stock Home", icon: Boxes },
    { id: "valuation", label: "Valuation", icon: PieChart },
    { id: "reports", label: "Reports", icon: BarChart2 },
    { id: "suppliers", label: "Suppliers", icon: Truck },
    { id: "tools", label: "Tools", icon: Wrench },
  ];

  return (
    <header
      role="banner"
      className="bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-30 font-sans shadow-lg"
    >
      {/* Top Main Bar */}
      <div className="w-full px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Brand Logo & Store Name */}
        <div className="flex items-center gap-4 shrink-0">
          <div
            onClick={() => {
              sounds.playClick();
              onSelectView("stock");
            }}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
            title="Go to Stock Home"
          >
            <BrandLogo size="xs" theme="yellow" showText={false} animated={false} />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-base font-black tracking-tight text-white uppercase">
                  INCO
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/30 px-1.5 py-0.5 rounded-md">
                  Smart Shop
                </span>
                {userRole && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800 border border-slate-700 px-1 py-0.5 rounded-md">
                    {userRole}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-medium truncate max-w-[140px] sm:max-w-none">
                {activeBusiness?.businessName || activeBusiness?.name || settings.storeName || "My Retail Store"}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links (Yellow & White Contrast) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-2xl">
            {navLinks.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    sounds.playClick();
                    onSelectView(tab.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? "bg-amber-400 text-slate-950 shadow-sm font-black"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isActive ? "text-slate-950 stroke-[2.5]" : "text-amber-400"
                    }`}
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Center: High-Contrast Search Bar (Yellow & White on Dark) */}
        <div className="relative flex-1 max-w-xs sm:max-w-sm md:max-w-md">
          <Search className="w-4 h-4 text-amber-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="Search product, barcode, SKU..."
            className="w-full pl-9 pr-9 py-2 bg-slate-900 border border-slate-700/80 rounded-2xl text-xs font-medium text-white placeholder:text-slate-400 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all shadow-inner"
          />
          {onOpenScanner && (
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                sounds.triggerHaptic(15);
                onOpenScanner();
              }}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-amber-400 cursor-pointer transition-colors"
              title="Barcode Camera Scanner"
            >
              <ScanLine className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right Actions: Yellow & White Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Scanner Icon (Desktop/Tablet) */}
          {onOpenScanner && (
            <button
              onClick={() => {
                sounds.playClick();
                sounds.triggerHaptic(20);
                onOpenScanner();
              }}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 hover:bg-slate-850 hover:border-amber-400 transition-all cursor-pointer shadow-xs"
              title="Scan Barcode"
            >
              <ScanLine className="w-4 h-4" />
            </button>
          )}

          {/* Dark / Light Mode Toggle */}
          {onToggleDarkMode && (
            <button
              onClick={() => {
                sounds.playClick();
                onToggleDarkMode();
              }}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-400/50 transition-all cursor-pointer shadow-xs"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-300" />
              )}
            </button>
          )}

          {/* Notification Bell */}
          <button
            onClick={() => {
              sounds.playClick();
              if (onOpenNotifications) onOpenNotifications();
              else onOpenChat();
            }}
            className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer shadow-xs"
            title="Notifications & Desk"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black flex items-center justify-center shadow-xs">
              3
            </span>
          </button>

          {/* Support Headphone Desk */}
          <button
            onClick={handleOpenSupport}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-white font-bold text-xs transition-all shadow-xs cursor-pointer hover:border-amber-400/50"
          >
            <Headphones className="w-3.5 h-3.5 text-amber-400" />
            <span>Support</span>
          </button>

          {/* User Account / Profile Button with Yellow Background App Icon */}
          <button
            onClick={handleOpenAccount}
            className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-400 transition-all cursor-pointer shadow-xs"
            title="User Profile & Settings"
          >
            <BrandLogo size="xs" theme="yellowAppIcon" animated={false} />
            <div className="hidden lg:flex flex-col text-left leading-none pr-1">
              <span className="text-xs font-bold text-white truncate max-w-[100px]">
                {userProfile?.displayName || "Merchant"}
              </span>
              <span className="text-[9px] text-amber-400 font-semibold">
                {isSuperAdmin ? "Super Admin" : "Active Store"}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Sub-Bar (Below main header for small screens) */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-850 px-2 py-1 bg-slate-950 overflow-x-auto scrollbar-none">
        {navLinks.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                sounds.playClick();
                onSelectView(tab.id);
              }}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-amber-400 text-slate-950 font-black"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Icon
                className={`w-3 h-3 ${
                  isActive ? "text-slate-950 stroke-[2.5]" : "text-amber-400"
                }`}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
