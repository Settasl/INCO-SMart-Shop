import React, { useState, useMemo } from "react";
import {
  X,
  CreditCard,
  Search,
  Plus,
  DollarSign,
  Calendar,
  Phone,
  User,
  CheckCircle2,
  AlertCircle,
  Clock,
  MessageCircle,
  Share2,
  ChevronRight,
  Trash2,
  Wallet,
  ArrowUpRight,
  TrendingDown,
  FileSpreadsheet,
  Copy,
  Check,
  Package,
} from "lucide-react";
import { CreditRecord, InventoryItem, PaymentEntry, StoreSettings } from "../types";

interface CreditBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  credits: CreditRecord[];
  items: InventoryItem[];
  settings: StoreSettings;
  cashAtHand: number;
  onRecordPayment: (creditId: string, amount: number, note?: string) => void;
  onMarkFullyPaid: (creditId: string, note?: string) => void;
  onCreateCredit: (credit: Omit<CreditRecord, "id" | "date" | "status" | "amountOutstanding" | "paymentHistory">) => void;
  onDeleteCredit: (creditId: string) => void;
  onShowToast: (message: string, type?: "success" | "info") => void;
}

type CreditFilter = "all" | "unpaid" | "partial" | "paid";

export const CreditBookModal: React.FC<CreditBookModalProps> = ({
  isOpen,
  onClose,
  credits,
  items,
  settings,
  cashAtHand,
  onRecordPayment,
  onMarkFullyPaid,
  onCreateCredit,
  onDeleteCredit,
  onShowToast,
}) => {
  const [filter, setFilter] = useState<CreditFilter>("all");
  const [search, setSearch] = useState("");

  // Payment Recording Modal State
  const [activePaymentRecord, setActivePaymentRecord] = useState<CreditRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentNote, setPaymentNote] = useState<string>("");

  // Manual Add Credit Modal State
  const [isAddCreditOpen, setIsAddCreditOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newDueDate, setNewDueDate] = useState("This Weekend");
  const [newNotes, setNewNotes] = useState("");
  const [newDepositPaid, setNewDepositPaid] = useState<string>("0");
  const [selectedCreditItems, setSelectedCreditItems] = useState<
    Array<{ item: InventoryItem; quantity: number }>
  >([]);
  const [itemSearch, setItemSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Key Financial Metrics
  const totalCashOutOnCredit = useMemo(() => {
    return credits
      .filter((c) => c.status !== "paid")
      .reduce((sum, c) => sum + c.amountOutstanding, 0);
  }, [credits]);

  const totalCreditIssuedAllTime = useMemo(() => {
    return credits.reduce((sum, c) => sum + c.totalAmount, 0);
  }, [credits]);

  const totalCreditRecovered = useMemo(() => {
    return credits.reduce((sum, c) => sum + c.amountPaid, 0);
  }, [credits]);

  const activeDebtorsCount = useMemo(() => {
    return credits.filter((c) => c.status !== "paid" && c.amountOutstanding > 0).length;
  }, [credits]);

  // Filtered Credits
  const filteredCredits = useMemo(() => {
    return credits.filter((c) => {
      // Filter status
      if (filter === "unpaid" && c.status !== "unpaid") return false;
      if (filter === "partial" && c.status !== "partial") return false;
      if (filter === "paid" && c.status !== "paid") return false;

      // Filter search
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      const matchName = c.customerName.toLowerCase().includes(q);
      const matchPhone = c.customerPhone && c.customerPhone.toLowerCase().includes(q);
      const matchNotes = c.notes && c.notes.toLowerCase().includes(q);
      const matchItem = c.items && c.items.some((i) => i.itemName.toLowerCase().includes(q));

      return matchName || matchPhone || matchNotes || matchItem;
    });
  }, [credits, filter, search]);

  // Handle Record Payment Submit
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePaymentRecord) return;
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      onShowToast("Please enter a valid payment amount", "info");
      return;
    }

    if (amt > activePaymentRecord.amountOutstanding) {
      if (
        !confirm(
          `The entered amount (${settings.currencySymbol}${amt.toFixed(2)}) is higher than the remaining balance (${settings.currencySymbol}${activePaymentRecord.amountOutstanding.toFixed(2)}). Record full settlement of ${settings.currencySymbol}${activePaymentRecord.amountOutstanding.toFixed(2)}?`
        )
      ) {
        return;
      }
    }

    onRecordPayment(activePaymentRecord.id, amt, paymentNote.trim() || "Cash repayment received");
    setActivePaymentRecord(null);
    setPaymentAmount("");
    setPaymentNote("");
  };

  // Handle New Manual Credit Creation
  const handleCreateNewCreditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) {
      onShowToast("Please enter the customer / creditor name", "info");
      return;
    }

    if (selectedCreditItems.length === 0) {
      onShowToast("Please add at least one item given on credit", "info");
      return;
    }

    const totalBill = selectedCreditItems.reduce(
      (sum, c) => sum + c.item.sellingPrice * c.quantity,
      0
    );
    const deposit = parseFloat(newDepositPaid) || 0;

    onCreateCredit({
      customerName: newCustomerName.trim(),
      customerPhone: newCustomerPhone.trim(),
      totalAmount: totalBill,
      amountPaid: Math.min(deposit, totalBill),
      dueDate: newDueDate.trim() || "Promised soon",
      notes: newNotes.trim(),
      items: selectedCreditItems.map((c) => ({
        itemId: c.item.id,
        itemName: c.item.name,
        quantity: c.quantity,
        unitPrice: c.item.sellingPrice,
        unit: c.item.unit,
      })),
    });

    // Reset
    setIsAddCreditOpen(false);
    setNewCustomerName("");
    setNewCustomerPhone("");
    setNewNotes("");
    setNewDepositPaid("0");
    setSelectedCreditItems([]);
  };

  // Copy or send WhatsApp reminder
  const generateWhatsAppReminder = (credit: CreditRecord) => {
    const itemListStr = credit.items.map((i) => `${i.quantity}x ${i.itemName}`).join(", ");
    const dateFormatted = new Date(credit.date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

    const msg = `Hello ${credit.customerName}! Gentle reminder from *${settings.storeName}* regarding your outstanding balance of *${settings.currencySymbol}${credit.amountOutstanding.toFixed(2)}* (for ${itemListStr || "purchases"} on ${dateFormatted}). Due date: ${credit.dueDate || "soon"}. Thank you for your custom!`;

    if (credit.customerPhone) {
      const cleanPhone = credit.customerPhone.replace(/[^0-9]/g, "");
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
      window.open(url, "_blank");
    } else {
      navigator.clipboard.writeText(msg);
      setCopiedId(credit.id);
      setTimeout(() => setCopiedId(null), 3000);
      onShowToast("Reminder message copied to clipboard!");
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "Customer Name",
      "Phone",
      "Date Credited",
      "Due Date",
      "Status",
      "Total Amount",
      "Amount Paid",
      "Amount Outstanding",
      "Items Given",
      "Notes",
    ];

    const rows = credits.map((c) => [
      `"${c.customerName.replace(/"/g, '""')}"`,
      `"${c.customerPhone || ""}"`,
      new Date(c.date).toISOString().slice(0, 10),
      `"${c.dueDate || ""}"`,
      c.status.toUpperCase(),
      c.totalAmount.toFixed(2),
      c.amountPaid.toFixed(2),
      c.amountOutstanding.toFixed(2),
      `"${c.items.map((i) => `${i.quantity} ${i.itemName}`).join("; ").replace(/"/g, '""')}"`,
      `"${(c.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Inco_Credit_Book_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast("Debtors list exported to CSV!");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col my-4 max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 dark:bg-slate-950 text-white border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-yellow-400 border border-amber-500/30">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">Credit Book & Debt Ledger</h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-yellow-400 text-slate-950">
                  Cash vs Credit
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Keep track of cash at hand and money out on credit given to customers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddCreditOpen(true)}
              className="px-3 py-1.5 bg-yellow-400 text-slate-950 font-black text-xs rounded-xl hover:bg-yellow-300 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Give Item on Credit</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/50 dark:bg-slate-900/50">
          {/* Top Key Financial Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* 1. Cash at Hand (Collected) */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-900/50 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-400">
                  Cash at Hand
                </span>
                <div className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {settings.currencySymbol}
                {cashAtHand.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Physical cash received & collected
              </div>
            </div>

            {/* 2. Cash Out on Credit (Owed to Store) */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/50 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-wider text-amber-700 dark:text-amber-400">
                  Cash Out on Credit
                </span>
                <div className="p-1 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
                {settings.currencySymbol}
                {totalCashOutOnCredit.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Total unpaid customer debt balance
              </div>
            </div>

            {/* 3. Active Debtors */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-wider text-slate-700 dark:text-slate-300">
                  Active Debtors
                </span>
                <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  <User className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {activeDebtorsCount}{" "}
                <span className="text-xs font-normal text-slate-400">customers</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Creditors with pending balances
              </div>
            </div>

            {/* 4. Recovered / Settled */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-wider text-blue-700 dark:text-blue-400">
                  Credit Recovered
                </span>
                <div className="p-1 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">
                {settings.currencySymbol}
                {totalCreditRecovered.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Total repayments collected
              </div>
            </div>
          </div>

          {/* Search, Filter Tabs & Export Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs font-bold">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
                  filter === "all"
                    ? "bg-slate-900 dark:bg-yellow-400 text-white dark:text-slate-950"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                All Records ({credits.length})
              </button>
              <button
                onClick={() => setFilter("unpaid")}
                className={`px-3 py-1.5 rounded-lg transition-all shrink-0 flex items-center gap-1.5 ${
                  filter === "unpaid"
                    ? "bg-rose-600 text-white"
                    : "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>Unpaid ({credits.filter((c) => c.status === "unpaid").length})</span>
              </button>
              <button
                onClick={() => setFilter("partial")}
                className={`px-3 py-1.5 rounded-lg transition-all shrink-0 flex items-center gap-1.5 ${
                  filter === "partial"
                    ? "bg-amber-500 text-slate-950 font-black"
                    : "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Partially Paid ({credits.filter((c) => c.status === "partial").length})</span>
              </button>
              <button
                onClick={() => setFilter("paid")}
                className={`px-3 py-1.5 rounded-lg transition-all shrink-0 flex items-center gap-1.5 ${
                  filter === "paid"
                    ? "bg-emerald-600 text-white"
                    : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Paid in Full ({credits.filter((c) => c.status === "paid").length})</span>
              </button>
            </div>

            {/* Search Input & CSV Export */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search customer, phone, item..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              <button
                onClick={handleExportCSV}
                className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shrink-0"
                title="Export Debtors to CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          {/* List of Creditors / Debtors */}
          {filteredCredits.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-yellow-400 flex items-center justify-center mx-auto">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
                No credit records found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {search
                  ? "No matching customer records for your search terms."
                  : "No credit or debt transactions in this category. Click '+ Give Item on Credit' to log when a customer takes goods on credit."}
              </p>
              <button
                onClick={() => setIsAddCreditOpen(true)}
                className="px-4 py-2 bg-yellow-400 text-slate-950 font-black text-xs rounded-xl hover:bg-yellow-300 shadow-sm"
              >
                + Give Item on Credit
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredCredits.map((credit) => {
                const isPaid = credit.status === "paid";
                const isPartial = credit.status === "partial";
                const pctPaid =
                  credit.totalAmount > 0
                    ? Math.min(100, Math.round((credit.amountPaid / credit.totalAmount) * 100))
                    : 0;

                const dateFormatted = new Date(credit.date).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                return (
                  <div
                    key={credit.id}
                    className={`bg-white dark:bg-slate-800 rounded-2xl border p-4 shadow-2xs flex flex-col justify-between transition-all ${
                      isPaid
                        ? "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10"
                        : isPartial
                        ? "border-amber-300 dark:border-amber-800/80"
                        : "border-rose-300 dark:border-rose-900/80"
                    }`}
                  >
                    {/* Top Row: Customer Info & Status Badge */}
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                              isPaid
                                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                                : isPartial
                                ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                                : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                            }`}
                          >
                            {credit.customerName.slice(0, 2).toUpperCase()}
                          </div>

                          <div>
                            <h4 className="font-black text-sm text-slate-900 dark:text-white leading-snug">
                              {credit.customerName}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                              {credit.customerPhone && (
                                <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span>{credit.customerPhone}</span>
                                </span>
                              )}
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span>{dateFormatted}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Tag */}
                        <div className="text-right shrink-0">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isPaid
                                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                                : isPartial
                                ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                                : "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                            }`}
                          >
                            {isPaid ? "Paid in Full" : isPartial ? "Partially Paid" : "Unpaid / Credit"}
                          </span>
                          {credit.dueDate && !isPaid && (
                            <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 mt-0.5 flex items-center justify-end gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Due: {credit.dueDate}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Items Taken On Credit */}
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs mb-3">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <Package className="w-3 h-3 text-slate-400" />
                          <span>Items Taken on Credit ({credit.items.length})</span>
                        </div>
                        <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                          {credit.items.map((it, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-slate-700 dark:text-slate-300 text-[11px]"
                            >
                              <span className="font-semibold truncate max-w-[200px] sm:max-w-xs">
                                {it.quantity} {it.unit || "x"} {it.itemName}
                              </span>
                              <span className="font-mono font-bold shrink-0">
                                {settings.currencySymbol}
                                {(it.unitPrice * it.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {credit.notes && (
                          <div className="mt-1.5 pt-1.5 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 italic">
                            "{credit.notes}"
                          </div>
                        )}
                      </div>

                      {/* Payment Balance & Progress */}
                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-500 dark:text-slate-400">
                            Total Bill: {settings.currencySymbol}
                            {credit.totalAmount.toFixed(2)}
                          </span>
                          <span className="text-emerald-600 dark:text-emerald-400">
                            Paid: {settings.currencySymbol}
                            {credit.amountPaid.toFixed(2)} ({pctPaid}%)
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isPaid ? "bg-emerald-500" : isPartial ? "bg-amber-500" : "bg-rose-500"
                            }`}
                            style={{ width: `${pctPaid}%` }}
                          ></div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                            Cash Out on Credit (Owed):
                          </span>
                          <span
                            className={`font-black text-sm ${
                              isPaid
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {settings.currencySymbol}
                            {credit.amountOutstanding.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Payment History Preview (if any) */}
                      {credit.paymentHistory && credit.paymentHistory.length > 0 && (
                        <div className="mb-3 text-[10px] text-slate-500 dark:text-slate-400">
                          <span className="font-bold text-slate-600 dark:text-slate-300">
                            Repayment History ({credit.paymentHistory.length}):
                          </span>{" "}
                          {credit.paymentHistory
                            .slice(-2)
                            .map(
                              (p) =>
                                `+${settings.currencySymbol}${p.amount.toFixed(2)} on ${new Date(
                                  p.date
                                ).toLocaleDateString(undefined, { month: "numeric", day: "numeric" })}`
                            )
                            .join(", ")}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        {!isPaid && (
                          <>
                            <button
                              onClick={() => {
                                setActivePaymentRecord(credit);
                                setPaymentAmount(credit.amountOutstanding.toString());
                                setPaymentNote("Cash repayment received");
                              }}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1"
                              title="Receive Cash Payment"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Receive Cash</span>
                            </button>

                            <button
                              onClick={() => onMarkFullyPaid(credit.id, "Marked fully paid via cash")}
                              className="px-2 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold text-xs rounded-xl transition-colors"
                              title="Mark 100% Paid"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">100% Paid</span>
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => generateWhatsAppReminder(credit)}
                          className="px-2 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-1"
                          title="Send WhatsApp or Copy SMS Reminder"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>
                            {copiedId === credit.id ? "Copied!" : credit.customerPhone ? "WhatsApp" : "Reminder"}
                          </span>
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          if (confirm(`Delete credit record for "${credit.customerName}"?`)) {
                            onDeleteCredit(credit.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* --- SUB-MODAL 1: RECORD CASH PAYMENT MODAL --- */}
      {activePaymentRecord && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Receive Cash Repayment
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Adds cash to Cash at Hand and reduces debt
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActivePaymentRecord(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400">Customer Creditor</div>
                <div className="font-black text-sm text-slate-900 dark:text-white">
                  {activePaymentRecord.customerName}
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">
                    Current Outstanding:
                  </span>
                  <span className="font-black text-rose-600 dark:text-rose-400 text-sm">
                    {settings.currencySymbol}
                    {activePaymentRecord.amountOutstanding.toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cash Amount Received Now ({settings.currencySymbol}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  autoFocus
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-base font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  placeholder="0.00"
                />

                {/* Quick Payment Preset Buttons */}
                <div className="flex items-center gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPaymentAmount(activePaymentRecord.amountOutstanding.toFixed(2))
                    }
                    className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-100"
                  >
                    Full Balance ({settings.currencySymbol}
                    {activePaymentRecord.amountOutstanding.toFixed(2)})
                  </button>
                  {activePaymentRecord.amountOutstanding >= 10 && (
                    <button
                      type="button"
                      onClick={() => setPaymentAmount("10.00")}
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200"
                    >
                      {settings.currencySymbol}10
                    </button>
                  )}
                  {activePaymentRecord.amountOutstanding >= 20 && (
                    <button
                      type="button"
                      onClick={() => setPaymentAmount("20.00")}
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200"
                    >
                      {settings.currencySymbol}20
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Note / Remark
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="e.g. Cash brought to shop, transfer, etc."
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActivePaymentRecord(null)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Confirm Cash Receipt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- SUB-MODAL 2: MANUAL GIVE ITEM ON CREDIT MODAL --- */}
      {isAddCreditOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl my-6 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-yellow-400 rounded-xl font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Give Item on Credit (New Debt Entry)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Record customer debt, items taken, and deposit payment
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddCreditOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateNewCreditSubmit}
              className="space-y-3.5 flex-1 overflow-y-auto pr-1"
            >
              {/* Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Customer / Creditor Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="e.g. Papa Jude, Nurse Ngozi, Brother Dan"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Customer Phone (for WhatsApp/SMS)
                  </label>
                  <input
                    type="tel"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    placeholder="e.g. +234 803 000 0000"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Items Picker */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Items Given on Credit ({selectedCreditItems.length} added) *
                </label>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search item to add to credit..."
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                  />
                </div>

                {/* Search item matches */}
                {itemSearch.trim() && (
                  <div className="max-h-32 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                    {items
                      .filter((i) => i.name.toLowerCase().includes(itemSearch.toLowerCase()))
                      .slice(0, 5)
                      .map((it) => (
                        <div
                          key={it.id}
                          onClick={() => {
                            setSelectedCreditItems((prev) => {
                              const exist = prev.find((p) => p.item.id === it.id);
                              if (exist) {
                                return prev.map((p) =>
                                  p.item.id === it.id ? { ...p, quantity: p.quantity + 1 } : p
                                );
                              }
                              return [...prev, { item: it, quantity: 1 }];
                            });
                            setItemSearch("");
                          }}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {it.name}
                            </span>{" "}
                            <span className="text-[10px] text-slate-500">
                              (Stock: {it.quantity} {it.unit})
                            </span>
                          </div>
                          <span className="font-bold text-emerald-600">
                            {settings.currencySymbol}
                            {it.sellingPrice.toFixed(2)}
                          </span>
                        </div>
                      ))}
                  </div>
                )}

                {/* Selected credit items list */}
                {selectedCreditItems.length > 0 && (
                  <div className="space-y-1 pt-1">
                    {selectedCreditItems.map(({ item, quantity }) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        <span className="font-bold text-slate-900 dark:text-white truncate max-w-xs">
                          {item.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => {
                              const q = parseInt(e.target.value) || 1;
                              setSelectedCreditItems((prev) =>
                                prev.map((p) => (p.item.id === item.id ? { ...p, quantity: q } : p))
                              );
                            }}
                            className="w-14 px-2 py-0.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-center font-bold"
                          />
                          <span className="font-mono font-bold w-16 text-right">
                            {settings.currencySymbol}
                            {(item.sellingPrice * quantity).toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedCreditItems((prev) =>
                                prev.filter((p) => p.item.id !== item.id)
                              )
                            }
                            className="text-slate-400 hover:text-rose-600 p-0.5"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Deposit, Due Date & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cash Deposit Paid Now ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newDepositPaid}
                    onChange={(e) => setNewDepositPaid(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    If customer paid partial cash, enter it here.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Promise Due Date
                  </label>
                  <input
                    type="text"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    placeholder="e.g. Friday 5pm, End of Month"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Credit Note / Agreement Remarks
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Neighbor on Block 4, works at local clinic"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              {/* Total Summary Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500">Total Credit Value:</div>
                  <div className="font-black text-sm text-slate-900 dark:text-white">
                    {settings.currencySymbol}
                    {selectedCreditItems
                      .reduce((sum, c) => sum + c.item.sellingPrice * c.quantity, 0)
                      .toFixed(2)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddCreditOpen(false)}
                    className="px-3 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-yellow-400 text-slate-950 font-black text-xs rounded-xl hover:bg-yellow-300 shadow-md transition-colors"
                  >
                    Save to Credit Book
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
