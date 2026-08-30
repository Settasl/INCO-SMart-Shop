import React, { useEffect } from "react";
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
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { SettaLionLogo } from "./SettaLionLogo";
import { sounds } from "../lib/sound";

interface SplashScreenProps {
  onEnterApp: () => void;
  onOpenAuth: () => void;
  userEmailOrPhone?: string | null;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onEnterApp,
  onOpenAuth,
  userEmailOrPhone,
}) => {
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

  return (
    <div
      role="region"
      aria-label="Welcome to INCO Smart Shop"
      className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto selection:bg-amber-400 selection:text-slate-950 font-sans"
    >
      {/* Yellow/Amber Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Centered Compact Welcome Card */}
      <motion.div
        initial={{ y: 15, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative z-10 text-center flex flex-col items-center gap-4"
      >
        {/* App Icon Tile */}
        <div className="flex flex-col items-center">
          <BrandLogo size="md" theme="yellowAppIcon" animated={true} />
        </div>

        {/* Header & Subtitle */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-[10px] font-black uppercase tracking-wider">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Retail Inventory & Quick Sales</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Welcome to <span className="text-amber-400">INCO</span>
          </h1>
          <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-xs mx-auto">
            Fast, accurate barcode tallying and instant cash sales for retail stores.
          </p>
        </div>

        {/* 3 Compact Feature Pills */}
        <div className="grid grid-cols-3 gap-2 w-full pt-1">
          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col items-center text-center">
            <ScanLine className="w-4 h-4 text-amber-400 mb-1" />
            <span className="text-[10px] font-bold text-slate-200 leading-tight">Quick Count</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col items-center text-center">
            <Box className="w-4 h-4 text-emerald-400 mb-1" />
            <span className="text-[10px] font-bold text-slate-200 leading-tight">1-Tap Sale</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col items-center text-center">
            <CloudUpload className="w-4 h-4 text-blue-400 mb-1" />
            <span className="text-[10px] font-bold text-slate-200 leading-tight">Cloud Sync</span>
          </div>
        </div>

        {/* Launch CTA Button */}
        <div className="w-full pt-1 space-y-2">
          <button
            onClick={() => {
              sounds.playSuccess();
              sounds.triggerHaptic(20);
              onEnterApp();
            }}
            className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-400/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Launch Stock Counter</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>

          {/* Account status or Sign in */}
          {userEmailOrPhone ? (
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-amber-400 font-semibold pt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Signed in as {userEmailOrPhone}</span>
            </div>
          ) : (
            <button
              onClick={() => {
                sounds.playClick();
                onOpenAuth();
              }}
              className="text-[11px] font-bold text-slate-400 hover:text-amber-400 transition-colors cursor-pointer block mx-auto"
            >
              Sign In or Register Store Account →
            </button>
          )}
        </div>

        {/* Subtle Footer Tag */}
        <div className="pt-2 border-t border-slate-800/80 w-full flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <SettaLionLogo size="sm" />
            <span>Setta SL Ltd</span>
          </div>
          <span className="font-mono text-amber-400/90 font-bold">INCO v2.0</span>
        </div>
      </motion.div>
    </div>
  );
};
