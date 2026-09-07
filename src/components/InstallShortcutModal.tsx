import React, { useState, useEffect } from "react";
import {
  Share,
  PlusSquare,
  X,
  Smartphone,
  CheckCircle2,
  Download,
  Sparkles,
  ArrowDown,
  Layers,
} from "lucide-react";

interface InstallShortcutModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export const InstallShortcutModal: React.FC<InstallShortcutModalProps> = ({
  forceOpen = false,
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installedConfirmed, setInstalledConfirmed] = useState(false);

  useEffect(() => {
    // Check if running as installed standalone PWA
    const checkStandalone = () => {
      const isStandalone =
        (window.navigator as any).standalone === true ||
        window.matchMedia("(display-mode: standalone)").matches;
      setIsInstalled(isStandalone);
      return isStandalone;
    };

    if (checkStandalone()) {
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Capture Chromium / Android beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).deferredInstallPrompt = e;
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Check if triggered by login / signup
    const justAuth = typeof window !== "undefined" && sessionStorage.getItem("inco_just_authenticated") === "true";
    const alreadyDismissed = typeof window !== "undefined" && localStorage.getItem("inco_shortcut_prompt_dismissed") === "true";

    if (forceOpen || justAuth || !alreadyDismissed) {
      setIsOpen(true);
      if (justAuth) {
        sessionStorage.removeItem("inco_just_authenticated");
        // If Android/Chromium has deferred prompt ready, trigger auto-prompt seamlessly
        const autoPrompt = deferredPrompt || (window as any).deferredInstallPrompt;
        if (autoPrompt && typeof autoPrompt.prompt === "function") {
          setTimeout(() => {
            try {
              autoPrompt.prompt();
            } catch (e) {}
          }, 600);
        }
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, [forceOpen, deferredPrompt]);

  // Handle Android/Desktop native prompt
  const handleNativeInstall = async () => {
    const promptEvent = deferredPrompt || (window as any).deferredInstallPrompt;
    if (promptEvent) {
      try {
        promptEvent.prompt();
        const choiceResult = await promptEvent.userChoice;
        if (choiceResult.outcome === "accepted") {
          setInstalledConfirmed(true);
          localStorage.setItem("inco_shortcut_prompt_dismissed", "true");
          setTimeout(() => {
            handleClose();
          }, 1800);
        }
      } catch (err) {
        console.error("Install prompt error", err);
      }
      setDeferredPrompt(null);
    } else {
      // Confirmed fallback
      setInstalledConfirmed(true);
      localStorage.setItem("inco_shortcut_prompt_dismissed", "true");
      setTimeout(() => {
        handleClose();
      }, 2000);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("inco_shortcut_prompt_dismissed", "true");
    handleClose();
  };

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  if (!isOpen || isInstalled) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-4 text-slate-900 dark:text-white shadow-2xl relative overflow-hidden border border-slate-200 dark:border-slate-800"
        role="dialog"
        aria-modal="true"
      >
        {/* Top subtle highlight banner */}
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Icon Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Header Content */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 via-amber-400 to-amber-500 flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0 border border-white/80">
            <Smartphone className="w-4 h-4 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-black tracking-tight text-slate-950 dark:text-white">
                Add INCO Shortcut to Screen
              </h3>
              <span className="px-1.5 py-0.2 text-[9px] uppercase font-black bg-amber-400 text-slate-950 rounded border border-amber-500/40">
                1-Tap
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
              Instant access, offline speed, and full-screen kiosk register
            </p>
          </div>
        </div>

        {installedConfirmed ? (
          <div className="py-4 text-center space-y-1.5">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto animate-bounce" />
            <p className="text-xs font-black text-slate-900 dark:text-white">
              Shortcut Added to Screen!
            </p>
            <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
              You can now launch INCO directly from your iPhone, Android, or desktop home screen.
            </p>
          </div>
        ) : isIOS ? (
          /* iOS Safari Step-by-Step Instructions */
          <div className="space-y-2.5 my-2">
            <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-slate-900/80 border border-amber-200/80 dark:border-amber-500/20 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-100">
                <span className="w-4.5 h-4.5 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-[10px] shrink-0">
                  1
                </span>
                <span>
                  Tap Safari&apos;s <span className="font-bold text-sky-600 dark:text-sky-400 inline-flex items-center gap-0.5"><Share className="w-3 h-3" /> Share</span> button at the bottom of the screen.
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-100">
                <span className="w-4.5 h-4.5 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-[10px] shrink-0">
                  2
                </span>
                <span>
                  Scroll down and tap <span className="font-bold text-amber-600 dark:text-amber-400 inline-flex items-center gap-0.5"><PlusSquare className="w-3 h-3" /> &quot;Add to Home Screen&quot;</span>.
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-100">
                <span className="w-4.5 h-4.5 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-[10px] shrink-0">
                  3
                </span>
                <span>
                  Tap <span className="font-black text-slate-950 dark:text-white">&quot;Add&quot;</span> in the top right corner.
                </span>
              </div>
            </div>

            {/* Visual Guide Arrow to Safari Toolbar */}
            <div className="flex items-center justify-center gap-1.5 py-1 text-xs font-bold text-sky-600 dark:text-sky-400 animate-pulse">
              <ArrowDown className="w-3.5 h-3.5" />
              <span>Tap the Share icon at the bottom of Safari</span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setInstalledConfirmed(true);
                  localStorage.setItem("inco_shortcut_prompt_dismissed", "true");
                  setTimeout(handleClose, 1500);
                }}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                I Added It to Home Screen
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="py-2 px-3 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        ) : (
          /* Android / Chrome / Edge Installation */
          <div className="space-y-2.5 my-2">
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
              Add INCO to your home screen or desktop to open your cash register and barcode scanner with 1 tap, even offline.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleNativeInstall}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Add Shortcut to Screen
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="py-2 px-3 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
