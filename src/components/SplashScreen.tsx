import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  Check,
  ScanLine,
  Box,
  CloudUpload,
  Zap,
  Shield,
  Sparkles,
  UserPlus,
  LogIn,
  Plus,
  Minus,
  TrendingUp,
  Lock,
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { SettaLionLogo } from "./SettaLionLogo";
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
  // Interactive Live Counter Demo Widget on Welcome Page
  const [demoCount, setDemoCount] = useState<number>(24);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        sounds.playSuccess();
        sounds.triggerHaptic(20);
        onEnterApp();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onEnterApp]);

  const handleDemoIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playStockAdd();
    sounds.triggerHaptic(15);
    setDemoCount((prev) => prev + 1);
  };

  const handleDemoDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playStockRemove();
    sounds.triggerHaptic(15);
    setDemoCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <div
      role="region"
      aria-label="Welcome to INCO Smart Shop"
      className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col items-center justify-center p-3 sm:p-6 overflow-y-auto selection:bg-amber-400 selection:text-slate-950 font-sans"
    >
      {/* Yellow/Amber Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[250px] h-[250px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Centered Welcome Hero Card */}
      <motion.div
        initial={{ y: 20, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-lg bg-slate-900/95 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative z-10 text-center flex flex-col items-center gap-3.5 my-auto"
      >
        {/* App Icon Tile & Super Badge */}
        <div className="flex flex-col items-center gap-1.5">
          <BrandLogo size="md" theme="yellowAppIcon" animated={true} />
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-[10px] font-black uppercase tracking-wider">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Smart Retail & Instant POS Operating System</span>
          </div>
        </div>

        {/* Header & Subtitle */}
        <div className="space-y-1 max-w-sm">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Welcome to <span className="text-amber-400">INCO Smart Shop</span>
          </h1>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            High-speed inventory counting, 1-tap cash sales, valuation margins, and offline-first kiosk management.
          </p>
        </div>

        {/* Live Interactive Counter Preview Demo */}
        <div className="w-full bg-slate-950/90 border border-amber-400/40 rounded-2xl p-3 text-left relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] uppercase font-black text-amber-400 tracking-wider">
                Try Live Counter Demo
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400">
              SKU-BEV-001
            </span>
          </div>

          <div className="flex items-center justify-between bg-slate-900/90 p-2 rounded-xl border border-slate-800">
            <div>
              <div className="text-xs font-black text-white">Cold Energy Drink (330ml)</div>
              <div className="text-[10px] text-slate-400">Unit Cost: $1.20 • Retail: $2.00</div>
            </div>

            {/* + / - Stepper */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={handleDemoDecrement}
                className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-amber-400 active:text-slate-950 text-white flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
                title="Subtract 1"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-7 text-center font-mono font-black text-sm text-amber-400">
                {demoCount}
              </span>
              <button
                type="button"
                onClick={handleDemoIncrement}
                className="w-6 h-6 rounded-lg bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs cursor-pointer transition-colors shadow-xs"
                title="Add 1"
              >
                <Plus className="w-3 h-3 stroke-[3]" />
              </button>
            </div>
          </div>
        </div>

        {/* 4 Feature Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full pt-0.5">
          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col items-center text-center">
            <ScanLine className="w-3.5 h-3.5 text-amber-400 mb-1" />
            <span className="text-[10px] font-bold text-slate-200 leading-tight">Rapid Count</span>
            <span className="text-[8px] text-slate-400">120 scans/min</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col items-center text-center">
            <Box className="w-3.5 h-3.5 text-emerald-400 mb-1" />
            <span className="text-[10px] font-bold text-slate-200 leading-tight">1-Tap POS</span>
            <span className="text-[8px] text-slate-400">Cash & Mobile</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col items-center text-center">
            <TrendingUp className="w-3.5 h-3.5 text-yellow-400 mb-1" />
            <span className="text-[10px] font-bold text-slate-200 leading-tight">Valuation</span>
            <span className="text-[8px] text-slate-400">Profit Margins</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col items-center text-center">
            <CloudUpload className="w-3.5 h-3.5 text-blue-400 mb-1" />
            <span className="text-[10px] font-bold text-slate-200 leading-tight">Offline Sync</span>
            <span className="text-[8px] text-slate-400">Zero Data Loss</span>
          </div>
        </div>

        {/* Action Buttons: Sign In / Sign Up / Launch Demo */}
        <div className="w-full pt-1 space-y-2">
          {userEmailOrPhone ? (
            /* Signed in already */
            <div className="space-y-2">
              <button
                onClick={() => {
                  sounds.playSuccess();
                  sounds.triggerHaptic(20);
                  onEnterApp();
                }}
                className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-400/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Enter Store Counter</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>

              <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
                <span className="text-amber-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {userEmailOrPhone}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onOpenAuth("login");
                  }}
                  className="hover:text-amber-400 underline cursor-pointer"
                >
                  Switch Account
                </button>
              </div>
            </div>
          ) : (
            /* Not signed in yet: Provide primary Sign In and Register CTAs */
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onOpenAuth("login");
                  }}
                  className="py-2.5 px-3 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onOpenAuth("signup");
                  }}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-750 active:bg-slate-700 text-white font-black text-xs rounded-xl border border-slate-700 hover:border-amber-400/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Create Account</span>
                </button>
              </div>

              {/* Guest / Instant Preview Launch */}
              <button
                type="button"
                onClick={() => {
                  sounds.playSuccess();
                  sounds.triggerHaptic(20);
                  onEnterApp();
                }}
                className="w-full py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Continue as Guest Demo Store</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </button>
            </div>
          )}
        </div>

        {/* Footer info & Master Admin Hint */}
        <div className="pt-2 border-t border-slate-800/80 w-full flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <SettaLionLogo size="sm" />
            <span>Setta SL Ltd</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-amber-400/90 font-bold">INCO v2.0</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

