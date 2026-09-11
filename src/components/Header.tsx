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
      className="bg-black text-white border-b border-slate-800 sticky top-0 z-30 font-sans shadow-md pt-[env(safe-area-inset-top,0px)]"
    >
      {/* Top Main Bar */}
      <div className="w-full px-2.5 sm:px-5 py-1.5 flex items-center justify-between gap-2.5">
        {/* Left: Brand Logo & Store Name */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            onClick={() => {
              sounds.playClick();
              onSelectView("stock");
            }}
            className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
            title="Go to Stock Home"
          >
            <BrandLogo size="xs" theme="yellow" showText={false} animated={false} />
            <div className="flex flex-col">
              <div className="flex items-center gap-1 leading-none">
                <span className="text-sm font-black tracking-tight text-white uppercase">
                  INCO
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/15 border border-amber-400/40 px-1 py-0.2 rounded">
                  Smart Shop
                </span>
                {userRole && (
                  <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-300 bg-slate-900 border border-slate-800 px-1 py-0.2 rounded">
                    {userRole}
                  </span>
                )}
              </div>
              <span className="text-[9.5px] text-slate-400 font-medium truncate max-w-[120px] sm:max-w-none">
                {activeBusiness?.businessName || activeBusiness?.name || settings.storeName || "My Retail Store"}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links (Permanent Black/Slate-900 Solid Lean Pill) */}
          <nav className="hidden md:flex items-center gap-0.5 bg-slate-900 border border-slate-800 p-0.5 rounded-xl">
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
                  className={`px-2.5 py-1 rounded-lg text-micro font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? "bg-amber-400 text-slate-950 shadow-xs font-black"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
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
          </nav>
        </div>

        {/* Center: Search Bar */}
        <div className="relative flex-1 max-w-xs sm:max-w-sm md:max-w-md">
          <Search className="w-3.5 h-3.5 text-amber-400 absolute left-2.5 top-2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="Search product, barcode, SKU..."
            className="w-full pl-8 pr-8 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-micro font-medium text-white placeholder:text-slate-500 focus:outline-hidden focus:border-amber-400 transition-all"
          />
          {onOpenScanner && (
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                sounds.triggerHaptic(15);
                onOpenScanner();
              }}
              className="absolute right-2 top-1.5 text-slate-400 hover:text-amber-400 cursor-pointer transition-colors"
              title="Barcode Camera Scanner"
            >
              <ScanLine className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Actions: Permanent Black/Slate-900 Compact Lean Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick Scanner Icon (Desktop/Tablet) */}
          {onOpenScanner && (
            <button
              onClick={() => {
                sounds.playClick();
                sounds.triggerHaptic(20);
                onOpenScanner();
              }}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-400/50 text-amber-400 transition-all cursor-pointer shadow-xs"
              title="Scan Barcode"
            >
              <ScanLine className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Dark / Light Mode Toggle */}
          {onToggleDarkMode && (
            <button
              onClick={() => {
                sounds.playClick();
                onToggleDarkMode();
              }}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-400/50 text-slate-200 hover:text-amber-400 transition-all cursor-pointer shadow-xs"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-amber-300" />
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
            className="relative p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-400/50 text-slate-200 hover:text-amber-400 transition-all cursor-pointer shadow-xs"
            title="Notifications & Desk"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 text-slate-950 text-[8px] font-black flex items-center justify-center shadow-xs">
              3
            </span>
          </button>

          {/* Support Headphone Desk */}
          <button
            onClick={handleOpenSupport}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-400/50 text-white font-bold text-micro transition-all shadow-xs cursor-pointer"
          >
            <Headphones className="w-3 h-3 text-amber-400" />
            <span>Support</span>
          </button>

          {/* User Account / Profile Button */}
          <button
            onClick={handleOpenAccount}
            className="flex items-center gap-1 p-0.5 sm:px-1.5 sm:py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-400 transition-all cursor-pointer shadow-xs"
            title="User Profile & Settings"
          >
            <BrandLogo size="xs" theme="yellowAppIcon" animated={false} />
            <div className="hidden lg:flex flex-col text-left leading-none pr-0.5">
              <span className="text-micro font-bold text-white truncate max-w-[90px]">
                {userProfile?.displayName || "Merchant"}
              </span>
              <span className="text-[8.5px] text-amber-400 font-semibold">
                {isSuperAdmin ? "Super Admin" : "Active Store"}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Sub-Bar (Permanent Black Solid Lean) */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800 px-1 py-1 bg-black overflow-x-auto scrollbar-none">
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
              className={`px-2 py-0.5 rounded-lg text-nano font-bold transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-amber-400 text-slate-950 font-black shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Icon
                className={`w-2.5 h-2.5 ${
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
