import React, { useState, useEffect } from "react";
import { Download, X, Smartphone, Sparkles, Check, Share2, PlusSquare } from "lucide-react";
import { sounds } from "../lib/sound";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const InstallAppBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Check if already in standalone mode
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Listen for beforeinstallprompt event on Android/Desktop Chrome
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Check if user dismissed banner recently
      try {
        const dismissed = sessionStorage.getItem("inco_pwa_banner_dismissed");
        if (!dismissed) {
          setShowBanner(true);
        }
      } catch (err) {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    // On iOS, if not standalone, show banner once
    if (isIosDevice) {
      try {
        const dismissed = sessionStorage.getItem("inco_pwa_banner_dismissed");
        if (!dismissed) {
          setShowBanner(true);
        }
      } catch (e) {
        setShowBanner(true);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    sounds.playClick();
    sounds.triggerHaptic(20);

    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) {
      setShowIOSModal(true);
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        sounds.playSuccess();
        setShowBanner(false);
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } catch (e) {
      console.warn("PWA install error", e);
    }
  };

  const handleDismiss = () => {
    sounds.playClick();
    setShowBanner(false);
    try {
      sessionStorage.setItem("inco_pwa_banner_dismissed", "true");
    } catch (e) {}
  };

  if (isInstalled || !showBanner) return null;

  return (
    <>
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-yellow-400/40 text-white px-3 sm:px-4 py-2 flex items-center justify-between gap-2 shadow-md text-xs relative z-40 neon-border-amber">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 bg-yellow-400 text-slate-950 rounded-lg flex items-center justify-center font-black shrink-0 shadow-xs neon-glow-amber">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="font-black text-white flex items-center gap-1.5 truncate">
              <span>Install INCO Smart Shop</span>
              <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[9px] uppercase font-bold tracking-wider hidden sm:inline-block">
                PWA Offline Ready
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate hidden xs:block">
              Fast 1-tap home screen access & instant zero-lag barcode scanning.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-slate-950 font-black text-[11px] uppercase tracking-wider rounded-lg transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install App</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* iOS Install Helper Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl w-full max-w-sm p-5 shadow-2xl relative space-y-4 neon-border-amber">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-yellow-400 text-slate-950 rounded-xl flex items-center justify-center font-bold">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="font-black text-base text-white">Install to Home Screen</h3>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Install <strong>INCO Smart Shop</strong> on your device for lightning-fast full-screen access and offline inventory counting:
            </p>

            <div className="space-y-2.5 text-xs text-slate-200 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-yellow-400 font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Tap the <strong className="text-yellow-400">Share button</strong> (
                  <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-yellow-400" />
                  ) at the bottom or top of your Safari / browser screen.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-yellow-400 font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Scroll down and tap <strong className="text-yellow-400">Add to Home Screen</strong> (
                  <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-yellow-400" />
                  ).
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-yellow-400 font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <span>Tap <strong>Add</strong> at the top-right to launch anytime directly from your phone!</span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
