import React from "react";
import { Printer, X } from "lucide-react";
import { InventoryItem, StoreSettings } from "../types";

interface PrintableStockSheetProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  settings: StoreSettings;
}

export const PrintableStockSheet: React.FC<PrintableStockSheetProps> = ({
  isOpen,
  onClose,
  items,
  settings,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header Controls */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 print:hidden">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Printable Stock Count Sheet</h3>
            <p className="text-xs text-slate-500">
              Formatted for paper clipboard audits
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-yellow-400 text-slate-950 font-black text-xs rounded-xl shadow-sm hover:bg-yellow-300"
            >
              <Printer className="w-4 h-4" /> Print Sheet
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-white text-black text-xs font-sans border rounded-xl print:border-none print:p-0">
          <div className="border-b-2 border-black pb-3 mb-4 flex justify-between items-end">
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight">{settings.storeName || "Inco Provision Store"}</h1>
              <p className="text-xs font-bold text-slate-600">PHYSICAL INVENTORY COUNT SHEET</p>
            </div>
            <div className="text-right text-[11px]">
              <div>Date: ________________________</div>
              <div>Auditor Name: ________________</div>
            </div>
          </div>

          <table className="w-full border-collapse border border-black text-left">
            <thead>
              <tr className="bg-slate-200 text-black font-black uppercase border-b border-black">
                <th className="border border-black p-2">Item Name</th>
                <th className="border border-black p-2">Category</th>
                <th className="border border-black p-2">Location</th>
                <th className="border border-black p-2 text-center">System Qty</th>
                <th className="border border-black p-2 text-center w-28">Physical Count</th>
                <th className="border border-black p-2 w-32">Notes</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-slate-400">
                  <td className="border border-black p-2 font-bold">{item.name}</td>
                  <td className="border border-black p-2 text-slate-700">{item.category}</td>
                  <td className="border border-black p-2 text-slate-700">{item.location || "-"}</td>
                  <td className="border border-black p-2 text-center font-bold">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="border border-black p-2 text-center"></td>
                  <td className="border border-black p-2"></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-8 pt-4 border-t border-black flex justify-between text-[11px]">
            <div>Auditor Signature: _______________________</div>
            <div>Manager Signature: _______________________</div>
          </div>
        </div>
      </div>
    </div>
  );
};
