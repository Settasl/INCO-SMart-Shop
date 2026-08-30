import React, { useState } from "react";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Check,
  Search,
  DollarSign,
  X,
  CreditCard,
  User,
  Calendar,
  Wallet,
  Clock,
} from "lucide-react";
import { InventoryItem, PaymentStatus, StoreSettings } from "../types";

export interface SalePaymentDetails {
  paymentStatus: PaymentStatus;
  customerName?: string;
  customerPhone?: string;
  amountPaid: number;
  amountOutstanding: number;
  dueDate?: string;
  notes?: string;
}

interface QuickSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  settings: StoreSettings;
  onCompleteSale: (
    cart: Array<{ item: InventoryItem; quantity: number }>,
    totalAmount: number,
    paymentDetails: SalePaymentDetails
  ) => void;
}

export const QuickSaleModal: React.FC<QuickSaleModalProps> = ({
  isOpen,
  onClose,
  items,
  settings,
  onCompleteSale,
}) => {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Array<{ item: InventoryItem; quantity: number }>>([]);

  // Payment Mode: "paid" (Instant Cash), "unpaid" (Full Credit), "partial" (Deposit + Credit)
  const [paymentMode, setPaymentMode] = useState<PaymentStatus>("paid");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [depositAmount, setDepositAmount] = useState<string>("0");
  const [dueDate, setDueDate] = useState("This Weekend");
  const [saleNotes, setSaleNotes] = useState("");

  if (!isOpen) return null;

  const filteredItems = items.filter(
    (i) =>
      i.quantity > 0 &&
      (i.name.toLowerCase().includes(search.toLowerCase()) ||
        (i.barcode && i.barcode.includes(search)) ||
        (i.sku && i.sku.toLowerCase().includes(search)))
  );

  const addToCart = (item: InventoryItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        if (existing.quantity >= item.quantity) return prev;
        return prev.map((c) => (c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const updateCartQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.item.id === itemId) {
            const newQty = c.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > c.item.quantity) return c; // Max stock limit
            return { ...c, quantity: newQty };
          }
          return c;
        })
        .filter(Boolean) as any
    );
  };

  const totalBill = cart.reduce((sum, c) => sum + c.item.sellingPrice * c.quantity, 0);

  // Financial Breakdown calculations
  let actualCashReceived = totalBill;
  let cashOutOnCredit = 0;

  if (paymentMode === "unpaid") {
    actualCashReceived = 0;
    cashOutOnCredit = totalBill;
  } else if (paymentMode === "partial") {
    const depositNum = parseFloat(depositAmount) || 0;
    actualCashReceived = Math.min(totalBill, Math.max(0, depositNum));
    cashOutOnCredit = Math.max(0, totalBill - actualCashReceived);
  }

  const handleCheckout = () => {
    if (cart.length === 0) return;

    if ((paymentMode === "unpaid" || paymentMode === "partial") && !customerName.trim()) {
      alert("Please provide the customer / creditor name to record this item on credit.");
      return;
    }

    const details: SalePaymentDetails = {
      paymentStatus: paymentMode,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      amountPaid: actualCashReceived,
      amountOutstanding: cashOutOnCredit,
      dueDate: paymentMode !== "paid" ? dueDate.trim() : undefined,
      notes: saleNotes.trim() || undefined,
    };

    onCompleteSale(cart, totalBill, details);
    onClose();

    // Reset local states
    setCart([]);
    setPaymentMode("paid");
    setCustomerName("");
    setCustomerPhone("");
    setDepositAmount("0");
    setSaleNotes("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden my-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 rounded-xl text-emerald-900 dark:text-emerald-400 font-bold">
              <ShoppingCart className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Quick Sale & Credit Out POS
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Register sale, select Paid / On Credit, and track cash flow
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden">
          {/* Left: Product Selector */}
          <div className="flex flex-col border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50 dark:bg-slate-850 overflow-hidden">
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search item to sell..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-2 shadow-2xs"
                >
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">{item.name}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      Stock:{" "}
                      <strong className="text-emerald-700 dark:text-emerald-400">
                        {item.quantity} {item.unit}
                      </strong>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-xs text-slate-900 dark:text-white">
                      {settings.currencySymbol}
                      {item.sellingPrice.toFixed(2)}
                    </div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                      + Add
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Cart, Payment Mode & Checkout */}
          <div className="flex flex-col border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-900 justify-between overflow-hidden">
            <div className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
              Sale Cart ({cart.length} items)
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto py-2 space-y-2 max-h-44">
              {cart.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Tap items on the left to add to sale cart
                </div>
              ) : (
                cart.map(({ item, quantity }) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="font-bold text-slate-900 dark:text-white truncate">{item.name}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {settings.currencySymbol}
                        {item.sellingPrice.toFixed(2)} × {quantity}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg">
                        <button
                          onClick={() => updateCartQuantity(item.id, -1)}
                          className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-black text-slate-900 dark:text-white text-xs">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.id, 1)}
                          className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="font-black text-slate-900 dark:text-white w-16 text-right font-mono">
                        {settings.currencySymbol}
                        {(item.sellingPrice * quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Payment Mode Selector: Paid vs Credit vs Partial */}
            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Payment Status:
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setPaymentMode("paid")}
                    className={`py-1.5 px-2 rounded-xl transition-all flex flex-col items-center justify-center gap-0.5 ${
                      paymentMode === "paid"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    <span className="text-[11px] leading-tight">💵 Paid in Full</span>
                    <span className="text-[9px] opacity-80 font-normal">Cash at Hand</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode("unpaid")}
                    className={`py-1.5 px-2 rounded-xl transition-all flex flex-col items-center justify-center gap-0.5 ${
                      paymentMode === "unpaid"
                        ? "bg-rose-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    <span className="text-[11px] leading-tight">🔴 On Credit</span>
                    <span className="text-[9px] opacity-80 font-normal">Unpaid / Debt</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode("partial")}
                    className={`py-1.5 px-2 rounded-xl transition-all flex flex-col items-center justify-center gap-0.5 ${
                      paymentMode === "partial"
                        ? "bg-amber-500 text-slate-950 shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    <span className="text-[11px] leading-tight">🟡 Part Paid</span>
                    <span className="text-[9px] opacity-80 font-normal">Deposit + Credit</span>
                  </button>
                </div>
              </div>

              {/* Creditor / Debtor Input Fields (shown when On Credit or Part Paid) */}
              {paymentMode !== "paid" && (
                <div className="p-2.5 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/60 space-y-2 text-xs animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-amber-950 dark:text-amber-200 mb-0.5">
                        Customer / Creditor Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Papa Jude, Mama Sarah"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-2.5 py-1 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-800 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-amber-950 dark:text-amber-200 mb-0.5">
                        Phone (for WhatsApp/SMS)
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. +234 803 123 4567"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-2.5 py-1 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-800 rounded-lg text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {paymentMode === "partial" && (
                      <div>
                        <label className="block text-[10px] font-bold text-amber-950 dark:text-amber-200 mb-0.5">
                          Deposit Paid Now ({settings.currencySymbol})
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={totalBill}
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          className="w-full px-2.5 py-1 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-800 rounded-lg font-mono font-bold text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-bold text-amber-950 dark:text-amber-200 mb-0.5">
                        Payment Promised Due
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Friday, End of Month"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full px-2.5 py-1 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-800 rounded-lg text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Total Summary & Cash Flow Impact */}
              <div className="bg-slate-100 dark:bg-slate-800/90 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-600 dark:text-slate-400 uppercase">
                    Total Sale Bill:
                  </span>
                  <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                    {settings.currencySymbol}
                    {totalBill.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Cash to Hand:</span>
                  </span>
                  <span className="font-black text-emerald-700 dark:text-emerald-400 font-mono">
                    {settings.currencySymbol}
                    {actualCashReceived.toFixed(2)}
                  </span>
                </div>

                {cashOutOnCredit > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Out on Credit:</span>
                    </span>
                    <span className="font-black text-rose-600 dark:text-rose-400 font-mono">
                      {settings.currencySymbol}
                      {cashOutOnCredit.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setCart([])}
                  className="px-3 py-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Clear
                </button>
                <button
                  disabled={cart.length === 0}
                  onClick={handleCheckout}
                  className={`flex-1 py-2.5 text-white font-black text-xs rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 ${
                    paymentMode === "paid"
                      ? "bg-emerald-600 hover:bg-emerald-500"
                      : paymentMode === "unpaid"
                      ? "bg-rose-600 hover:bg-rose-500"
                      : "bg-amber-600 hover:bg-amber-500"
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>
                    {paymentMode === "paid"
                      ? `Confirm Cash Sale (${settings.currencySymbol}${totalBill.toFixed(2)})`
                      : paymentMode === "unpaid"
                      ? `Give on Credit (${settings.currencySymbol}${totalBill.toFixed(2)})`
                      : `Confirm Part Payment & Credit`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
