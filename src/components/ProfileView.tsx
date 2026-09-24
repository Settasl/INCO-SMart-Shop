import React, { useState, useRef, useMemo } from "react";
import { UserProfile, StoreSettings } from "../types";
import { useAuth } from "../context/AuthContext";
import { sounds } from "../lib/sound";
import { compressImage, PRESET_AVATARS, PRESET_BUSINESS_LOGOS } from "../lib/imageUtils";
import { safeStorage } from "../lib/safeStorage";
import { GLOBAL_CURRENCIES, CurrencyOption } from "../data/currencies";
import {
  Camera,
  Upload,
  Check,
  Building2,
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  Trash2,
  Store,
  User,
  Image as ImageIcon,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  X,
  Share2,
  Copy,
  Gift,
  Coins,
  MessageCircle,
  DollarSign,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Award,
  Zap,
  CheckCircle2,
  Search,
} from "lucide-react";

interface ProfileViewProps {
  userProfile: UserProfile;
  settings: StoreSettings;
  onUpdateProfile: (updates: Partial<UserProfile>, newSettings?: Partial<StoreSettings>) => void;
  onSaveSettings?: (newSettings: StoreSettings) => void;
  onOpenSubscription?: () => void;
  onOpenVerification?: () => void;
  onOpenAdminPortal?: () => void;
  onShowToast: (msg: string, type?: "success" | "info" | "error") => void;
  onLogout?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userProfile,
  settings,
  onUpdateProfile,
  onSaveSettings,
  onOpenSubscription,
  onOpenVerification,
  onOpenAdminPortal,
  onShowToast,
  onLogout,
}) => {
  const { changePassword, deleteAccount } = useAuth();
  const inviteSectionRef = useRef<HTMLDivElement>(null);

  // --- BASIC PROFILE & STORE INFO ---
  const [fullName, setFullName] = useState(userProfile.displayName || "Store Merchant");
  const [email, setEmail] = useState(userProfile.identifier || "merchant@inco.app");
  const [phone, setPhone] = useState(userProfile.location || "+266 1234 5678");
  const [storeName, setStoreName] = useState(userProfile.storeName || settings.storeName || "My Store");
  const [location, setLocation] = useState(userProfile.location || "");
  const [role, setRole] = useState(
    (userProfile.identifier || "").toLowerCase() === "settaholdings@gmail.com"
      ? "Super Admin"
      : "Store Administrator"
  );

  // --- CURRENCY & SETTINGS STATE ---
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState(
    settings.currencyCode || "USD"
  );
  const [customSymbol, setCustomSymbol] = useState(settings.currencySymbol || "$");
  const [currencySearch, setCurrencySearch] = useState("");
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [alertEmail, setAlertEmail] = useState(settings.alertEmail || "");
  const [enableSound, setEnableSound] = useState(settings.enableSound ?? true);
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

  // --- AVATAR & BUSINESS LOGO STATE ---
  const [avatarUrl, setAvatarUrl] = useState<string>(
    userProfile.avatarUrl || PRESET_AVATARS[0]
  );
  const [businessLogo, setBusinessLogo] = useState<string>(
    userProfile.businessLogo || userProfile.logoUrl || settings.storeLogo || ""
  );
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);

  // Avatar Feed History State
  const [avatarFeed, setAvatarFeed] = useState<string[]>(() => {
    const stored = safeStorage.getJSON<string[]>("inco_user_avatar_feed", []);
    const merged = Array.from(
      new Set([userProfile.avatarUrl, ...stored, ...PRESET_AVATARS])
    ).filter(Boolean);
    return merged;
  });

  // Business Logo Feed History State
  const [logoFeed, setLogoFeed] = useState<string[]>(() => {
    const stored = safeStorage.getJSON<string[]>("inco_user_logo_feed", []);
    const merged = Array.from(
      new Set([
        userProfile.businessLogo,
        userProfile.logoUrl,
        settings.storeLogo,
        ...stored,
        ...PRESET_BUSINESS_LOGOS,
      ])
    ).filter(Boolean) as string[];
    return merged;
  });

  // File Input Refs for Camera and Custom Upload
  const avatarCameraInputRef = useRef<HTMLInputElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const logoCameraInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // --- REFERRAL & INVITE SHARE STATE ---
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const referralCode =
    userProfile.referralCode ||
    `INCO-${(userProfile.id || "MERCHANT").replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase()}`;

  const referralCount = userProfile.referralCount || 0;
  const referralRewardsUnlocked = (userProfile as any).referralRewardsUnlocked || [];
  const freeMonthsEarned = Math.max(referralCount, referralRewardsUnlocked.length);

  const referralLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/?ref=${referralCode}`
      : `https://inco.app/?ref=${referralCode}`;

  const shareText = `🎁 Join me on INCO Smart Shop! Track sales, scan barcodes, and run your store offline & online. Use my referral code ${referralCode} to get 1 Month Free INCO Pro AI:\n${referralLink}`;

  // Copy Referral Code
  const handleCopyCode = () => {
    sounds.playClick();
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      onShowToast(`Referral code ${referralCode} copied!`, "success");
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  // Copy Referral Share Link
  const handleCopyLink = () => {
    sounds.playClick();
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      onShowToast("Invite referral link copied to clipboard!", "success");
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Direct WhatsApp Share
  const handleShareWhatsApp = () => {
    sounds.playClick();
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Native Web Share API (iOS Safari, Android Chrome, Mac)
  const handleNativeShare = async () => {
    sounds.playClick();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Join INCO Smart Shop",
          text: `Use my invite code ${referralCode} to get 1 Month Free INCO Pro AI!`,
          url: referralLink,
        });
        onShowToast("Invite link shared successfully!", "success");
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  // --- AVATAR UPLOAD HANDLER ---
  const handleAvatarFile = async (file: File) => {
    setIsProcessingAvatar(true);
    try {
      const compressed = await compressImage(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.85,
        format: "image/jpeg",
      });

      setAvatarUrl(compressed);
      onUpdateProfile({ avatarUrl: compressed });
      sounds.playSuccess();
      onShowToast("Merchant profile photo updated!", "success");

      setAvatarFeed((prev) => {
        const next = [compressed, ...prev.filter((p) => p !== compressed)].slice(0, 16);
        safeStorage.setJSON("inco_user_avatar_feed", next);
        return next;
      });
    } catch (err: any) {
      console.error("[ProfileView] Avatar upload error:", err);
      onShowToast("Failed to process photo. Please try another image.", "error");
    } finally {
      setIsProcessingAvatar(false);
    }
  };

  // --- LOGO UPLOAD HANDLER ---
  const handleLogoFile = async (file: File) => {
    setIsProcessingLogo(true);
    try {
      const compressed = await compressImage(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.85,
        format: "image/jpeg",
      });

      setBusinessLogo(compressed);
      onUpdateProfile(
        { businessLogo: compressed, logoUrl: compressed },
        { storeLogo: compressed, businessLogo: compressed }
      );
      sounds.playSuccess();
      onShowToast("Store & business logo updated!", "success");

      setLogoFeed((prev) => {
        const next = [compressed, ...prev.filter((p) => p !== compressed)].slice(0, 16);
        safeStorage.setJSON("inco_user_logo_feed", next);
        return next;
      });
    } catch (err: any) {
      console.error("[ProfileView] Logo upload error:", err);
      onShowToast("Failed to process logo. Please try another image.", "error");
    } finally {
      setIsProcessingLogo(false);
    }
  };

  // --- SAVE PROFILE & STORE DETAILS UNIFIED ---
  const handleSaveProfileAndStore = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    sounds.triggerHaptic(10);

    const finalSymbol = selectedCurrencyObj?.symbol || customSymbol || "$";
    const finalCode = selectedCurrencyObj?.code || selectedCurrencyCode || "USD";

    const profileUpdates: Partial<UserProfile> = {
      displayName: fullName.trim(),
      storeName: storeName.trim(),
      location: location.trim(),
      avatarUrl,
      businessLogo,
      logoUrl: businessLogo,
    };

    const storeSettingsUpdates: Partial<StoreSettings> = {
      storeName: storeName.trim(),
      currencySymbol: finalSymbol,
      currencyCode: finalCode,
      alertEmail: alertEmail.trim(),
      enableSound,
      darkMode,
      storeLogo: businessLogo,
      businessLogo: businessLogo,
    };

    onUpdateProfile(profileUpdates, storeSettingsUpdates);

    if (onSaveSettings) {
      onSaveSettings({
        ...settings,
        ...storeSettingsUpdates,
      });
    }

    sounds.playSuccess();
    onShowToast("Store & merchant profile details saved successfully!", "success");
  };

  // --- PASSWORD MANAGEMENT ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    if (newPassword.length < 6) {
      setPasswordStatus({
        type: "error",
        message: "Password must be at least 6 characters.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({
        type: "error",
        message: "New passwords do not match.",
      });
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordStatus(null);
    try {
      await changePassword(newPassword.trim(), currentPassword.trim() || undefined);
      sounds.playSuccess();
      setPasswordStatus({
        type: "success",
        message: "Password updated successfully in Firebase Auth!",
      });
      onShowToast("Account password updated successfully!", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordStatus({
        type: "error",
        message: err?.message || "Failed to update password. Please check your credentials.",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // --- ACCOUNT DELETION ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmWord, setDeleteConfirmWord] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteAccountConfirm = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount(deletePassword.trim() || undefined);
      sounds.playSuccess();
      setShowDeleteModal(false);
      onShowToast("Account permanently deleted.", "info");
      if (onLogout) onLogout();
    } catch (err: any) {
      setDeleteError(err?.message || "Failed to delete account. Please verify password.");
    } finally {
      setIsDeleting(false);
    }
  };

  const isProActive =
    (userProfile.identifier || "").toLowerCase() === "settaholdings@gmail.com" ||
    userProfile.subscription?.status === "active" ||
    userProfile.subscription?.plan === "INCO Pro AI";

  const isVerified = userProfile.isVerified || userProfile.verificationStatus === "approved";

  const initials =
    fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "SH";

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200 pb-16">
      {/* 1. TOP MERCHANT & STORE PROFILE HEADER */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#121826] border border-[#1F293D] shadow-xl flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 relative overflow-hidden">
        {/* Background Subtle Gradient Glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#E5F107]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left z-10">
          {/* Avatar with Camera Overlay */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-3 border-[#E5F107] ring-4 ring-[#E5F107]/20 shadow-xl bg-[#0B0F19] flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[#E5F107] font-black text-3xl">{initials}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => avatarFileInputRef.current?.click()}
              className="absolute inset-0 rounded-3xl bg-slate-950/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer text-[10px] font-bold"
            >
              <Camera className="w-6 h-6 text-[#E5F107] mb-1" />
              <span>Change Photo</span>
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">{fullName}</h1>
              {isVerified ? (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#E5F107] text-slate-950 flex items-center gap-1 shadow-xs">
                  <Check className="w-3 h-3 stroke-[3]" />
                  VERIFIED
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  STANDARD
                </span>
              )}
            </div>
            <p className="text-sm font-bold text-[#E5F107] flex items-center justify-center sm:justify-start gap-1.5">
              <Store className="w-4 h-4" />
              <span>{storeName}</span>
            </p>
            <p className="text-xs text-slate-400 font-mono">{email}</p>
          </div>
        </div>

        {/* Top Right Action Controls */}
        <div className="flex items-center gap-2.5 z-10">
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="text-xs font-bold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl bg-[#182133] hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>

      {/* 2. THREE QUICK ACTION CARDS ("INCO Pro AI", "Get Verified", "Invite & Earn") */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Card 1: INCO Pro AI */}
        <div
          onClick={() => {
            sounds.playClick();
            if (onOpenSubscription) onOpenSubscription();
          }}
          className="p-4 sm:p-5 rounded-2xl bg-[#121826] border border-[#1F293D] hover:border-[#E5F107]/50 shadow-md hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#E5F107]/10 border border-[#E5F107]/30 flex items-center justify-center text-[#E5F107]">
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </div>
            <span
              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                isProActive
                  ? "bg-[#E5F107] text-slate-950 font-black shadow-xs"
                  : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}
            >
              {isProActive ? "ACTIVE PRO" : "UPGRADE"}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-black text-white group-hover:text-[#E5F107] transition-colors">
              INCO Pro AI
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isProActive
                ? "Full AI tools, barcode scan & cloud sync active"
                : "Unlock automated stock audits & smart cashier"}
            </p>
          </div>
        </div>

        {/* Card 2: Get Verified */}
        <div
          onClick={() => {
            sounds.playClick();
            if (onOpenVerification) onOpenVerification();
          }}
          className="p-4 sm:p-5 rounded-2xl bg-[#121826] border border-[#1F293D] hover:border-emerald-500/50 shadow-md hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </div>
            <span
              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                isVerified
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              }`}
            >
              {isVerified ? "VERIFIED" : "VERIFY NOW"}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors">
              Merchant Verification
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isVerified ? "Official verified merchant checkmark active" : "Submit KYC ID for instant store verification"}
            </p>
          </div>
        </div>

        {/* Card 3: Invite & Earn */}
        <div
          onClick={() => {
            sounds.playClick();
            inviteSectionRef.current?.scrollIntoView({ behavior: "smooth" });
          }}
          className="p-4 sm:p-5 rounded-2xl bg-[#121826] border border-[#1F293D] hover:border-yellow-400/50 shadow-md hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
              <Gift className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 flex items-center gap-1">
              <Coins className="w-3 h-3" />
              {referralCount} INVITED
            </span>
          </div>
          <div>
            <h3 className="text-sm font-black text-white group-hover:text-yellow-400 transition-colors">
              Invite & Earn Free Months
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Get 1 Month Free INCO Pro AI for every merchant you refer
            </p>
          </div>
        </div>
      </div>

      {/* 3. INVITE REFERRAL SHARE LINK OR BUTTON PLACED UNDER USERS PROFILE */}
      <div
        ref={inviteSectionRef}
        className="p-6 sm:p-8 rounded-3xl bg-linear-to-br from-[#121826] to-[#172033] border-2 border-[#E5F107]/40 shadow-2xl relative overflow-hidden space-y-6"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#E5F107]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#E5F107] text-slate-950 font-black shadow-lg shadow-[#E5F107]/20">
              <Gift className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Invite Merchants & Earn Free INCO Pro
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#E5F107] text-slate-950">
                  REWARD PROGRAM
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Share your personal link with kiosk owners, shops & wholesalers. Both of you receive 1 Month Free INCO Pro AI!
              </p>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2 shrink-0 bg-[#0B0F19]/80 px-4 py-2 rounded-2xl border border-white/10">
            <Award className="w-4 h-4 text-[#E5F107]" />
            <div className="text-right">
              <span className="text-xs font-black text-[#E5F107] block">{freeMonthsEarned} Months Free</span>
              <span className="text-[10px] text-slate-400">{referralCount} merchants joined</span>
            </div>
          </div>
        </div>

        {/* Referral Code & Share Link Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Referral Code Badge */}
          <div className="md:col-span-4 bg-[#0B0F19] p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">Your Referral Code</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-base sm:text-lg font-black text-[#E5F107] font-mono tracking-wider">
                {referralCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-2.5 py-1.5 rounded-xl bg-[#182133] hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* Referral Link & Action Buttons */}
          <div className="md:col-span-8 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  className="w-full py-3 px-3.5 bg-[#0B0F19] border border-white/10 rounded-2xl text-xs font-mono text-slate-300 focus:outline-hidden"
                />
              </div>

              {/* Copy Link Button */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-3 bg-[#E5F107] hover:bg-[#d6e206] text-slate-950 font-black text-xs rounded-2xl shadow-md cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 shrink-0"
              >
                {copiedLink ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4 stroke-[2.5]" />}
                <span>{copiedLink ? "Copied Link!" : "Copy Link"}</span>
              </button>
            </div>

            {/* Direct Share Buttons (WhatsApp & Multi-Platform) */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex-1 py-2.5 px-3.5 bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Share via WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleNativeShare}
                className="flex-1 py-2.5 px-3.5 bg-[#182133] hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Share2 className="w-4 h-4 text-[#E5F107]" />
                <span>Share via Phone / Apps</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. STORE & BUSINESS DETAILS (UNIFIED WITH PROFILE) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#121826] border border-[#1F293D] shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-[#1A2333] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-[#E5F107]/10 text-[#E5F107] border border-[#E5F107]/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Store & Business Details
              </h2>
              <p className="text-xs text-slate-400">
                Configure your shop name, multi-currency, store logo, theme, and physical address
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveProfileAndStore} className="space-y-6">
          {/* Shop Name & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
                <Store className="w-4 h-4 text-[#E5F107]" />
                <span>Shop / Business Name *</span>
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Inco Smart Shop, City Supermarket"
                className="w-full p-3 bg-[#0B0F19] border border-[#1A2333] rounded-2xl text-sm font-semibold text-white focus:outline-hidden focus:border-[#E5F107] transition-colors"
              />
            </div>

            {/* Currency Selector */}
            <div className="relative">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
                <DollarSign className="w-4 h-4 text-[#E5F107]" />
                <span>Store Currency *</span>
              </label>
              <button
                type="button"
                onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                className="w-full p-3 bg-[#0B0F19] border border-[#1A2333] rounded-2xl text-sm font-semibold text-white flex items-center justify-between focus:outline-hidden focus:border-[#E5F107] transition-colors cursor-pointer text-left"
              >
                <span>
                  {selectedCurrencyObj
                    ? `${selectedCurrencyObj.flag} ${selectedCurrencyObj.code} (${selectedCurrencyObj.symbol}) - ${selectedCurrencyObj.name}`
                    : `${selectedCurrencyCode} (${customSymbol})`}
                </span>
                <span className="text-xs text-slate-400">Change ▼</span>
              </button>

              {/* Currency Dropdown Menu */}
              {showCurrencyDropdown && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-[#121826] border border-[#1F293D] rounded-2xl shadow-2xl p-3 z-30 space-y-2 max-h-60 overflow-hidden flex flex-col">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={currencySearch}
                      onChange={(e) => setCurrencySearch(e.target.value)}
                      placeholder="Search currency (e.g. USD, EUR, NGN, Rand)..."
                      className="w-full py-2 pl-9 pr-3 bg-[#0B0F19] border border-white/10 rounded-xl text-xs text-white focus:outline-hidden"
                    />
                  </div>
                  <div className="overflow-y-auto flex-1 space-y-1 pr-1">
                    {filteredCurrencies.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          setSelectedCurrencyCode(c.code);
                          setCustomSymbol(c.symbol);
                          setShowCurrencyDropdown(false);
                          sounds.playClick();
                        }}
                        className={`w-full p-2 rounded-xl text-xs flex items-center justify-between text-left transition-colors cursor-pointer ${
                          selectedCurrencyCode === c.code
                            ? "bg-[#E5F107] text-slate-950 font-black"
                            : "hover:bg-slate-800 text-slate-300"
                        }`}
                      >
                        <span className="truncate">
                          {c.flag} <strong>{c.code}</strong> - {c.name}
                        </span>
                        <span className="font-mono ml-2 font-bold">{c.symbol}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* STORE & BUSINESS LOGO SELECTOR */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0B0F19] border border-[#1A2333] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs uppercase font-black text-slate-300 flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-[#E5F107]" />
                  <span>Store & Business Logo</span>
                </label>
                <p className="text-[11px] text-slate-400">
                  Featured on POS receipts, shelf banners & checkout displays
                </p>
              </div>
              {isProcessingLogo && (
                <span className="text-xs text-[#E5F107] font-bold animate-pulse">
                  Optimizing Logo...
                </span>
              )}
            </div>

            {/* Hidden Inputs for Logo */}
            <input
              type="file"
              ref={logoFileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleLogoFile(file);
              }}
            />
            <input
              type="file"
              ref={logoCameraInputRef}
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleLogoFile(file);
              }}
            />

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#E5F107]/60 bg-[#121826] flex items-center justify-center shrink-0">
                {businessLogo ? (
                  <img src={businessLogo} alt="Store Logo" className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-8 h-8 text-slate-500" />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => logoCameraInputRef.current?.click()}
                  className="px-3 py-2 bg-[#E5F107] hover:bg-[#d6e206] text-slate-950 font-black text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>Take Logo Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => logoFileInputRef.current?.click()}
                  className="px-3 py-2 bg-[#182133] hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 cursor-pointer transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Upload className="w-4 h-4 text-[#E5F107]" />
                  <span>Upload Logo File</span>
                </button>
              </div>
            </div>

            {/* Logo Feed */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {logoFeed.map((url, idx) => (
                <button
                  key={`${url}-${idx}`}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setBusinessLogo(url);
                  }}
                  className={`w-12 h-12 rounded-xl overflow-hidden border-2 shrink-0 cursor-pointer transition-all ${
                    businessLogo === url
                      ? "border-[#E5F107] ring-2 ring-[#E5F107]/40 scale-105"
                      : "border-slate-700 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={url} alt={`Logo ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* MERCHANT PHOTO SELECTOR */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0B0F19] border border-[#1A2333] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs uppercase font-black text-slate-300 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#E5F107]" />
                  <span>Merchant Photo & Selfie</span>
                </label>
                <p className="text-[11px] text-slate-400">
                  Displayed on merchant profile badge & staff ID card
                </p>
              </div>
              {isProcessingAvatar && (
                <span className="text-xs text-[#E5F107] font-bold animate-pulse">
                  Optimizing Photo...
                </span>
              )}
            </div>

            {/* Hidden Inputs for Avatar */}
            <input
              type="file"
              ref={avatarFileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAvatarFile(file);
              }}
            />
            <input
              type="file"
              ref={avatarCameraInputRef}
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAvatarFile(file);
              }}
            />

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#E5F107]/60 bg-[#121826] flex items-center justify-center shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-slate-500" />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => avatarCameraInputRef.current?.click()}
                  className="px-3 py-2 bg-[#E5F107] hover:bg-[#d6e206] text-slate-950 font-black text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>Take Selfie (Camera)</span>
                </button>
                <button
                  type="button"
                  onClick={() => avatarFileInputRef.current?.click()}
                  className="px-3 py-2 bg-[#182133] hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 cursor-pointer transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Upload className="w-4 h-4 text-[#E5F107]" />
                  <span>Upload Custom Photo</span>
                </button>
              </div>
            </div>

            {/* Avatar Feed */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {avatarFeed.map((url, idx) => (
                <button
                  key={`${url}-${idx}`}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setAvatarUrl(url);
                  }}
                  className={`w-12 h-12 rounded-full overflow-hidden border-2 shrink-0 cursor-pointer transition-all ${
                    avatarUrl === url
                      ? "border-[#E5F107] ring-2 ring-[#E5F107]/40 scale-105"
                      : "border-slate-700 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={url} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Contact Details & Physical Store Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
                <User className="w-4 h-4 text-[#E5F107]" />
                <span>Merchant Full Name</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Merchant Name"
                className="w-full p-3 bg-[#0B0F19] border border-[#1A2333] rounded-2xl text-sm font-semibold text-white focus:outline-hidden focus:border-[#E5F107] transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
                <Phone className="w-4 h-4 text-[#E5F107]" />
                <span>Contact Phone</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+266 1234 5678"
                className="w-full p-3 bg-[#0B0F19] border border-[#1A2333] rounded-2xl text-sm font-semibold text-white focus:outline-hidden focus:border-[#E5F107] transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
                <MapPin className="w-4 h-4 text-[#E5F107]" />
                <span>Physical Store Location</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Maseru Market, Central District"
                className="w-full p-3 bg-[#0B0F19] border border-[#1A2333] rounded-2xl text-sm font-semibold text-white focus:outline-hidden focus:border-[#E5F107] transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
                <Mail className="w-4 h-4 text-[#E5F107]" />
                <span>Low-Stock Alert Email</span>
              </label>
              <input
                type="email"
                value={alertEmail}
                onChange={(e) => setAlertEmail(e.target.value)}
                placeholder="alerts@inco.app"
                className="w-full p-3 bg-[#0B0F19] border border-[#1A2333] rounded-2xl text-sm font-semibold text-white focus:outline-hidden focus:border-[#E5F107] transition-colors"
              />
            </div>
          </div>

          {/* Theme & Sound Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-[#0B0F19] p-3.5 rounded-2xl border border-white/10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                  {darkMode ? <Moon className="w-4 h-4 text-[#E5F107]" /> : <Sun className="w-4 h-4 text-amber-400" />}
                  <span>Global Dark Theme</span>
                </div>
                <p className="text-[10px] text-slate-400">Night shift & low-glare storage rooms</p>
              </div>
              <button
                type="button"
                onClick={() => setDarkMode(!darkMode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-colors cursor-pointer ${
                  darkMode ? "bg-[#E5F107] text-slate-950 font-black shadow-xs" : "bg-slate-800 text-slate-300"
                }`}
              >
                {darkMode ? "ON" : "OFF"}
              </button>
            </div>

            <div className="bg-[#0B0F19] p-3.5 rounded-2xl border border-white/10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                  {enableSound ? <Volume2 className="w-4 h-4 text-[#E5F107]" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                  <span>Sound Effects</span>
                </div>
                <p className="text-[10px] text-slate-400">POS checkout chimes & scanner beeps</p>
              </div>
              <button
                type="button"
                onClick={() => setEnableSound(!enableSound)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-colors cursor-pointer ${
                  enableSound ? "bg-[#E5F107] text-slate-950 font-black shadow-xs" : "bg-slate-800 text-slate-300"
                }`}
              >
                {enableSound ? "ON" : "OFF"}
              </button>
            </div>
          </div>

          {/* Bright Yellow Save Changes Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 bg-[#E5F107] hover:bg-[#d6e206] text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-[#E5F107]/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>Save Profile & Store Changes</span>
            </button>
          </div>
        </form>
      </div>

      {/* 5. SECURITY & FIREBASE PASSWORD MANAGEMENT */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#121826] border border-[#1F293D] shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-[#1A2333] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-[#E5F107]/10 text-[#E5F107] border border-[#E5F107]/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">Security & Password</h2>
              <p className="text-xs text-slate-400">Update your Firebase authentication credentials</p>
            </div>
          </div>
        </div>

        {passwordStatus && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${
              passwordStatus.type === "success"
                ? "bg-emerald-950/60 border border-emerald-800 text-emerald-300"
                : "bg-rose-950/60 border border-rose-800 text-rose-300"
            }`}
          >
            {passwordStatus.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{passwordStatus.message}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400">Current Password (verification)</label>
            <input
              type={showPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="mt-1 w-full p-3 bg-[#0B0F19] border border-[#1A2333] rounded-2xl text-sm text-white focus:outline-hidden focus:border-[#E5F107] transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400">New Password (min 6 chars)</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full p-3 pr-10 bg-[#0B0F19] border border-[#1A2333] rounded-2xl text-sm text-white focus:outline-hidden focus:border-[#E5F107] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400">Confirm New Password</label>
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                className="mt-1 w-full p-3 bg-[#0B0F19] border border-[#1A2333] rounded-2xl text-sm text-white focus:outline-hidden focus:border-[#E5F107] transition-colors"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="px-6 py-3 bg-[#182133] hover:bg-[#E5F107] hover:text-slate-950 text-[#E5F107] border border-[#E5F107]/30 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer disabled:opacity-50"
            >
              {isUpdatingPassword ? "Updating Password..." : "Update Password"}
            </button>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="pt-4 border-t border-rose-950/60 mt-6">
          <div className="p-4 bg-rose-950/20 border border-rose-900/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Delete Merchant Account</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Permanently remove store data, credentials, and tenant membership.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setShowDeleteModal(true);
              }}
              className="px-4 py-2 bg-rose-900/40 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-800 font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#121826] border border-rose-600 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-950/80 border border-rose-700 flex items-center justify-center mx-auto text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-black text-white text-lg">Permanently Delete Account?</h3>
              <p className="text-xs text-slate-300 mt-1">
                This action is permanent. All products, sales history, and store permissions will be wiped.
              </p>
            </div>

            {deleteError && (
              <div className="p-2.5 bg-rose-950 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Type <strong className="text-rose-400">DELETE</strong> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmWord}
                  onChange={(e) => setDeleteConfirmWord(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full p-2.5 bg-[#0B0F19] border border-rose-800 rounded-xl text-center text-xs font-mono text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Account Password (verification):
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full p-2.5 bg-[#0B0F19] border border-[#1A2333] rounded-xl text-xs text-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmWord("");
                  setDeletePassword("");
                  setDeleteError(null);
                }}
                className="flex-1 py-2.5 bg-[#182133] hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmWord.trim().toUpperCase() !== "DELETE" || isDeleting}
                onClick={handleDeleteAccountConfirm}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
