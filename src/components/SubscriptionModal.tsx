import React, { useState } from "react";
import {
  X,
  Zap,
  CheckCircle2,
  Crown,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Building,
  Coins,
  ArrowRight,
  Clock,
  Sparkles,
  Lock,
} from "lucide-react";
import { UserProfile, PaymentRequest } from "../types";
import { BrandLogo } from "./BrandLogo";
import { sounds } from "../lib/sound";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onSubmitSubscriptionRequest: (req: {
    months: number;
    amount: number;
    paymentMethod: "Mobile Money (M-Pesa/MTN)" | "Credit/Debit Card" | "Bank Transfer" | "Crypto (USDT/BTC)" | "Cash at Counter";
    transactionRef: string;
    proofUrl?: string;
  }) => void;
  onShowToast: (msg: string, type?: "success" | "info" | "error") => void;
}

const MONTHLY_PRICE = 4.99;

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onSubmitSubscriptionRequest,
  onShowToast,
}) => {
  const [selectedMonths, setSelectedMonths] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<
    "Mobile Money (M-Pesa/MTN)" | "Credit/Debit Card" | "Bank Transfer" | "Crypto (USDT/BTC)" | "Cash at Counter"
  >("Mobile Money (M-Pesa/MTN)");
  const [transactionRef, setTransactionRef] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  if (!isOpen) return null;

  const totalAmount = parseFloat((selectedMonths * MONTHLY_PRICE).toFixed(2));
  const isPendingApproval = userProfile.subscription?.status === "pending_approval";
  const isAlreadyActivePro =
    userProfile.identifier?.toLowerCase() === "settaholdings@gmail.com" ||
    userProfile.subscription?.status === "active";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();

    if (!transactionRef.trim()) {
      onShowToast("Please enter your payment reference or receipt code", "info");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedSuccess(true);
      sounds.playSuccess();

      onSubmitSubscriptionRequest({
        months: selectedMonths,
        amount: totalAmount,
        paymentMethod,
        transactionRef: transactionRef.trim(),
      });

      onShowToast("Subscription request submitted! Admin will verify and activate your Pro license.", "success");
    }, 400);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sub-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans text-white"
    >
      <div className="bg-slate-900 border border-yellow-400/80 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative my-auto neon-border-amber">
        {/* Close Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-yellow-400 p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Banner */}
        <div className="flex items-center gap-2 mb-3">
          <BrandLogo size="xs" />
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-yellow-400 text-slate-950 font-sans">
            PRO LICENSE UPGRADE
          </span>
        </div>

        <h2 id="sub-modal-title" className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <span>Unlock INCO Pro Smartshop</span>
          <Crown className="w-5 h-5 text-yellow-400 fill-yellow-400" />
        </h2>
        <p className="text-xs text-slate-300 mt-1">
          Full store intelligence, customer debtors book, AI assistant, and gross profit analytics for only{" "}
          <strong className="text-yellow-400 font-black">$4.99 / month</strong>.
        </p>

        {isAlreadyActivePro ? (
          <div className="my-5 p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-black text-base text-emerald-300">Your Pro License is Active!</h3>
            <p className="text-xs text-slate-300">
              {userProfile.identifier?.toLowerCase() === "settaholdings@gmail.com"
                ? "You have Master Super Admin Lifetime Pro access."
                : `Active until ${
                    userProfile.subscription?.validUntil
                      ? new Date(userProfile.subscription.validUntil).toLocaleDateString()
                      : "Active Subscription"
                  }`}
            </p>
            <button
              onClick={onClose}
              className="mt-2 py-2 px-5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer"
            >
              Continue to Store
            </button>
          </div>
        ) : submittedSuccess || isPendingApproval ? (
          <div className="my-5 p-4 rounded-xl bg-yellow-400/10 border border-yellow-400/40 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-yellow-400/20 text-yellow-400 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6 animate-spin" />
            </div>
            <h3 className="font-black text-base text-yellow-300">Subscription Awaiting Admin Approval</h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
              Your payment request has been routed to the Master Admin Desk (<strong>settaholdings@gmail.com</strong>).
              Your Pro features will activate immediately once approved.
            </p>
            <button
              onClick={onClose}
              className="mt-3 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Close Window
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
            {/* Feature Comparison */}
            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Free Starter ($0)</span>
                <ul className="mt-1.5 space-y-1 text-[11px] text-slate-400">
                  <li className="flex items-center gap-1">✓ Basic Shelf Inventory Count</li>
                  <li className="flex items-center gap-1">✓ Quick Cash POS Checkout</li>
                  <li className="flex items-center gap-1">✓ Barcode Camera Scanner</li>
                </ul>
              </div>

              <div className="border-l border-slate-800 pl-3">
                <span className="text-[10px] font-black uppercase text-yellow-400 tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Pro Full Suite ($4.99/mo)
                </span>
                <ul className="mt-1.5 space-y-1 text-[11px] text-slate-200">
                  <li className="flex items-center gap-1 text-yellow-300 font-medium">★ Customer Debtors Ledger</li>
                  <li className="flex items-center gap-1 text-yellow-300 font-medium">★ Stock Valuation & Gross Margins</li>
                  <li className="flex items-center gap-1 text-yellow-300 font-medium">★ Daily Profit & Sales Analytics</li>
                  <li className="flex items-center gap-1 text-yellow-300 font-medium">★ AI Vision Assistant & WhatsApp Orders</li>
                </ul>
              </div>
            </div>

            {/* Duration Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                Select Subscription Duration ($4.99 per month):
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { months: 1, label: "1 Month", total: 4.99, badge: "Standard" },
                  { months: 3, label: "3 Months", total: 14.97, badge: "Popular" },
                  { months: 6, label: "6 Months", total: 29.94, badge: "Save 5%" },
                  { months: 12, label: "1 Year", total: 49.99, badge: "Best Value" },
                ].map((tier) => (
                  <button
                    key={tier.months}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setSelectedMonths(tier.months);
                    }}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between ${
                      selectedMonths === tier.months
                        ? "bg-yellow-400/15 border-yellow-400 text-yellow-300 shadow-md font-bold"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold">{tier.label}</span>
                    <span className="text-xs font-black text-white mt-0.5">${tier.total}</span>
                    <span className="text-[8px] text-yellow-400/80 font-mono mt-0.5">{tier.badge}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                Payment Channel:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { id: "Mobile Money (M-Pesa/MTN)", label: "Mobile Money", icon: Smartphone },
                  { id: "Credit/Debit Card", label: "Card", icon: CreditCard },
                  { id: "Bank Transfer", label: "Bank Wire", icon: Building },
                  { id: "Crypto (USDT/BTC)", label: "Crypto", icon: Coins },
                ].map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setPaymentMethod(method.id as any);
                      }}
                      className={`p-2 rounded-xl border flex flex-col items-center text-center gap-1 transition-all cursor-pointer ${
                        paymentMethod === method.id
                          ? "bg-slate-800 border-yellow-400 text-yellow-300 font-bold"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <Icon className="w-4 h-4 text-yellow-400" />
                      <span className="text-[10px] leading-tight">{method.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Transaction Reference Input */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Transaction Reference / Confirmation Code: <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="e.g. MPESA-TX-99824, BANK-REF-0912, TXID..."
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-hidden focus:border-yellow-400"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Pay <strong>${totalAmount} USD</strong> and input your receipt or transaction code for Admin verification.
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <div className="text-left">
                <div className="text-[10px] text-slate-400">Total Price:</div>
                <div className="text-base font-black text-yellow-400 font-mono">${totalAmount} USD</div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="py-2.5 px-5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 neon-glow-amber"
              >
                <span>{isSubmitting ? "Submitting..." : "Submit for Admin Approval"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
