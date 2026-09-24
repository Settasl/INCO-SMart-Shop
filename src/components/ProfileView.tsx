import React, { useState, useRef } from "react";
import { UserProfile, StoreSettings } from "../types";
import { useAuth } from "../context/AuthContext";
import { sounds } from "../lib/sound";
import { compressImage, PRESET_AVATARS, PRESET_BUSINESS_LOGOS } from "../lib/imageUtils";
import { safeStorage } from "../lib/safeStorage";
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
} from "lucide-react";

interface ProfileViewProps {
  userProfile: UserProfile;
  settings: StoreSettings;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onShowToast: (msg: string, type?: "success" | "info" | "error") => void;
  onLogout?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userProfile,
  settings,
  onUpdateProfile,
  onShowToast,
  onLogout,
}) => {
  const { changePassword, deleteAccount } = useAuth();

  // Basic Profile Info
  const [fullName, setFullName] = useState(userProfile.displayName || "Store Merchant");
  const [email, setEmail] = useState(userProfile.identifier || "admin@settaholdings.com");
  const [phone, setPhone] = useState(userProfile.location || "+266 1234 5678");
  const [storeName, setStoreName] = useState(userProfile.storeName || settings.storeName || "My Store");
  const [location, setLocation] = useState(userProfile.location || "");
  const [role, setRole] = useState(
    (userProfile.identifier || "").toLowerCase() === "settaholdings@gmail.com"
      ? "Super Admin"
      : "Store Administrator"
  );

  // Avatar & Logo State
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

  // Password Management State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Account Deletion State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmWord, setDeleteConfirmWord] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // --- AVATAR UPLOAD HANDLER (Camera & File) ---
  const handleAvatarFile = async (file: File) => {
    setIsProcessingAvatar(true);
    try {
      // Compress to lightweight 400x400 JPEG (~30KB)
      const compressed = await compressImage(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.85,
        format: "image/jpeg",
      });

      setAvatarUrl(compressed);
      onUpdateProfile({ avatarUrl: compressed });
      sounds.playSuccess();
      onShowToast("Profile picture updated and saved to feed!", "success");

      // Save to feed
      setAvatarFeed((prev) => {
        const next = [compressed, ...prev.filter((p) => p !== compressed)].slice(0, 16);
        safeStorage.setJSON("inco_user_avatar_feed", next);
        return next;
      });
    } catch (err: any) {
      console.error("[ProfileView] Avatar upload error:", err);
      onShowToast("Failed to process image. Please try another photo.", "error");
    } finally {
      setIsProcessingAvatar(false);
    }
  };

  // --- BUSINESS LOGO UPLOAD HANDLER (Camera & File) ---
  const handleLogoFile = async (file: File) => {
    setIsProcessingLogo(true);
    try {
      // Compress to lightweight 400x400 JPEG (~30KB)
      const compressed = await compressImage(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.85,
        format: "image/jpeg",
      });

      setBusinessLogo(compressed);
      onUpdateProfile({ businessLogo: compressed, logoUrl: compressed });
      sounds.playSuccess();
      onShowToast("Business & store logo updated successfully!", "success");

      // Save to logo feed
      setLogoFeed((prev) => {
        const next = [compressed, ...prev.filter((p) => p !== compressed)].slice(0, 16);
        safeStorage.setJSON("inco_user_logo_feed", next);
        return next;
      });
    } catch (err: any) {
      console.error("[ProfileView] Logo upload error:", err);
      onShowToast("Failed to process logo image. Please try another photo.", "error");
    } finally {
      setIsProcessingLogo(false);
    }
  };

  // --- SAVE PROFILE DETAILS ---
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playSuccess();
    onUpdateProfile({
      displayName: fullName.trim(),
      identifier: email.trim(),
      storeName: storeName.trim(),
      location: location.trim(),
      avatarUrl,
      businessLogo,
      logoUrl: businessLogo,
      lastProfileUpdatedAt: new Date().toISOString(),
    });
    onShowToast("Merchant profile & store branding updated!", "success");
  };

  // --- PASSWORD UPDATE ---
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const initials =
    fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "SH";

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <User className="w-6 h-6 text-amber-400" />
            <span>Merchant Profile & Store Branding</span>
          </h1>
          <p className="text-xs text-slate-400">
            Manage your merchant photo, business logo, store credentials, and security
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-xl border border-amber-400/30 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Verified Merchant</span>
          </span>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>

      {/* SECTION 1: MERCHANT PHOTO & AVATAR FEED */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#121826] border border-[#1F293D] shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-[#1A2333] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Merchant Profile Photo</h2>
              <p className="text-xs text-slate-400">
                Take a selfie, upload a custom picture, or pick from the avatar feed
              </p>
            </div>
          </div>
          {isProcessingAvatar && (
            <span className="text-xs text-amber-400 font-bold animate-pulse">
              Optimizing Photo...
            </span>
          )}
        </div>

        {/* Hidden File Inputs for Avatar */}
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

        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar Preview */}
          <div className="relative group shrink-0">
            <div className="w-28 h-28 rounded-full overflow-hidden border-3 border-amber-400 ring-4 ring-amber-400/20 shadow-xl bg-[#0B0F19] flex items-center justify-center">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-amber-400 font-black text-3xl">{initials}</span>
              )}
            </div>

            {/* Quick Hover Overlay */}
            <div
              onClick={() => avatarFileInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-slate-950/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer text-[10px] font-bold"
            >
              <Camera className="w-6 h-6 text-amber-400 mb-1" />
              <span>Change Photo</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex-1 text-center sm:text-left space-y-3">
            <div>
              <h3 className="text-lg font-black text-white">{fullName}</h3>
              <p className="text-xs text-amber-400 font-semibold">{role}</p>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{email}</p>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              {/* Take Photo with Camera */}
              <button
                type="button"
                onClick={() => avatarCameraInputRef.current?.click()}
                className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Camera className="w-4 h-4 text-slate-950" />
                <span>Take Photo (Camera)</span>
              </button>

              {/* Upload Custom File */}
              <button
                type="button"
                onClick={() => avatarFileInputRef.current?.click()}
                className="px-3.5 py-2 bg-[#182133] hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 shadow-md cursor-pointer transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Upload className="w-4 h-4 text-amber-400" />
                <span>Upload Custom Photo</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Supports live camera capture, JPG, PNG, and WebP. Automatically optimized for ultra-fast loading.
            </p>
          </div>
        </div>

        {/* Avatar Feed & Gallery */}
        <div className="pt-4 border-t border-[#1A2333] space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs uppercase font-bold text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Avatar Feed & Photo Gallery</span>
            </label>
            <span className="text-xs text-slate-500">
              Tap any avatar to switch instantly
            </span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
            {/* Direct Camera launcher tile inside feed */}
            <button
              type="button"
              onClick={() => avatarCameraInputRef.current?.click()}
              className="w-14 h-14 rounded-2xl border-2 border-dashed border-amber-400/60 hover:border-amber-400 bg-amber-400/10 flex flex-col items-center justify-center text-amber-400 shrink-0 cursor-pointer transition-all hover:scale-105 active:scale-95"
              title="Take Photo with Camera"
            >
              <Camera className="w-5 h-5 mb-0.5" />
              <span className="text-[9px] font-black">Camera</span>
            </button>

            {/* Direct Upload tile inside feed */}
            <button
              type="button"
              onClick={() => avatarFileInputRef.current?.click()}
              className="w-14 h-14 rounded-2xl border-2 border-dashed border-slate-600 hover:border-slate-400 bg-slate-800/40 flex flex-col items-center justify-center text-slate-300 shrink-0 cursor-pointer transition-all hover:scale-105 active:scale-95"
              title="Upload File"
            >
              <Upload className="w-5 h-5 mb-0.5 text-slate-400" />
              <span className="text-[9px] font-bold">Upload</span>
            </button>

            {avatarFeed.map((url, index) => {
              const isSelected = avatarUrl === url;
              return (
                <button
                  key={`${url}-${index}`}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setAvatarUrl(url);
                    onUpdateProfile({ avatarUrl: url });
                    onShowToast("Profile avatar selected!", "info");
                  }}
                  className={`w-14 h-14 rounded-2xl overflow-hidden border-2 shrink-0 transition-all active:scale-95 relative cursor-pointer ${
                    isSelected
                      ? "border-amber-400 ring-4 ring-amber-400/40 scale-105 shadow-lg shadow-amber-400/20"
                      : "border-slate-700 opacity-75 hover:opacity-100 hover:border-slate-500"
                  }`}
                  title="Click to apply avatar"
                >
                  <img
                    src={url}
                    alt={`Avatar ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-amber-400/30 backdrop-blur-[1px] flex items-center justify-center">
                      <Check className="w-5 h-5 text-slate-950 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 2: BUSINESS / STORE LOGO SELECTOR */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#121826] border border-[#1F293D] shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-[#1A2333] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Store & Business Logo</h2>
              <p className="text-xs text-slate-400">
                Display your shop banner, storefront, or custom business emblem
              </p>
            </div>
          </div>
          {isProcessingLogo && (
            <span className="text-xs text-amber-400 font-bold animate-pulse">
              Optimizing Logo...
            </span>
          )}
        </div>

        {/* Hidden File Inputs for Logo */}
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
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleLogoFile(file);
          }}
        />

        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Logo Preview Tile */}
          <div className="relative group shrink-0">
            <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-amber-400/60 ring-4 ring-amber-400/15 shadow-xl bg-[#0B0F19] flex items-center justify-center p-1">
              {businessLogo ? (
                <img
                  src={businessLogo}
                  alt="Business Logo"
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-500">
                  <Building2 className="w-10 h-10 text-amber-400/60 mb-1" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    No Logo Set
                  </span>
                </div>
              )}
            </div>

            {/* Quick Hover Overlay */}
            <div
              onClick={() => logoFileInputRef.current?.click()}
              className="absolute inset-0 rounded-2xl bg-slate-950/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer text-[10px] font-bold"
            >
              <Upload className="w-6 h-6 text-amber-400 mb-1" />
              <span>Change Logo</span>
            </div>
          </div>

          {/* Action Buttons for Business Logo */}
          <div className="flex-1 text-center sm:text-left space-y-3">
            <div>
              <h3 className="text-lg font-black text-white">
                {storeName || "My Store Logo"}
              </h3>
              <p className="text-xs text-slate-400">
                {businessLogo
                  ? "Custom business branding active across invoices, receipts, and headers"
                  : "Upload a store logo or storefront photo to personalize your shop"}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              {/* Take Photo with Camera */}
              <button
                type="button"
                onClick={() => logoCameraInputRef.current?.click()}
                className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Camera className="w-4 h-4 text-slate-950" />
                <span>Snap Storefront (Camera)</span>
              </button>

              {/* Upload Custom Logo File */}
              <button
                type="button"
                onClick={() => logoFileInputRef.current?.click()}
                className="px-3.5 py-2 bg-[#182133] hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 shadow-md cursor-pointer transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Upload className="w-4 h-4 text-amber-400" />
                <span>Upload Logo File</span>
              </button>

              {businessLogo && (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setBusinessLogo("");
                    onUpdateProfile({ businessLogo: "", logoUrl: "" });
                    onShowToast("Business logo removed.", "info");
                  }}
                  className="px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-bold text-xs rounded-xl border border-rose-800 cursor-pointer transition-colors flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remove Logo</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Ideal for store logos, kiosk signage, and product catalog branding.
            </p>
          </div>
        </div>

        {/* Preset Store Logo Feed */}
        <div className="pt-4 border-t border-[#1A2333] space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs uppercase font-bold text-slate-400 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Preset Retail & Kiosk Storefront Themes</span>
            </label>
            <span className="text-xs text-slate-500">Tap to apply preset logo</span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
            {logoFeed.map((url, index) => {
              const isSelected = businessLogo === url;
              return (
                <button
                  key={`${url}-${index}`}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setBusinessLogo(url);
                    onUpdateProfile({ businessLogo: url, logoUrl: url });
                    onShowToast("Store logo applied!", "info");
                  }}
                  className={`w-14 h-14 rounded-2xl overflow-hidden border-2 shrink-0 transition-all active:scale-95 relative cursor-pointer ${
                    isSelected
                      ? "border-amber-400 ring-4 ring-amber-400/40 scale-105 shadow-lg shadow-amber-400/20"
                      : "border-slate-700 opacity-75 hover:opacity-100 hover:border-slate-500"
                  }`}
                  title="Click to apply store logo"
                >
                  <img
                    src={url}
                    alt={`Logo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-amber-400/30 backdrop-blur-[1px] flex items-center justify-center">
                      <Check className="w-5 h-5 text-slate-950 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 3: STORE & MERCHANT CREDENTIALS FORM */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#121826] border border-[#1F293D] shadow-xl space-y-5">
        <div className="border-b border-[#1A2333] pb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            <span>Store & Merchant Details</span>
          </h2>
          <p className="text-xs text-slate-400">
            Edit your store name, merchant display handle, and contact information
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Full Merchant Name</span>
              </label>
              <div className="relative mt-1">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Setta Holdings"
                  className="w-full p-3 bg-[#0B0F19] border border-[#1A2333] rounded-xl text-sm font-semibold text-white focus:outline-hidden focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-amber-400" />
                <span>Store / Kiosk Name</span>
              </label>
              <div className="relative mt-1">
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Setta Supermarket"
                  className="w-full p-3 bg-[#0B0F19] border border-[#1A2333] rounded-xl text-sm font-semibold text-white focus:outline-hidden focus:border-amber-400 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>Email Address / Login ID</span>
              </label>
              <div className="relative mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@settaholdings.com"
                  className="w-full p-3 bg-[#0B0F19] border border-[#1A2333] rounded-xl text-sm font-semibold text-white focus:outline-hidden focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Contact Phone</span>
              </label>
              <div className="relative mt-1">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+266 1234 5678"
                  className="w-full p-3 bg-[#0B0F19] border border-[#1A2333] rounded-xl text-sm font-semibold text-white focus:outline-hidden focus:border-amber-400 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Physical Store Location</span>
              </label>
              <div className="relative mt-1">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Maseru Market, Stall 4B"
                  className="w-full p-3 bg-[#0B0F19] border border-[#1A2333] rounded-xl text-sm font-semibold text-white focus:outline-hidden focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400">Account Role</label>
              <div className="relative mt-1">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-3 bg-[#0B0F19] border border-[#1A2333] rounded-xl text-sm font-semibold text-white focus:outline-hidden focus:border-amber-400 transition-colors cursor-pointer"
                >
                  <option value="Super Admin" className="bg-slate-900 text-white">
                    Super Admin
                  </option>
                  <option value="Store Administrator" className="bg-slate-900 text-white">
                    Store Administrator
                  </option>
                  <option value="Inventory Manager" className="bg-slate-900 text-white">
                    Inventory Manager
                  </option>
                  <option value="Cashier / POS Clerk" className="bg-slate-900 text-white">
                    Cashier / POS Clerk
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Bright Yellow Save Changes Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-400/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Save Profile & Store Changes</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 4: SECURITY & FIREBASE AUTH PASSWORD MANAGEMENT */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#121826] border border-[#1F293D] shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-[#1A2333] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Security & Password</h2>
              <p className="text-xs text-slate-400">
                Update your Firebase authentication credentials
              </p>
            </div>
          </div>
        </div>

        {passwordStatus && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
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
            <label className="text-xs font-bold text-slate-400">
              Current Password (verification)
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
              className="mt-1 w-full p-3 bg-[#0B0F19] border border-[#1A2333] rounded-xl text-sm text-white focus:outline-hidden focus:border-amber-400 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400">
                New Password (min 6 chars)
              </label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full p-3 pr-10 bg-[#0B0F19] border border-[#1A2333] rounded-xl text-sm text-white focus:outline-hidden focus:border-amber-400 transition-colors"
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
                className="mt-1 w-full p-3 bg-[#0B0F19] border border-[#1A2333] rounded-xl text-sm text-white focus:outline-hidden focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="px-6 py-3 bg-[#182133] hover:bg-amber-400 hover:text-slate-950 text-amber-400 border border-amber-400/30 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
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
