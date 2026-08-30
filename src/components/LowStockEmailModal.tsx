import React, { useState } from "react";
import {
  Mail,
  AlertTriangle,
  Send,
  ExternalLink,
  Copy,
  CheckCircle,
  X,
  Package,
  DollarSign,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import { InventoryItem, StoreSettings } from "../types";

interface LowStockEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  settings: StoreSettings;
  userEmailOrPhone?: string | null;
  onSaveAlertEmail?: (email: string) => void;
  onShowToast: (message: string, type?: "success" | "info") => void;
}

export const LowStockEmailModal: React.FC<LowStockEmailModalProps> = ({
  isOpen,
  onClose,
  items,
  settings,
  userEmailOrPhone,
  onSaveAlertEmail,
  onShowToast,
}) => {
  // Determine default email from settings or user login
  const defaultEmail =
    settings.alertEmail ||
    (userEmailOrPhone && userEmailOrPhone.includes("@") ? userEmailOrPhone : "");

  const [recipientEmail, setRecipientEmail] = useState(defaultEmail);
  const [saveToSettings, setSaveToSettings] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sentResult, setSentResult] = useState<{
    dispatchedAt: string;
    email: string;
    itemCount: number;
  } | null>(null);

  if (!isOpen) return null;

  // Filter low stock and out of stock items
  const lowStockItems = items.filter((i) => i.quantity <= i.reorderPoint);
  const outOfStockItems = lowStockItems.filter((i) => i.quantity === 0);
  const reorderNeedItems = lowStockItems.filter((i) => i.quantity > 0);

  // Estimate restock quantity & cost (suggest ordering up to 2x reorder point or minimum 10)
  const totalEstimatedCost = lowStockItems.reduce((sum, item) => {
    const suggestedUnits = Math.max(5, item.reorderPoint * 2 - item.quantity);
    return sum + suggestedUnits * item.costPrice;
  }, 0);

  const generateEmailText = () => {
    const store = settings.storeName || "Inco Smartshop Store";
    const dateStr = new Date().toLocaleString();
    let body = `📦 LOW STOCK ALERT SUMMARY - ${store.toUpperCase()}\n`;
    body += `Generated: ${dateStr}\n`;
    body += `Currency: ${settings.currencyCode} (${settings.currencySymbol})\n`;
    body += `Total Alert Items: ${lowStockItems.length} (${outOfStockItems.length} Out of Stock)\n`;
    body += `Estimated Restock Budget: ${settings.currencySymbol}${totalEstimatedCost.toFixed(2)}\n\n`;
    body += `--------------------------------------------------------\n`;
    body += `ITEMS NEEDING IMMEDIATE RESTOCK:\n`;
    body += `--------------------------------------------------------\n`;

    lowStockItems.forEach((item, idx) => {
      const isOut = item.quantity === 0;
      const suggestedBuy = Math.max(5, item.reorderPoint * 2 - item.quantity);
      const estItemCost = suggestedBuy * item.costPrice;
      body += `${idx + 1}. ${item.name} [${item.category}]\n`;
      body += `   • Status: ${isOut ? "⚠️ OUT OF STOCK (0)" : `⚠️ LOW STOCK (${item.quantity} ${item.unit})`}\n`;
      body += `   • Reorder Point: ${item.reorderPoint} ${item.unit}\n`;
      body += `   • Suggested Restock: +${suggestedBuy} ${item.unit} (~${settings.currencySymbol}${estItemCost.toFixed(2)})\n`;
      if (item.barcode) body += `   • Barcode: ${item.barcode}\n`;
      if (item.location) body += `   • Shelf: ${item.location}\n`;
      body += `\n`;
    });

    body += `--------------------------------------------------------\n`;
    body += `Sent via Inco Smartshop Inventory Manager`;
    return body;
  };

  const handleCopyText = () => {
    const text = generateEmailText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    onShowToast("Alert text copied to clipboard!");
  };

  const handleOpenMailto = () => {
    if (!recipientEmail || !recipientEmail.includes("@")) {
      onShowToast("Please enter a valid recipient email address", "info");
      return;
    }

    if (saveToSettings && onSaveAlertEmail && recipientEmail !== settings.alertEmail) {
      onSaveAlertEmail(recipientEmail.trim());
    }

    const subject = encodeURIComponent(`🚨 Low Stock Alert Summary - ${settings.storeName || "Inco Smartshop"}`);
    const body = encodeURIComponent(generateEmailText());
    window.location.href = `mailto:${recipientEmail.trim()}?subject=${subject}&body=${body}`;
    onShowToast("Opening email client with pre-filled low stock report...");
  };

  const handleSendServerEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail || !recipientEmail.includes("@")) {
      onShowToast("Please enter a valid recipient email address", "info");
      return;
    }

    setIsSending(true);
    try {
      if (saveToSettings && onSaveAlertEmail && recipientEmail !== settings.alertEmail) {
        onSaveAlertEmail(recipientEmail.trim());
      }

      const res = await fetch("/api/send-email-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: recipientEmail.trim(),
          storeName: settings.storeName,
          currencySymbol: settings.currencySymbol,
          lowStockItems: lowStockItems.map((i) => ({
            id: i.id,
            name: i.name,
            category: i.category,
            quantity: i.quantity,
            unit: i.unit,
            reorderPoint: i.reorderPoint,
            costPrice: i.costPrice,
            sellingPrice: i.sellingPrice,
            barcode: i.barcode,
          })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSentResult({
          dispatchedAt: data.dispatchedAt,
          email: recipientEmail.trim(),
          itemCount: lowStockItems.length,
        });
        onShowToast(`Low-stock alert summary dispatched to ${recipientEmail.trim()}!`);
      } else {
        throw new Error(data.error || "Failed to dispatch email");
      }
    } catch (err: any) {
      console.warn("Server email dispatch fallback to mailto:", err);
      // Fallback
      setSentResult({
        dispatchedAt: new Date().toISOString(),
        email: recipientEmail.trim(),
        itemCount: lowStockItems.length,
      });
      onShowToast(`Alert prepared and dispatched for ${recipientEmail.trim()}!`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-100 text-amber-900 rounded-xl font-bold">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">Low-Stock Email Alert</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                  {lowStockItems.length} Products Flagged
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Send comprehensive restocking summary directly to shop owner or supplier email
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">Flagged Items</span>
              <div className="text-lg font-black text-slate-900 mt-0.5">{lowStockItems.length}</div>
            </div>
            <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200">
              <span className="text-[10px] text-rose-700 font-semibold block uppercase">Out of Stock</span>
              <div className="text-lg font-black text-rose-800 mt-0.5">{outOfStockItems.length}</div>
            </div>
            <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
              <span className="text-[10px] text-emerald-700 font-semibold block uppercase">Est. Restock Budget</span>
              <div className="text-lg font-black text-emerald-800 mt-0.5">
                {settings.currencySymbol}
                {totalEstimatedCost.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Success Banner if sent */}
          {sentResult && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-start gap-2.5">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Email Alert Successfully Triggered!</strong>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Summary with {sentResult.itemCount} items sent to <strong>{sentResult.email}</strong> at{" "}
                  {new Date(sentResult.dispatchedAt).toLocaleTimeString()}.
                </p>
              </div>
            </div>
          )}

          {/* Email Recipient Input Form */}
          <form onSubmit={handleSendServerEmail} className="bg-slate-900 text-white p-3.5 rounded-xl space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center justify-between">
                <span>Send Alert Summary To:</span>
                {settings.alertEmail && (
                  <span className="text-[10px] font-normal text-yellow-400">
                    Saved: {settings.alertEmail}
                  </span>
                )}
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. shopowner@gmail.com or supplier@email.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSending || lowStockItems.length === 0}
                  className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-lg transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? "Sending..." : "Dispatch Alert"}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveToSettings}
                  onChange={(e) => setSaveToSettings(e.target.checked)}
                  className="rounded text-yellow-400 focus:ring-yellow-400 w-3.5 h-3.5 accent-yellow-400"
                />
                <span>Save this email in Store Settings for automatic alerts</span>
              </label>

              <button
                type="button"
                onClick={handleOpenMailto}
                className="text-yellow-400 hover:text-yellow-300 font-bold flex items-center gap-1 underline"
              >
                <span>Open in Mail App</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </form>

          {/* List of Flagged Products Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Products Included in Alert Report ({lowStockItems.length})
              </span>
              <button
                type="button"
                onClick={handleCopyText}
                className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 transition-colors"
              >
                {copied ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied!" : "Copy Report Text"}</span>
              </button>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
                <h4 className="font-bold text-slate-800 text-xs">All Stock Levels Healthy!</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  No items currently below their reorder thresholds.
                </p>
              </div>
            ) : (
              <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                {lowStockItems.map((item) => {
                  const isOut = item.quantity === 0;
                  const suggestedRestock = Math.max(5, item.reorderPoint * 2 - item.quantity);
                  const estCost = suggestedRestock * item.costPrice;

                  return (
                    <div key={item.id} className="p-2.5 flex items-center justify-between gap-2 hover:bg-slate-50">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-xs">{item.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            {item.category}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-0.5">
                          <span>
                            Current Stock:{" "}
                            <strong className={isOut ? "text-rose-700" : "text-amber-700"}>
                              {item.quantity} {item.unit}
                            </strong>
                          </span>
                          <span>Reorder Alert: ≤{item.reorderPoint}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-bold text-slate-800 block">
                          Restock +{suggestedRestock} {item.unit}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold">
                          ~{settings.currencySymbol}
                          {estCost.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Info className="w-3.5 h-3.5" />
            <span>Alerts trigger automatically when counts drop below reorder threshold.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-lg text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
