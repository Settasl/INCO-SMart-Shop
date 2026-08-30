import React, { useState, useMemo } from "react";
import {
  Settings,
  Download,
  RotateCcw,
  Volume2,
  VolumeX,
  Save,
  X,
  Globe,
  Mail,
  Search,
  Bell,
  Check,
  Sparkles,
  Moon,
  Sun,
} from "lucide-react";
import { StoreSettings, InventoryItem } from "../types";
import { GLOBAL_CURRENCIES, CurrencyOption } from "../data/currencies";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
  items: InventoryItem[];
  onSaveSettings: (newSettings: StoreSettings) => void;
  onResetToSampleData: () => void;
  onExportCSV: () => void;
  onOpenLowStockEmailModal?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  items,
  onSaveSettings,
  onResetToSampleData,
  onExportCSV,
  onOpenLowStockEmailModal,
}) => {
  const [storeName, setStoreName] = useState(settings.storeName || "My Provision Store");
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState(
    settings.currencyCode || "USD"
  );
  const [customSymbol, setCustomSymbol] = useState(settings.currencySymbol || "$");
  const [customCode, setCustomCode] = useState(settings.currencyCode || "USD");
  const [isCustomCurrency, setIsCustomCurrency] = useState(
    !GLOBAL_CURRENCIES.some((c) => c.code === settings.currencyCode)
  );

  const [currencySearch, setCurrencySearch] = useState("");
  const [enableSound, setEnableSound] = useState(settings.enableSound ?? true);
  const [lowStockAlerts, setLowStockAlerts] = useState(settings.lowStockAlerts ?? true);
  const [alertEmail, setAlertEmail] = useState(settings.alertEmail || "");
  const [autoEmailAlerts, setAutoEmailAlerts] = useState(settings.autoEmailAlerts ?? true);
  const [darkMode, setDarkMode] = useState(settings.darkMode ?? false);

  // Filter currencies based on search term
  const filteredCurrencies = useMemo(() => {
    if (!currencySearch.trim()) return GLOBAL_CURRENCIES;
    const q = currencySearch.toLowerCase().trim();
    return GLOBAL_CURRENCIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
    );
  }, [currencySearch]);

  const selectedCurrencyObj = useMemo(() => {
    return GLOBAL_CURRENCIES.find((c) => c.code === selectedCurrencyCode);
  }, [selectedCurrencyCode]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSymbol = isCustomCurrency
      ? customSymbol.trim() || "$"
      : selectedCurrencyObj?.symbol || "$";
    const finalCode = isCustomCurrency
      ? customCode.trim().toUpperCase() || "USD"
      : selectedCurrencyObj?.code || "USD";

    onSaveSettings({
      storeName: storeName.trim() || "My Provision Store",
      currencySymbol: finalSymbol,
      currencyCode: finalCode,
      enableSound,
      lowStockAlerts,
      alertEmail: alertEmail.trim(),
      autoEmailAlerts,
      darkMode,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-slate-900 dark:bg-slate-800 text-yellow-400 rounded-xl font-bold">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Store Settings</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Multi-currency, dark mode & low-stock alerts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs font-medium flex-1 overflow-y-auto pr-1">
          {/* Store Name */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
              Shop / Provision Store Name *
            </label>
            <input
              type="text"
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="e.g. Inco Smartshop, Central Pharmacy, Shoes Kiosk"
            />
          </div>

          {/* Theme Mode Toggle (Storage Room / Night Mode) */}
          <div className="bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                {darkMode ? <Moon className="w-4 h-4 text-yellow-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                <span>Global Dark Mode Theme</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Optimized for dimly lit storage rooms and night-shift kiosk staff
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                darkMode
                  ? "bg-yellow-400 text-slate-950 font-black shadow-xs"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              {darkMode ? "Dark Enabled" : "Light Mode"}
            </button>
          </div>

          {/* Global Multi-Currency Selection */}
          <div className="bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Store Country & Currency ({GLOBAL_CURRENCIES.length} Available)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomCurrency(!isCustomCurrency)}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {isCustomCurrency ? "Pick Standard Currency" : "Custom Symbol"}
              </button>
            </div>

            {isCustomCurrency ? (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 font-bold mb-1">
                    Currency Symbol
                  </label>
                  <input
                    type="text"
                    value={customSymbol}
                    onChange={(e) => setCustomSymbol(e.target.value)}
                    placeholder="e.g. $, ₦, KSh, ₹, €"
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 font-bold mb-1">
                    Currency Code
                  </label>
                  <input
                    type="text"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                    placeholder="e.g. USD, NGN, KES"
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-sm uppercase text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Search currency */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by country, currency name or code (e.g. Nigeria, Dollar, KES)..."
                    value={currencySearch}
                    onChange={(e) => setCurrencySearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                {/* Currency selector listbox */}
                <div className="max-h-36 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-750 bg-white dark:bg-slate-900 shadow-2xs">
                  {filteredCurrencies.map((cur) => {
                    const isSelected = selectedCurrencyCode === cur.code;
                    return (
                      <button
                        key={cur.code}
                        type="button"
                        onClick={() => {
                          setSelectedCurrencyCode(cur.code);
                          setIsCustomCurrency(false);
                        }}
                        className={`w-full px-2.5 py-1.5 flex items-center justify-between text-left transition-colors ${
                          isSelected
                            ? "bg-yellow-100/80 dark:bg-yellow-950/60 text-slate-950 dark:text-yellow-200 font-bold"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{cur.flag}</span>
                          <div>
                            <span className="font-bold text-xs">{cur.name}</span>{" "}
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                              ({cur.country})
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200">
                            {cur.symbol.trim() || cur.code}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400 font-bold" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Email Alert Configuration */}
          <div className="bg-amber-50/60 dark:bg-amber-950/30 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-amber-950 dark:text-amber-200">
                <Mail className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <span>Low-Stock Email Notifications</span>
              </div>
              {onOpenLowStockEmailModal && (
                <button
                  type="button"
                  onClick={onOpenLowStockEmailModal}
                  className="text-[11px] font-bold text-amber-800 dark:text-amber-300 hover:underline"
                >
                  Preview Alert
                </button>
              )}
            </div>

            <div>
              <label className="block text-[11px] text-slate-700 dark:text-slate-300 font-bold mb-1">
                Recipient Email Address
              </label>
              <input
                type="email"
                placeholder="e.g. storeowner@gmail.com"
                value={alertEmail}
                onChange={(e) => setAlertEmail(e.target.value)}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                A structured restocking summary table is sent to this address whenever products drop to or below reorder levels.
              </p>
            </div>

            <div className="pt-1 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-800 dark:text-slate-200 text-[11px] font-semibold">
                <input
                  type="checkbox"
                  checked={autoEmailAlerts}
                  onChange={(e) => setAutoEmailAlerts(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5 accent-amber-600"
                />
                <span>Enable automatic low-stock email triggers</span>
              </label>
            </div>
          </div>

          {/* Audio Beep Feedback */}
          <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">Audio Beep Feedback</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Play auditory beep on barcode scan and button clicks</span>
            </div>
            <button
              type="button"
              onClick={() => setEnableSound(!enableSound)}
              className={`p-2 rounded-xl font-bold transition-colors ${
                enableSound ? "bg-emerald-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
              }`}
            >
              {enableSound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          {/* Data Backup & Export */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <label className="block text-slate-700 dark:text-slate-300 font-bold">Data & Maintenance</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onExportCSV}
                className="flex items-center justify-center gap-1.5 p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold transition-colors"
              >
                <Download className="w-4 h-4 text-slate-600 dark:text-slate-400" /> Export CSV ({items.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Reset inventory to starter template? All custom items will be overwritten with multi-category stock.")) {
                    onResetToSampleData();
                    onClose();
                  }
                }}
                className="flex items-center justify-center gap-1.5 p-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl font-bold transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Reset Sample Data
              </button>
            </div>
          </div>

          {/* Footer Save */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-yellow-400 text-slate-950 font-black rounded-xl hover:bg-yellow-300 shadow-sm flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
