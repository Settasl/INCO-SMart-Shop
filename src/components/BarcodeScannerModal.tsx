import React, { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner, Html5Qrcode } from "html5-qrcode";
import { Barcode, Volume2, CheckCircle2, AlertCircle, Plus, Search, Camera } from "lucide-react";
import { InventoryItem, StoreSettings } from "../types";

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  settings: StoreSettings;
  targetItemForAssign?: InventoryItem | null;
  onUpdateQuantity: (id: string, delta: number, note?: string) => void;
  onAssignBarcode: (itemId: string, barcode: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  items,
  settings,
  targetItemForAssign,
  onUpdateQuantity,
  onAssignBarcode,
}) => {
  const [manualCode, setManualCode] = useState("");
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState("");
  const [isRapidMode, setIsRapidMode] = useState(true); // Auto +1 on scan
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Audio Beep generator using Web Audio API (zero audio file dependencies)
  const playBeep = (freq = 880, type: OscillatorType = "sine") => {
    if (!settings.enableSound) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      console.warn("Audio Context playback unavailable");
    }
  };

  const handleBarcodeFound = (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    setLastScannedCode(cleanCode);

    // If we are assigning barcode to a specific item
    if (targetItemForAssign) {
      onAssignBarcode(targetItemForAssign.id, cleanCode);
      playBeep(1046, "triangle");
      setMessage({
        text: `Assigned Barcode "${cleanCode}" to ${targetItemForAssign.name}!`,
        type: "success",
      });
      return;
    }

    // Lookup in inventory
    const matchedItem = items.find(
      (item) =>
        (item.barcode && item.barcode.trim() === cleanCode) ||
        (item.sku && item.sku.trim() === cleanCode)
    );

    if (matchedItem) {
      setScannedItem(matchedItem);
      playBeep(880, "sine");

      if (isRapidMode) {
        onUpdateQuantity(matchedItem.id, 1, `Barcode scan (+1)`);
        setMessage({
          text: `+1 added to ${matchedItem.name} (New Total: ${matchedItem.quantity + 1})`,
          type: "success",
        });
      } else {
        setMessage({
          text: `Found: ${matchedItem.name}`,
          type: "info",
        });
      }
    } else {
      setScannedItem(null);
      playBeep(300, "sawtooth");
      setMessage({
        text: `No item found for barcode "${cleanCode}". You can link it below.`,
        type: "error",
      });
    }
  };

  // Start Camera Scanner
  useEffect(() => {
    if (!isOpen) return;

    const scannerId = "html5qrcode-cam-reader";

    // Wait for DOM element
    const timer = setTimeout(() => {
      try {
        const html5Qrcode = new Html5Qrcode(scannerId);
        scannerRef.current = html5Qrcode;

        html5Qrcode
          .start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 180 },
            },
            (decodedText) => {
              handleBarcodeFound(decodedText);
            },
            () => {
              // Ignore frame read errors
            }
          )
          .catch((err) => {
            console.warn("Camera start failed:", err);
            setCameraError("Camera permission or video feed unavailable. You can use manual USB scanner or code entry below.");
          });
      } catch (e: any) {
        setCameraError("Scanner initialization failed.");
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).then(() => {
          scannerRef.current?.clear();
        });
      }
    };
  }, [isOpen]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode) {
      handleBarcodeFound(manualCode);
      setManualCode("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-yellow-100 rounded-lg text-slate-950 font-bold">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {targetItemForAssign ? `Assign Barcode to "${targetItemForAssign.name}"` : "Barcode Scanner"}
              </h3>
              <p className="text-[11px] text-slate-500">
                Point camera or scan with USB scanner
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold p-1">
            ✕
          </button>
        </div>

        {/* Rapid Mode Toggle */}
        {!targetItemForAssign && (
          <div className="flex items-center justify-between bg-slate-100 p-2 rounded-xl mb-3 text-xs font-semibold">
            <span className="text-slate-700">Rapid Scan Mode (+1 Stock on Scan)</span>
            <button
              onClick={() => setIsRapidMode(!isRapidMode)}
              className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                isRapidMode ? "bg-emerald-600 text-white" : "bg-slate-300 text-slate-700"
              }`}
            >
              {isRapidMode ? "ON (+1 Auto)" : "OFF (View Only)"}
            </button>
          </div>
        )}

        {/* Camera Viewport */}
        <div className="relative bg-slate-950 rounded-xl overflow-hidden min-h-[200px] flex flex-col items-center justify-center border border-slate-800">
          <div id="html5qrcode-cam-reader" className="w-full h-full" />
          {cameraError && (
            <div className="p-4 text-center text-amber-300 text-xs space-y-1">
              <Camera className="w-6 h-6 mx-auto text-amber-400" />
              <p className="font-semibold">{cameraError}</p>
            </div>
          )}
        </div>

        {/* Feedback Message */}
        {message && (
          <div
            className={`mt-3 p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                : message.type === "error"
                ? "bg-rose-100 text-rose-900 border border-rose-300"
                : "bg-blue-100 text-blue-900 border border-blue-300"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Scanned Item Details Card if found */}
        {scannedItem && !isRapidMode && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900">{scannedItem.name}</span>
              <span className="text-xs font-black text-slate-800">
                Stock: {scannedItem.quantity} {scannedItem.unit}
              </span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  onUpdateQuantity(scannedItem.id, 1, "Barcode scan (+1)");
                  playBeep();
                  setScannedItem({ ...scannedItem, quantity: scannedItem.quantity + 1 });
                }}
                className="flex-1 py-1.5 bg-yellow-400 text-slate-950 font-bold text-xs rounded-lg hover:bg-yellow-300"
              >
                +1 Stock
              </button>
              <button
                onClick={() => {
                  onUpdateQuantity(scannedItem.id, 5, "Barcode scan (+5)");
                  playBeep();
                  setScannedItem({ ...scannedItem, quantity: scannedItem.quantity + 5 });
                }}
                className="px-3 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-lg"
              >
                +5
              </button>
            </div>
          </div>
        )}

        {/* Manual Barcode / SKU Input Form */}
        <form onSubmit={handleManualSubmit} className="mt-4 pt-3 border-t border-slate-100 space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            Manual Barcode / SKU Input (or USB Scanner)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type or scan code..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-yellow-400"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg hover:bg-slate-800"
            >
              Lookup
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-200"
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
};
