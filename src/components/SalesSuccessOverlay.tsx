import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Zap, ShoppingBag, Sparkles, DollarSign, ArrowRight, X } from "lucide-react";
import confetti from "canvas-confetti";
import { sounds } from "../lib/sound";

export interface SaleSuccessInfo {
  totalAmount: number;
  currencySymbol: string;
  itemCount: number;
  customerName?: string;
  paymentStatus?: string;
  notes?: string;
}

interface SalesSuccessOverlayProps {
  isOpen: boolean;
  saleInfo: SaleSuccessInfo | null;
  onClose: () => void;
}

export const SalesSuccessOverlay: React.FC<SalesSuccessOverlayProps> = ({
  isOpen,
  saleInfo,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Trigger cash register sound
      sounds.playCashSale();
      sounds.triggerHaptic([30, 50, 30]);

      // Fire vibrant multi-angle confetti blast
      try {
        // Center burst
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6, x: 0.5 },
          colors: ["#FBBF24", "#F59E0B", "#10B981", "#34D399", "#FFFFFF"],
        });

        // Left cannon
        setTimeout(() => {
          confetti({
            particleCount: 40,
            angle: 60,
            spread: 55,
            origin: { x: 0.1, y: 0.7 },
            colors: ["#FBBF24", "#F59E0B", "#10B981"],
          });
        }, 150);

        // Right cannon
        setTimeout(() => {
          confetti({
            particleCount: 40,
            angle: 120,
            spread: 55,
            origin: { x: 0.9, y: 0.7 },
            colors: ["#FBBF24", "#F59E0B", "#10B981"],
          });
        }, 250);
      } catch (e) {
        console.error("Confetti trigger error", e);
      }

      // Auto close after 3.8 seconds if user doesn't click
      const timer = setTimeout(() => {
        onClose();
      }, 3800);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !saleInfo) return null;

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-label="Sale Success Animation"
        className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4"
      >
        {/* Semi-transparent dark ambient backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs pointer-events-auto"
          onClick={onClose}
        />

        {/* Animated Celebration Card */}
        <motion.div
          initial={{ scale: 0.75, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.85, y: -20, opacity: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative z-10 w-full max-w-sm bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 shadow-2xl shadow-amber-400/20 text-center pointer-events-auto overflow-hidden font-sans"
        >
          {/* Top Golden Light Burst */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Animated Golden Checkmark Emblem */}
          <div className="relative mx-auto mb-3 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.4, times: [0, 0.7, 1] }}
              className="w-16 h-16 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-400/40 relative z-10"
            >
              <Check className="w-9 h-9 stroke-[3.5]" />
            </motion.div>

            {/* Glowing Pulse Rings */}
            <motion.div
              animate={{ scale: [1, 1.4, 1.8], opacity: [0.8, 0.3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
              className="absolute w-16 h-16 rounded-full bg-amber-400/40"
            />
            <motion.div
              animate={{ scale: [1, 1.25, 1.5], opacity: [0.6, 0.2, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
              className="absolute w-16 h-16 rounded-full bg-emerald-400/30"
            />
          </div>

          {/* Badge & Title */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase tracking-wider mb-1.5 shadow-xs">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Instant Sale Completed</span>
          </div>

          <h3 className="text-xl font-black text-white tracking-tight">
            Cash Sale Recorded!
          </h3>

          {/* Total Amount High-Contrast Display */}
          <div className="my-3 py-2.5 px-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center gap-1">
            <span className="text-sm font-bold text-amber-400">
              {saleInfo.currencySymbol}
            </span>
            <span className="text-3xl font-black text-amber-400 tracking-tight font-mono">
              {saleInfo.totalAmount.toFixed(2)}
            </span>
          </div>

          {/* Items & Customer Breakdown */}
          <div className="space-y-1 text-xs text-slate-300 mb-4 bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                Items Sold:
              </span>
              <span className="font-bold text-white">
                {saleInfo.itemCount} {saleInfo.itemCount === 1 ? "unit" : "units"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Customer:
              </span>
              <span className="font-bold text-white truncate max-w-[150px]">
                {saleInfo.customerName || "Walk-in Cash"}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-700/60 text-slate-400">
              <span>Stock Ledger:</span>
              <span className="text-emerald-400 font-bold">Deducted Live</span>
            </div>
          </div>

          {/* Dismiss CTA */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Done & Next Sale</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
