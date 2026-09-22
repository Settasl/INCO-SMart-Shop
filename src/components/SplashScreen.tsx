import React, { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  TrendingUp,
  Boxes,
  ShoppingCart,
  Users,
  Shield,
  Sparkles,
  Zap,
  Globe,
  Star,
  Activity,
  Award,
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { sounds } from "../lib/sound";

interface SplashScreenProps {
  onEnterApp: () => void;
  onOpenAuth: (initialTab?: "login" | "signup") => void;
  userEmailOrPhone?: string | null;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onEnterApp,
  onOpenAuth,
  userEmailOrPhone,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState("English");

  const stats = [
    { value: "10K+", label: "Active Businesses" },
    { value: "95%", label: "Customer Satisfaction" },
    { value: "24/7", label: "Support" },
    { value: "99.9%", label: "Uptime" },
  ];

  return (
    <div
      role="region"
      aria-label="INCO Welcome Portal"
      className="fixed inset-0 z-50 bg-[#252525] text-white flex flex-col overflow-y-auto selection:bg-[#E5F107] selection:text-[#252525] font-sans"
    >
      {/* Top Header: Official Inco Logo & Navigation */}
      <header className="w-full border-b border-white/10 bg-[#252525]/95 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
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
            <span className="text-[11px] text-slate-400 font-medium tracking-tight -mt-0.5">
              Smart Business. Simplified.
            </span>
          </div>
        </div>

        {/* Center Nav Headings */}
        <nav className="hidden md:flex items-center gap-8 text-xs sm:text-sm font-semibold text-slate-300">
          <button
            onClick={() => sounds.playClick()}
            className="hover:text-[#E5F107] transition-colors cursor-pointer"
          >
            Home
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              onEnterApp();
            }}
            className="hover:text-[#E5F107] transition-colors cursor-pointer"
          >
            Features
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              onEnterApp();
            }}
            className="hover:text-[#E5F107] transition-colors cursor-pointer"
          >
            Pricing
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              onOpenAuth();
            }}
            className="hover:text-[#E5F107] transition-colors cursor-pointer"
          >
            Contact
          </button>
        </nav>

        {/* Right Buttons: Login & Get Started */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sounds.playClick();
              onOpenAuth("login");
            }}
            className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-[#E5F107] transition-colors cursor-pointer px-3 py-1.5"
          >
            Login
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              onEnterApp();
            }}
            className="px-4 sm:px-5 py-2 bg-[#E5F107] hover:bg-[#d2dc00] active:bg-[#c3cd00] text-[#252525] font-black text-xs sm:text-sm rounded-lg sm:rounded-xl shadow-md transition-all cursor-pointer"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Main Welcome Hero Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-16 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Headline, Subtitle, CTA buttons, Stats */}
          <div className="lg:col-span-7 space-y-6">
            {/* Language Selector Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#1E1E1E] border border-white/10 text-xs font-semibold text-slate-300">
              <Globe className="w-3.5 h-3.5 text-[#E5F107]" />
              <span>{selectedLanguage}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>

            {/* Main Headline */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
                Manage your business <br />
                <span className="text-[#E5F107]">Smarter</span> with{" "}
                <span className="text-white">INCO</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-400 font-medium max-w-xl leading-relaxed">
                All-in-one platform for inventory, sales, customers, and growth. Fast offline-first
                point-of-sale, barcode scanning, and multi-currency financials.
              </p>
            </div>

            {/* Action Buttons: Get Started (#E5F107) & Login (Outline) */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => {
                  sounds.playClick();
                  onEnterApp();
                }}
                className="px-6 sm:px-8 py-3 bg-[#E5F107] hover:bg-[#d2dc00] active:bg-[#c3cd00] text-[#252525] font-black text-sm rounded-xl shadow-lg shadow-[#E5F107]/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                Get Started
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  onOpenAuth("login");
                }}
                className="px-6 sm:px-8 py-3 bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-white/10 hover:border-slate-500 text-white font-bold text-sm rounded-xl transition-all cursor-pointer"
              >
                Login
              </button>
            </div>

            {/* Stats Row matching the image: 10K+, 95%, 24/7, 99.9% */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-white/10">
              {stats.map((stat, idx) => (
                <div key={idx}>
                  <div className="text-xl sm:text-2xl font-black text-white">{stat.value}</div>
                  <div className="text-xs text-slate-400 font-medium mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Isometric / High-Tech Dashboard Mockup Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md bg-[#1E1E1E] border border-white/10 rounded-3xl p-5 shadow-2xl relative overflow-hidden group hover:border-[#E5F107]/50 transition-colors">
              {/* Glowing Ambient Corner Accent */}
              <div className="absolute top-0 right-0 w-44 h-44 bg-[#E5F107]/10 rounded-full blur-2xl pointer-events-none" />

              {/* Mockup Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#E5F107]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-xs font-bold text-slate-300 ml-2">INCO Dashboard</span>
                </div>
                <span className="text-[10px] font-bold text-[#252525] bg-[#E5F107] px-2 py-0.5 rounded-full">
                  Live
                </span>
              </div>

              {/* Mockup Stats */}
              <div className="grid grid-cols-2 gap-3 my-4">
                <div className="p-3 rounded-xl bg-[#252525] border border-white/5">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Today's Sales</div>
                  <div className="text-base font-black text-white mt-0.5">$12,540.00</div>
                  <span className="text-[10px] text-[#E5F107] font-bold">+12.5%</span>
                </div>
                <div className="p-3 rounded-xl bg-[#252525] border border-white/5">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Total Profit</div>
                  <div className="text-base font-black text-white mt-0.5">$4,215.00</div>
                  <span className="text-[10px] text-emerald-400 font-bold">+15.3%</span>
                </div>
              </div>

              {/* Mockup Chart Visual */}
              <div className="h-28 rounded-xl bg-[#252525] border border-white/5 p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                  <span>Sales Trajectory</span>
                  <span className="text-[#E5F107] font-black">320 Orders</span>
                </div>
                {/* SVG Curve */}
                <svg viewBox="0 0 200 60" className="w-full h-14 overflow-visible">
                  <path
                    d="M 10 45 Q 40 10, 80 30 T 150 15 T 190 8"
                    fill="none"
                    stroke="#E5F107"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="190" cy="8" r="3.5" fill="#E5F107" />
                </svg>
              </div>

              {/* Mockup Recent Order Row */}
              <div className="mt-4 p-2.5 rounded-xl bg-[#252525] border border-white/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#E5F107] text-[#252525] flex items-center justify-center font-bold text-[10px]">
                    #1
                  </div>
                  <div>
                    <div className="font-bold text-white">Bluetooth Speaker</div>
                    <div className="text-[10px] text-slate-400">ORD-001 • Completed</div>
                  </div>
                </div>
                <span className="font-black text-white">$240.00</span>
              </div>

              {/* Interactive Direct Launch CTA */}
              <button
                onClick={() => {
                  sounds.playClick();
                  onEnterApp();
                }}
                className="w-full mt-4 py-2.5 rounded-xl bg-[#E5F107] hover:bg-[#d2dc00] active:bg-[#c3cd00] text-[#252525] font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-colors"
              >
                <span>Launch Interactive Counter & POS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
