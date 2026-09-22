import React from "react";
import {
  Menu,
  User,
  ChevronDown,
  Sparkles,
  LogIn,
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  PieChart,
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
  onOpenMenu: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenQuickSale?: () => void;
  onEnterWelcome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onSelectView,
  settings,
  userPhoneOrEmail,
  userProfile,
  onOpenMenu,
  onOpenAuth,
  onOpenProfile,
  onOpenQuickSale,
  onEnterWelcome,
}) => {
  const { activeBusiness, userRole } = useBusiness();
  const isSuperAdmin =
    (userProfile?.identifier || userPhoneOrEmail || "").toLowerCase() ===
    "settaholdings@gmail.com";

  // The top header has ONLY a few headings as mandated
  // Depending on whether user is on welcome landing page or inside the store app:
  const isWelcomePage = activeView === "welcome";

  const publicNavLinks = [
    { id: "welcome-home", label: "Home", action: () => (onEnterWelcome ? onEnterWelcome() : onSelectView("dashboard")) },
    { id: "welcome-features", label: "Features", action: () => (onEnterWelcome ? onEnterWelcome() : onSelectView("pos")) },
    { id: "welcome-pricing", label: "Pricing", action: () => (onEnterWelcome ? onEnterWelcome() : onSelectView("valuation")) },
    { id: "welcome-contact", label: "Contact", action: () => onOpenMenu() },
  ];

  const appNavLinks = [
    { id: "dashboard", label: "Dashboard", view: "dashboard" },
    { id: "pos", label: "POS", view: "pos" },
    { id: "products", label: "Products", view: "products" },
    { id: "reports", label: "Reports", view: "reports" },
  ];

  return (
    <header
      role="banner"
      className="bg-[#252525] text-white border-b border-black/20 sticky top-0 z-30 font-sans shadow-md pt-[env(safe-area-inset-top,0px)]"
    >
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3">
        {/* Left: Official Inco Logo */}
        <div
          onClick={() => {
            sounds.playClick();
            onSelectView("dashboard");
          }}
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer hover:opacity-95 transition-opacity shrink-0"
          title="INCO - Smart Business. Simplified."
        >
          {/* Exact Brand Logo Squircle */}
          <BrandLogo size="sm" theme="yellowAppIcon" />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase flex items-center">
                <span className="text-[#E5F107] mr-0.5">I</span>NCO
              </span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-[#E5F107] text-[#252525] uppercase tracking-wider hidden sm:inline-block">
                Smart POS
              </span>
            </div>
            <span className="text-[11px] sm:text-xs text-slate-400 font-medium tracking-tight -mt-0.5 hidden xs:inline-block">
              Smart Business. Simplified.
            </span>
          </div>
        </div>

        {/* Center: Headings per user requirement */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          {isWelcomePage
            ? publicNavLinks.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    sounds.playClick();
                    item.action();
                  }}
                  className="text-xs sm:text-sm font-medium text-slate-300 hover:text-[#E5F107] transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              ))
            : appNavLinks.map((tab) => {
                const isActive = activeView === tab.view;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      sounds.playClick();
                      onSelectView(tab.view);
                    }}
                    className={`text-xs sm:text-sm font-semibold transition-colors cursor-pointer py-1 relative ${
                      isActive
                        ? "text-[#E5F107] font-bold"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    <span>{tab.label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E5F107] rounded-full" />
                    )}
                  </button>
                );
              })}
        </nav>

        {/* Right: Clean Action Controls & Menu Trigger */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* If user logged in: User Profile Card */}
          {userProfile?.displayName || userPhoneOrEmail ? (
            <button
              onClick={() => {
                sounds.playClick();
                onOpenProfile();
              }}
              className="flex items-center gap-2.5 p-1 sm:px-3 sm:py-1.5 rounded-xl bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-white/10 transition-colors cursor-pointer"
              title="View Profile"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#E5F107] text-[#252525] font-black text-xs flex items-center justify-center shadow-xs">
                {userProfile?.displayName
                  ? userProfile.displayName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : "SH"}
              </div>
              <div className="hidden sm:flex flex-col text-left leading-tight">
                <span className="text-xs font-bold text-white truncate max-w-[120px]">
                  {userProfile?.displayName || "Setta Holdings"}
                </span>
                <span className="text-[10px] text-slate-400 font-medium truncate">
                  {isSuperAdmin ? "Super Admin" : "Store Admin"}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline-block" />
            </button>
          ) : (
            <button
              onClick={() => {
                sounds.playClick();
                onOpenAuth();
              }}
              className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-[#E5F107] transition-colors cursor-pointer px-2.5 py-1.5"
            >
              Login
            </button>
          )}

          {/* Yellow CTA Button with #E5F107 and #252525 */}
          <button
            onClick={() => {
              sounds.playClick();
              if (activeView === "pos") {
                if (onOpenQuickSale) onOpenQuickSale();
              } else {
                onSelectView("pos");
              }
            }}
            className="px-3.5 sm:px-5 py-1.5 sm:py-2 bg-[#E5F107] hover:bg-[#d2dc00] active:bg-[#c3cd00] text-[#252525] font-black text-xs sm:text-sm rounded-lg sm:rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>{isWelcomePage ? "Get Started" : "POS Terminal"}</span>
          </button>

          {/* MENU BUTTON */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenMenu();
            }}
            className="p-2 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-white/10 text-slate-200 hover:text-[#E5F107] transition-colors cursor-pointer flex items-center gap-1.5"
            title="Open Menu"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-4 h-4 text-[#E5F107]" />
            <span className="text-xs font-bold hidden xs:inline-block">Menu</span>
          </button>
        </div>
      </div>
    </header>
  );
};
