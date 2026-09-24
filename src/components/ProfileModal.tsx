import React, { useState, useRef, useEffect } from "react";
import {
  X,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Camera,
  Upload,
  CreditCard,
  Zap,
  Sparkles,
  Award,
  FileText,
  Clock,
  ArrowRight,
  Check,
  Lock,
  Unlock,
  DollarSign,
  Smartphone,
  Building,
  Coins,
  BadgePercent,
  Trash2,
  KeyRound,
  HeartPulse,
  Phone,
  ShieldAlert,
  Send,
  HelpCircle,
  Eye,
  EyeOff,
  Gift,
  Share2,
  Copy,
  MessageCircle,
  Store,
  Building2,
  Image as ImageIcon,
} from "lucide-react";
import { UserProfile, PaymentRequest, VerificationRequest } from "../types";
import { BrandLogo } from "./BrandLogo";
import { sounds } from "../lib/sound";
import { encryptHealthData, decryptHealthData, HealthVaultData } from "../lib/crypto";
import { useAuth } from "../context/AuthContext";
import { compressImage, PRESET_AVATARS, PRESET_BUSINESS_LOGOS } from "../lib/imageUtils";
import { safeStorage } from "../lib/safeStorage";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onSubmitVerification: (req: Omit<VerificationRequest, "id" | "status" | "submittedAt">) => void;
  onSubmitPaymentRequest: (req: Omit<PaymentRequest, "id" | "status" | "submittedAt">) => void;
  onDeleteAccount: () => void;
  onOpenAdminPortal?: () => void;
  onLogout: () => void;
  onShowToast: (message: string, type?: "success" | "info" | "error") => void;
}

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=140&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=140&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=140&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=140&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=140&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=140&auto=format&fit=crop&q=80",
];

const COOLDOWN_DAYS = 30;

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile,
  onSubmitVerification,
  onSubmitPaymentRequest,
  onDeleteAccount,
  onOpenAdminPortal,
  onLogout,
  onShowToast,
}) => {
  const { changePassword, deleteAccount } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "profile" | "referrals" | "health_vault" | "verification" | "subscription"
  >("profile");

  // Profile Edit Form State
  const [displayName, setDisplayName] = useState(userProfile.displayName || "Store Merchant");
  const [avatarUrl, setAvatarUrl] = useState(userProfile.avatarUrl);
  const [businessLogo, setBusinessLogo] = useState(userProfile.businessLogo || userProfile.logoUrl || "");
  const [storeName, setStoreName] = useState(userProfile.storeName || "Provision Store");
  const [location, setLocation] = useState(userProfile.location || "");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);

  // Avatar Feed History State
  const [avatarFeed, setAvatarFeed] = useState<string[]>(() => {
    const stored = safeStorage.getJSON<string[]>("inco_user_avatar_feed", []);
    return Array.from(new Set([userProfile.avatarUrl, ...stored, ...PRESET_AVATARS])).filter(Boolean);
  });

  // Business Logo Feed State
  const [logoFeed, setLogoFeed] = useState<string[]>(() => {
    const stored = safeStorage.getJSON<string[]>("inco_user_logo_feed", []);
    return Array.from(
      new Set([userProfile.businessLogo, userProfile.logoUrl, ...stored, ...PRESET_BUSINESS_LOGOS])
    ).filter(Boolean) as string[];
  });

  // Referral & Rewards State
  const referralCode =
    userProfile.referralCode ||
    `INCO-${(userProfile.storeName || userProfile.displayName || "VIP")
      .replace(/[^A-Za-z0-9]/g, "")
      .toUpperCase()
      .slice(0, 6) || "SHOP"}-${(userProfile.id || "0000").slice(-4).toUpperCase()}`;

  const referralLink = `${window.location.origin}/?ref=${referralCode}`;
  const referralCount = userProfile.referralCount || 0;

  // Reward Tiers:
  // Tier 1: 1-2 Invites -> 10% Pro Discount
  // Tier 2: 3-5 Invites -> 1 Month Free Pro AI
  // Tier 3: 6-9 Invites -> 3 Months Free Pro AI + Priority Support
  // Tier 4: 10+ Invites -> Lifetime Free Pro Access & VIP Store Badge
  let currentTierTitle = "Starter Merchant";
  let nextMilestoneGoal = 3;
  let nextRewardLabel = "1 Month Free Pro AI";
  let activePerk = "Share invite code with fellow store owners to unlock free perks!";
  let currentTierBadge = "Bronze";

  if (referralCount >= 10) {
    currentTierTitle = "Platinum Partner";
    currentTierBadge = "Platinum";
    nextMilestoneGoal = 10;
    nextRewardLabel = "Max Tier Reached!";
    activePerk = "Lifetime Free Pro AI Access + VIP Merchant Badge Unlocked!";
  } else if (referralCount >= 6) {
    currentTierTitle = "Gold Ambassador";
    currentTierBadge = "Gold";
    nextMilestoneGoal = 10;
    nextRewardLabel = "Lifetime Free Pro AI (10 Invites)";
    activePerk = "3 Months Free Pro AI Active + Priority Phone Support";
  } else if (referralCount >= 3) {
    currentTierTitle = "Silver Advocate";
    currentTierBadge = "Silver";
    nextMilestoneGoal = 6;
    nextRewardLabel = "3 Months Free Pro AI (6 Invites)";
    activePerk = "1 Month Free Pro AI Unlocked and Active!";
  } else if (referralCount >= 1) {
    currentTierTitle = "Bronze Starter";
    currentTierBadge = "Bronze";
    nextMilestoneGoal = 3;
    nextRewardLabel = "1 Month Free Pro AI (3 Invites)";
    activePerk = "10% Subscription Discount Unlocked!";
  }

  const rewardProgressPercent =
    nextMilestoneGoal > 0 ? Math.min(100, Math.round((referralCount / nextMilestoneGoal) * 100)) : 100;

  const handleShareViaWhatsApp = () => {
    sounds.playClick();
    const message = `🚀 *Join INCO Smart Shop with my invite!*

I use INCO for my store to scan barcodes, manage stock in seconds, and track profit with AI.

Use my exclusive Merchant Code: *${referralCode}* to claim 1 Month FREE Pro AI features!

👉 Register here: ${referralLink}`;

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
    onShowToast("Opened WhatsApp to share your referral invite!", "success");
  };

  const handleCopyReferralCode = () => {
    sounds.playClick();
    navigator.clipboard?.writeText(referralCode);
    onShowToast(`Referral code ${referralCode} copied!`, "success");
  };

  const handleCopyReferralLink = () => {
    sounds.playClick();
    navigator.clipboard?.writeText(referralLink);
    onShowToast("Referral link copied to clipboard!", "success");
  };

  const handleClaimReward = () => {
    sounds.playSuccess();
    onShowToast("Reward perks active! Thank you for inviting merchants to INCO.", "success");
  };

  // 30-Day Cooldown Math
  const lastUpdateTimestamp = userProfile.lastProfileUpdatedAt
    ? new Date(userProfile.lastProfileUpdatedAt).getTime()
    : 0;
  const daysSinceLastUpdate = lastUpdateTimestamp
    ? Math.floor((Date.now() - lastUpdateTimestamp) / (1000 * 60 * 60 * 24))
    : 999;
  const remainingCooldownDays = Math.max(0, COOLDOWN_DAYS - daysSinceLastUpdate);
  const canEditProfileDetails = remainingCooldownDays === 0;

  // Account Deletion State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Change Password in Profile State
  const [showChangePassSection, setShowChangePassSection] = useState(false);
  const [profileCurrentPassword, setProfileCurrentPassword] = useState("");
  const [profileNewPassword, setProfileNewPassword] = useState("");
  const [profileConfirmPassword, setProfileConfirmPassword] = useState("");
  const [profileShowPass, setProfileShowPass] = useState(false);
  const [passUpdateStatus, setPassUpdateStatus] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleProfileChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profileNewPassword.length < 6) {
      setPassUpdateStatus("Password must be at least 6 characters.");
      return;
    }
    if (profileNewPassword !== profileConfirmPassword) {
      setPassUpdateStatus("Passwords do not match.");
      return;
    }

    setIsUpdatingPassword(true);
    setPassUpdateStatus(null);
    try {
      await changePassword(profileNewPassword.trim(), profileCurrentPassword.trim() || undefined);
      sounds.playSuccess();
      setPassUpdateStatus("Success: Password successfully updated!");
      onShowToast("Account password changed successfully!", "success");
      setProfileNewPassword("");
      setProfileConfirmPassword("");
      setProfileCurrentPassword("");
      setTimeout(() => {
        setShowChangePassSection(false);
        setPassUpdateStatus(null);
      }, 2000);
    } catch (err: any) {
      setPassUpdateStatus(err?.message || "Error updating password. Please try again.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeletingAccount(true);
    setDeleteError(null);
    try {
      await deleteAccount(deletePassword.trim() || undefined);
      sounds.playSuccess();
      setShowDeleteModal(false);
      onShowToast("Your account has been deleted.", "info");
      onDeleteAccount();
    } catch (err: any) {
      setDeleteError(err?.message || "Failed to delete account. Please verify password.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Appeal Submission State (for suspended accounts)
  const [appealText, setAppealText] = useState(userProfile.userAppealReason || "");
  const [appealSubmitted, setAppealSubmitted] = useState(false);

  // Encrypted Health Vault State
  const [healthPin, setHealthPin] = useState("");
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [healthData, setHealthData] = useState<HealthVaultData>({
    emergencyContactName: "",
    emergencyContactPhone: "",
    bloodGroup: "O+",
    allergies: "",
    medicalConditions: "",
    emergencyNotes: "",
    lastUpdated: "",
  });
  const [healthVaultError, setHealthVaultError] = useState<string | null>(null);
  const [isEncryptingHealth, setIsEncryptingHealth] = useState(false);

  // KYC Verification Form State
  const [legalName, setLegalName] = useState("");
  const [idType, setIdType] = useState<"National ID" | "Passport" | "Driver's License" | "Voter Card">("National ID");
  const [idNumber, setIdNumber] = useState("");
  const [passportPhoto, setPassportPhoto] = useState<string | null>(null);
  const [idDocPhoto, setIdDocPhoto] = useState<string | null>(null);
  const [kycSubmitted, setKycSubmitted] = useState(false);

  // Subscription Form State
  const [selectedPlan, setSelectedPlan] = useState<"INCO Pro AI" | "Enterprise Cloud" | "Lifetime Kiosk">("INCO Pro AI");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "Mobile Money (M-Pesa/MTN)" | "Credit/Debit Card" | "Bank Transfer" | "Crypto (USDT/BTC)"
  >("Mobile Money (M-Pesa/MTN)");
  const [transactionRef, setTransactionRef] = useState("");
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarCameraInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const logoCameraInputRef = useRef<HTMLInputElement>(null);
  const passportFileRef = useRef<HTMLInputElement>(null);
  const idDocFileRef = useRef<HTMLInputElement>(null);
  const paymentProofFileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

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
      onShowToast("Profile picture updated and saved to feed!", "success");

      setAvatarFeed((prev) => {
        const next = [compressed, ...prev.filter((p) => p !== compressed)].slice(0, 16);
        safeStorage.setJSON("inco_user_avatar_feed", next);
        return next;
      });
    } catch (err: any) {
      console.error("[ProfileModal] Avatar upload error:", err);
      onShowToast("Failed to process image. Please try another file.", "error");
    } finally {
      setIsProcessingAvatar(false);
    }
  };

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
      onUpdateProfile({ businessLogo: compressed, logoUrl: compressed });
      sounds.playSuccess();
      onShowToast("Business & store logo updated successfully!", "success");

      setLogoFeed((prev) => {
        const next = [compressed, ...prev.filter((p) => p !== compressed)].slice(0, 16);
        safeStorage.setJSON("inco_user_logo_feed", next);
        return next;
      });
    } catch (err: any) {
      console.error("[ProfileModal] Logo upload error:", err);
      onShowToast("Failed to process logo image. Please try another file.", "error");
    } finally {
      setIsProcessingLogo(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditProfileDetails) {
      onShowToast(`Name & profile details are locked for ${remainingCooldownDays} more days.`, "error");
      return;
    }

    sounds.playClick();
    sounds.triggerHaptic(10);
    onUpdateProfile({
      displayName: displayName.trim(),
      avatarUrl,
      businessLogo,
      logoUrl: businessLogo,
      storeName: storeName.trim(),
      location: location.trim(),
      lastProfileUpdatedAt: new Date().toISOString(),
    });
    setSaveSuccess(true);
    onShowToast("Profile details saved! Next update available in 30 days.", "success");
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Submit unblock / unsuspension appeal
  const handleSubmitAppeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealText.trim()) return;

    sounds.playSuccess();
    onUpdateProfile({
      userAppealReason: appealText.trim(),
      appealSubmittedAt: new Date().toISOString(),
    });
    setAppealSubmitted(true);
    onShowToast("Explanation & appeal submitted to INCO Admin desk.", "success");
  };

  // Encrypted Health Vault Unlock
  const handleUnlockHealthVault = async () => {
    if (!healthPin.trim()) {
      setHealthVaultError("Please enter your Vault PIN or Passphrase.");
      return;
    }

    setHealthVaultError(null);
    if (!userProfile.encryptedHealthVault || !userProfile.encryptedHealthVault.ciphertext) {
      // First time initialization
      setIsVaultUnlocked(true);
      sounds.playSuccess();
      return;
    }

    try {
      const decrypted = await decryptHealthData(
        userProfile.encryptedHealthVault.ciphertext,
        userProfile.encryptedHealthVault.salt,
        userProfile.encryptedHealthVault.iv,
        healthPin.trim()
      );
      setHealthData(decrypted);
      setIsVaultUnlocked(true);
      sounds.playSuccess();
      onShowToast("AES-256 Health Vault decrypted successfully!", "success");
    } catch (err: any) {
      setHealthVaultError("Incorrect PIN or passphrase. Please try again.");
      sounds.playBeep();
    }
  };

  // Save Encrypted Health Vault
  const handleSaveEncryptedHealthVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!healthPin.trim()) {
      setHealthVaultError("Security PIN / Passphrase is required to encrypt records.");
      return;
    }

    setIsEncryptingHealth(true);
    setHealthVaultError(null);

    try {
      const payload: HealthVaultData = {
        ...healthData,
        lastUpdated: new Date().toISOString(),
      };

      const encrypted = await encryptHealthData(payload, healthPin.trim());

      onUpdateProfile({
        encryptedHealthVault: {
          ciphertext: encrypted.ciphertext,
          salt: encrypted.salt,
          iv: encrypted.iv,
          lastUpdated: encrypted.lastUpdated,
          isConfigured: true,
        },
      });

      sounds.playSuccess();
      onShowToast("Health & emergency info encrypted and saved securely!", "success");
      setIsVaultUnlocked(false);
      setHealthPin("");
    } catch (err: any) {
      setHealthVaultError("Encryption failed: " + err.message);
    } finally {
      setIsEncryptingHealth(false);
    }
  };

  const handlePassportUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPassportPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleIdDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setIdDocPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePaymentProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPaymentProofUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleKycSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passportPhoto || !idDocPhoto) {
      alert("Please upload both your passport photo and government ID document image.");
      return;
    }

    sounds.playSuccess();
    sounds.triggerHaptic(20);

    onSubmitVerification({
      userId: userProfile.id,
      userName: displayName,
      userEmailOrPhone: userProfile.identifier,
      legalName: legalName.trim(),
      idType,
      idNumber: idNumber.trim(),
      passportPhotoUrl: passportPhoto,
      idDocUrl: idDocPhoto,
    });

    onUpdateProfile({
      verificationStatus: "pending",
      verificationDocs: {
        legalName: legalName.trim(),
        idType,
        idNumber: idNumber.trim(),
        passportPhotoUrl: passportPhoto,
        idDocUrl: idDocPhoto,
        submittedAt: new Date().toISOString(),
      },
    });

    setKycSubmitted(true);
  };

  const getPlanPrice = (plan: string) => {
    switch (plan) {
      case "INCO Pro AI":
        return { amount: 19, text: "$19 / month" };
      case "Enterprise Cloud":
        return { amount: 49, text: "$49 / month" };
      case "Lifetime Kiosk":
        return { amount: 149, text: "$149 One-Time Lifetime" };
      default:
        return { amount: 0, text: "Free" };
    }
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionRef.trim()) {
      alert("Please enter the transaction reference / receipt code from your payment.");
      return;
    }

    const price = getPlanPrice(selectedPlan);
    sounds.playSuccess();
    sounds.triggerHaptic(20);

    onSubmitPaymentRequest({
      userId: userProfile.id,
      userName: displayName,
      userEmailOrPhone: userProfile.identifier,
      userAvatar: avatarUrl,
      planName: selectedPlan,
      amount: price.amount,
      currency: "USD",
      paymentMethod: selectedPaymentMethod,
      transactionRef: transactionRef.trim(),
      proofUrl: paymentProofUrl || undefined,
    });

    onUpdateProfile({
      subscription: {
        ...userProfile.subscription,
        plan: selectedPlan,
        status: "pending_approval",
        paymentMethod: selectedPaymentMethod,
        transactionRef: transactionRef.trim(),
        amount: price.amount,
        submittedAt: new Date().toISOString(),
      },
    });

    setPaymentSubmitted(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <div className="bg-slate-900 border border-yellow-400/60 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden neon-border-amber font-sans my-auto">
        {/* Top Header */}
        <div className="p-3 sm:p-4 bg-slate-950/95 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <BrandLogo size="xs" showText={false} />
            <div>
              <div className="flex items-center gap-1.5">
                <h2 id="profile-modal-title" className="text-sm sm:text-base font-black text-white">
                  Merchant Account & Security Vault
                </h2>
                {userProfile.isVerified && (
                  <span className="text-[9px] uppercase font-black px-1.5 py-0.2 rounded-full bg-yellow-400 text-slate-950 flex items-center gap-0.5 shadow-xs">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                    VERIFIED
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {userProfile.identifier} • Role: {userProfile.role.toUpperCase()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Suspended Account Appeal Alert */}
        {(userProfile.accountStatus === "suspended" || userProfile.accountStatus === "blocked") && (
          <div className="p-3 bg-rose-950/80 border-b border-rose-800 text-rose-200 text-xs space-y-2">
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-bold">
                  Account {userProfile.accountStatus === "blocked" ? "Blocked" : "Suspended"} by Admin
                </strong>
                <span className="text-[11px] text-rose-300">
                  Reason: {userProfile.suspensionReason || "Policy verification or identity audit required."}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmitAppeal} className="bg-slate-950/80 p-2.5 rounded-xl border border-rose-900/60 space-y-2">
              <label className="block text-[10px] uppercase font-bold text-slate-300">
                Submit Explanation / Unblock Appeal to Admin
              </label>
              <textarea
                rows={2}
                value={appealText}
                onChange={(e) => setAppealText(e.target.value)}
                placeholder="Explain the situation or provide requested justification to the admin..."
                className="w-full p-2 bg-slate-900 border border-slate-750 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-yellow-400"
              />
              <div className="flex items-center justify-between">
                {appealSubmitted && (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Appeal sent to admin queue
                  </span>
                )}
                <button
                  type="submit"
                  className="ml-auto px-3 py-1 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-lg text-[11px] flex items-center gap-1 cursor-pointer neon-glow-amber"
                >
                  <Send className="w-3 h-3" />
                  <span>Submit Appeal</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex items-center bg-slate-950 px-2 sm:px-3 pt-2 border-b border-slate-800 gap-1 overflow-x-auto scrollbar-none text-xs shrink-0">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab("profile");
            }}
            className={`pb-2 px-2.5 font-black border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "profile"
                ? "border-yellow-400 text-yellow-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile & Store</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab("referrals");
            }}
            className={`pb-2 px-2.5 font-black border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "referrals"
                ? "border-yellow-400 text-yellow-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <Gift className="w-3.5 h-3.5 text-yellow-400" />
            <span>Invites & Rewards</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-black border border-emerald-500/30">
              {referralCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab("health_vault");
            }}
            className={`pb-2 px-2.5 font-black border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "health_vault"
                ? "border-yellow-400 text-yellow-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
            <span>Encrypted Health Vault</span>
            {userProfile.encryptedHealthVault?.isConfigured && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab("verification");
            }}
            className={`pb-2 px-2.5 font-black border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "verification"
                ? "border-yellow-400 text-yellow-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-yellow-400" />
            <span>KYC Verification</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab("subscription");
            }}
            className={`pb-2 px-2.5 font-black border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "subscription"
                ? "border-yellow-400 text-yellow-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-yellow-400" />
            <span>Pro Subscription</span>
          </button>
        </div>

        {/* Tab 1: Profile & Store Edit */}
        {activeTab === "profile" && (
          <div className="p-3 sm:p-4 space-y-4 overflow-y-auto flex-1 text-xs">
            {/* 30-Day Cooldown Notice */}
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                canEditProfileDetails
                  ? "bg-slate-950/80 border-slate-800 text-slate-300"
                  : "bg-amber-950/40 border-amber-500/50 text-amber-200"
              }`}
            >
              {canEditProfileDetails ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <div className="font-black text-white flex items-center gap-2">
                  <span>30-Day Identity Security Policy</span>
                  {!canEditProfileDetails && (
                    <span className="px-2 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black text-[9px]">
                      Locked: {remainingCooldownDays} days remaining
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {canEditProfileDetails
                    ? "Merchant name and store details can be updated now. Once saved, your details are locked for 30 days to prevent unauthorized identity tampering."
                    : `To protect your store identity, your name and credentials can only be edited once every 30 days. Next edit unlocked on ${
                        userProfile.lastProfileUpdatedAt
                          ? new Date(new Date(userProfile.lastProfileUpdatedAt).getTime() + 30 * 86400000).toLocaleDateString()
                          : "30 days"
                      }.`}
                </p>
              </div>
            </div>

            {/* Profile Picture Upload Feed */}
            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-3">
              <input
                type="file"
                ref={fileInputRef}
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

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative group shrink-0">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-yellow-400 ring-4 ring-yellow-400/20 shadow-lg bg-slate-900 flex items-center justify-center">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-yellow-400 font-black text-xl">
                        {displayName.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-slate-950/70 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold"
                  >
                    <Camera className="w-4 h-4 mb-0.5 text-yellow-400" />
                    <span>Upload</span>
                  </button>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-1">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5">
                    <h3 className="text-sm font-black text-white">{displayName}</h3>
                    <span className="text-[9px] uppercase font-black px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                      {userProfile.role}
                    </span>
                    {isProcessingAvatar && (
                      <span className="text-[10px] text-yellow-400 font-bold animate-pulse">
                        Optimizing...
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">{userProfile.identifier}</p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => avatarCameraInputRef.current?.click()}
                      className="px-2.5 py-1 bg-yellow-400 hover:bg-yellow-300 text-slate-950 text-[10px] font-black rounded-lg inline-flex items-center gap-1 cursor-pointer transition-colors shadow-xs active:scale-95"
                    >
                      <Camera className="w-3 h-3 text-slate-950" />
                      <span>Take Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold rounded-lg inline-flex items-center gap-1 border border-slate-700 cursor-pointer transition-colors active:scale-95"
                    >
                      <Upload className="w-3 h-3 text-yellow-400" />
                      <span>Upload Custom</span>
                    </button>
                    <span className="text-[9px] text-slate-500">Camera, JPG, PNG, WebP</span>
                  </div>
                </div>
              </div>

              {/* Uploads & Preset Avatar Feed */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-yellow-400" />
                    <span>Profile Photo Feed & Avatar Gallery</span>
                  </label>
                  <span className="text-[10px] text-slate-500">Tap avatar to switch</span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                  {/* Camera Launcher in Feed */}
                  <button
                    type="button"
                    onClick={() => avatarCameraInputRef.current?.click()}
                    className="w-10 h-10 rounded-xl border border-dashed border-yellow-400/60 hover:border-yellow-400 bg-yellow-400/10 flex flex-col items-center justify-center text-yellow-400 shrink-0 cursor-pointer transition-all"
                    title="Take Photo with Camera"
                  >
                    <Camera className="w-4 h-4" />
                    <span className="text-[7px] font-black">Camera</span>
                  </button>

                  {/* Upload button inside feed */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-10 h-10 rounded-xl border border-dashed border-slate-600 hover:border-slate-400 bg-slate-800/40 flex flex-col items-center justify-center text-slate-300 shrink-0 cursor-pointer transition-all"
                    title="Upload New Photo"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="text-[7px] font-bold">File</span>
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
                        className={`w-10 h-10 rounded-xl overflow-hidden border-2 shrink-0 transition-transform active:scale-95 relative cursor-pointer ${
                          isSelected
                            ? "border-yellow-400 ring-2 ring-yellow-400/50 scale-105"
                            : "border-slate-700 opacity-70 hover:opacity-100"
                        }`}
                        title="Click to apply avatar"
                      >
                        <img src={url} alt={`Avatar ${index + 1}`} className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-yellow-400/20 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-yellow-400 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Business Logo & Storefront Branding Section */}
            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-3">
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

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative group shrink-0">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-yellow-400/60 ring-2 ring-yellow-400/10 shadow-lg bg-slate-900 flex items-center justify-center p-0.5">
                    {businessLogo ? (
                      <img
                        src={businessLogo}
                        alt="Business Logo"
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-500">
                        <Store className="w-6 h-6 text-yellow-400/60 mb-0.5" />
                        <span className="text-[7px] uppercase font-bold text-slate-400">No Logo</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => logoFileInputRef.current?.click()}
                    className="absolute inset-0 bg-slate-950/70 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold"
                  >
                    <Store className="w-4 h-4 mb-0.5 text-yellow-400" />
                    <span>Upload</span>
                  </button>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-1">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5">
                    <h3 className="text-sm font-black text-white flex items-center gap-1">
                      <Store className="w-3.5 h-3.5 text-yellow-400" />
                      <span>{storeName || "Store & Business Logo"}</span>
                    </h3>
                    {isProcessingLogo && (
                      <span className="text-[10px] text-yellow-400 font-bold animate-pulse">
                        Optimizing...
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {businessLogo ? "Store logo active on receipts and kiosk headers" : "Add your store logo or storefront picture"}
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => logoCameraInputRef.current?.click()}
                      className="px-2.5 py-1 bg-yellow-400 hover:bg-yellow-300 text-slate-950 text-[10px] font-black rounded-lg inline-flex items-center gap-1 cursor-pointer transition-colors shadow-xs active:scale-95"
                    >
                      <Camera className="w-3 h-3 text-slate-950" />
                      <span>Snap Storefront</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => logoFileInputRef.current?.click()}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold rounded-lg inline-flex items-center gap-1 border border-slate-700 cursor-pointer transition-colors active:scale-95"
                    >
                      <Upload className="w-3 h-3 text-yellow-400" />
                      <span>Upload Logo</span>
                    </button>
                    {businessLogo && (
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setBusinessLogo("");
                          onUpdateProfile({ businessLogo: "", logoUrl: "" });
                          onShowToast("Store logo removed.", "info");
                        }}
                        className="px-2 py-1 bg-rose-950/50 hover:bg-rose-900 text-rose-300 text-[10px] font-bold rounded-lg border border-rose-800 cursor-pointer transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Preset Business Logo Options */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <ImageIcon className="w-3 h-3 text-yellow-400" />
                    <span>Preset Retail & Shop Themes</span>
                  </label>
                  <span className="text-[10px] text-slate-500">Tap to apply</span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
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
                        className={`w-10 h-10 rounded-xl overflow-hidden border-2 shrink-0 transition-transform active:scale-95 relative cursor-pointer ${
                          isSelected
                            ? "border-yellow-400 ring-2 ring-yellow-400/50 scale-105"
                            : "border-slate-700 opacity-70 hover:opacity-100"
                        }`}
                        title="Click to apply logo"
                      >
                        <img src={url} alt={`Store Logo ${index + 1}`} className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-yellow-400/20 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-yellow-400 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Profile Fields Form */}
            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Merchant Full Name / Handle
                </label>
                <input
                  type="text"
                  required
                  disabled={!canEditProfileDetails}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-750 focus:border-yellow-400 rounded-xl text-xs text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Store / Kiosk Business Name
                  </label>
                  <input
                    type="text"
                    disabled={!canEditProfileDetails}
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-750 focus:border-yellow-400 rounded-xl text-xs text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    City / Store Location
                  </label>
                  <input
                    type="text"
                    disabled={!canEditProfileDetails}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Market Square, Nairobi"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-750 focus:border-yellow-400 rounded-xl text-xs text-white disabled:opacity-60 disabled:cursor-not-allowed focus:outline-hidden"
                  />
                </div>
              </div>

              {saveSuccess && (
                <div className="p-2 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-lg text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Profile updated and locked for 30 days!</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onLogout();
                  }}
                  className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 font-bold"
                >
                  Log Out
                </button>

                <button
                  type="submit"
                  disabled={!canEditProfileDetails}
                  className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed neon-glow-amber"
                >
                  {canEditProfileDetails ? "Save Profile (30-Day Lock)" : "Locked (30-Day Cooldown)"}
                </button>
              </div>
            </form>

            {/* Security: Change Password */}
            <div className="pt-3 border-t border-slate-850 mt-4">
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <KeyRound className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Change Account Password</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setShowChangePassSection(!showChangePassSection);
                      setPassUpdateStatus(null);
                    }}
                    className="text-[11px] font-bold text-yellow-400 hover:text-yellow-300 underline cursor-pointer"
                  >
                    {showChangePassSection ? "Cancel" : "Update Password"}
                  </button>
                </div>

                {showChangePassSection && (
                  <form onSubmit={handleProfileChangePassword} className="space-y-2.5 pt-1">
                    {passUpdateStatus && (
                      <div
                        className={`p-2 rounded-lg text-xs flex items-center gap-1.5 ${
                          passUpdateStatus.startsWith("Success")
                            ? "bg-emerald-950/70 text-emerald-300 border border-emerald-800"
                            : "bg-rose-950/70 text-rose-300 border border-rose-800"
                        }`}
                      >
                        {passUpdateStatus.startsWith("Success") ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        )}
                        <span>{passUpdateStatus}</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                          Current Password (for verification)
                        </label>
                        <input
                          type="password"
                          value={profileCurrentPassword}
                          onChange={(e) => setProfileCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-hidden focus:border-yellow-400"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                            New Password (min. 6 chars)
                          </label>
                          <div className="relative">
                            <input
                              type={profileShowPass ? "text" : "password"}
                              value={profileNewPassword}
                              onChange={(e) => setProfileNewPassword(e.target.value)}
                              placeholder="Enter new password"
                              required
                              minLength={6}
                              className="w-full px-3 py-1.5 pr-8 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-hidden focus:border-yellow-400"
                            />
                            <button
                              type="button"
                              onClick={() => setProfileShowPass(!profileShowPass)}
                              className="absolute right-2 top-2 text-slate-400 hover:text-white"
                            >
                              {profileShowPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                            Confirm New Password
                          </label>
                          <input
                            type={profileShowPass ? "text" : "password"}
                            value={profileConfirmPassword}
                            onChange={(e) => setProfileConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            required
                            minLength={6}
                            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-hidden focus:border-yellow-400"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isUpdatingPassword}
                      className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs rounded-lg cursor-pointer transition-all shadow-xs flex items-center gap-1 neon-glow-amber disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>{isUpdatingPassword ? "Updating..." : "Save New Password"}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Danger Zone: Delete Account */}
            <div className="pt-3 border-t border-rose-950/80 mt-4">
              <div className="p-3 bg-rose-950/30 border border-rose-900/60 rounded-xl flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-rose-300 text-xs flex items-center gap-1">
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Delete Merchant Account</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Permanently delete your profile, store cloud sync records, and credentials.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-300 font-bold text-xs rounded-lg shrink-0 cursor-pointer transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Invites & Referral Rewards */}
        {activeTab === "referrals" && (
          <div className="p-3 sm:p-4 space-y-4 overflow-y-auto flex-1 text-xs">
            {/* Header Banner */}
            <div className="p-3 bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-transparent rounded-xl border border-yellow-400/30 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-400 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md">
                <Gift className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-white">Merchant Referral & Rewards Program</h3>
                  <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-full bg-yellow-400 text-slate-950">
                    {currentTierBadge} Tier
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Invite other store owners and shopkeepers to INCO. When they register using your invite link, you both unlock free months of Pro AI, barcode scanning, and POS features!
                </p>
              </div>
            </div>

            {/* Live Reward Status Bar */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Current Reward Status</div>
                  <div className="text-sm font-black text-white flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-yellow-400" />
                    <span>{currentTierTitle}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Invites</div>
                  <div className="text-sm font-black text-yellow-400">{referralCount} Stores</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">
                    Goal: {referralCount} / {nextMilestoneGoal} Invites ({rewardProgressPercent}%)
                  </span>
                  <span className="font-bold text-yellow-400">{nextRewardLabel}</span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 via-amber-400 to-emerald-400 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${Math.max(5, rewardProgressPercent)}%` }}
                  />
                </div>
              </div>

              {/* Active Perk Pill */}
              <div className="p-2.5 bg-yellow-400/10 border border-yellow-400/30 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
                  <span className="text-[11px] font-bold text-yellow-200">{activePerk}</span>
                </div>
                <button
                  type="button"
                  onClick={handleClaimReward}
                  className="px-2.5 py-1 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-lg text-[10px] shrink-0 cursor-pointer shadow-xs transition-colors"
                >
                  Claim Perks
                </button>
              </div>

              {/* Milestone Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className={`p-2 rounded-xl border text-center ${referralCount >= 1 ? "bg-yellow-400/10 border-yellow-400/40 text-yellow-300" : "bg-slate-900 border-slate-800 text-slate-500"}`}>
                  <div className="text-[10px] font-bold">1-2 Invites</div>
                  <div className="text-[9px] font-black">10% Pro Discount</div>
                </div>
                <div className={`p-2 rounded-xl border text-center ${referralCount >= 3 ? "bg-yellow-400/10 border-yellow-400/40 text-yellow-300" : "bg-slate-900 border-slate-800 text-slate-500"}`}>
                  <div className="text-[10px] font-bold">3-5 Invites</div>
                  <div className="text-[9px] font-black">1 Month Free Pro</div>
                </div>
                <div className={`p-2 rounded-xl border text-center ${referralCount >= 6 ? "bg-yellow-400/10 border-yellow-400/40 text-yellow-300" : "bg-slate-900 border-slate-800 text-slate-500"}`}>
                  <div className="text-[10px] font-bold">6-9 Invites</div>
                  <div className="text-[9px] font-black">3 Months Free Pro</div>
                </div>
                <div className={`p-2 rounded-xl border text-center ${referralCount >= 10 ? "bg-yellow-400/10 border-yellow-400/40 text-yellow-300" : "bg-slate-900 border-slate-800 text-slate-500"}`}>
                  <div className="text-[10px] font-bold">10+ Invites</div>
                  <div className="text-[9px] font-black">Lifetime Free VIP</div>
                </div>
              </div>
            </div>

            {/* WhatsApp Invite Share & Referral Code */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-yellow-400" />
                <span>Invite Capabilities & WhatsApp Share</span>
              </h4>

              {/* Prominent WhatsApp Invite Button */}
              <button
                type="button"
                onClick={handleShareViaWhatsApp}
                className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-950/50 cursor-pointer transition-all active:scale-[0.99]"
              >
                <MessageCircle className="w-5 h-5 fill-slate-950 stroke-emerald-500" />
                <span>Send Referral Through WhatsApp</span>
              </button>

              {/* Referral Code & Link Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Your Referral Code</div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-black text-yellow-400 text-sm">{referralCode}</span>
                    <button
                      type="button"
                      onClick={handleCopyReferralCode}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Copy className="w-3 h-3 text-yellow-400" />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Direct Invite Link</div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] text-slate-300 truncate">{referralLink}</span>
                    <button
                      type="button"
                      onClick={handleCopyReferralLink}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-lg flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
                    >
                      <Copy className="w-3 h-3 text-yellow-400" />
                      <span>Copy Link</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Encrypted Health Vault */}
        {activeTab === "health_vault" && (
          <div className="p-3 sm:p-4 space-y-3 overflow-y-auto flex-1 text-xs">
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-rose-400 font-black text-xs">
                <HeartPulse className="w-4 h-4" />
                <span>Confidential Merchant Health & Emergency Vault</span>
                <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-[8px] font-mono">
                  AES-256 GCM ENCRYPTED
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Store critical emergency medical details, blood group, allergies, and contacts. All data is encrypted locally with your master PIN before saving.
              </p>
            </div>

            {healthVaultError && (
              <div className="p-2.5 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{healthVaultError}</span>
              </div>
            )}

            {!isVaultUnlocked ? (
              <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center mx-auto text-yellow-400">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-white text-sm">Health Vault is Locked</h4>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-0.5">
                    {userProfile.encryptedHealthVault?.isConfigured
                      ? "Enter your security PIN or passphrase to decrypt and view confidential health data."
                      : "Create a private security PIN to configure your encrypted health & emergency vault."}
                  </p>
                </div>

                <div className="max-w-xs mx-auto space-y-2">
                  <input
                    type="password"
                    value={healthPin}
                    onChange={(e) => setHealthPin(e.target.value)}
                    placeholder="Enter Security PIN / Passphrase..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-center text-xs text-white focus:border-yellow-400 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleUnlockHealthVault}
                    className="w-full py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-xl text-xs cursor-pointer neon-glow-amber"
                  >
                    Unlock & Decrypt Health Vault
                  </button>
                </div>

                {userProfile.encryptedHealthVault?.ciphertext && (
                  <div className="pt-2 text-left">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block mb-1">
                      Raw Encrypted Ciphertext Preview:
                    </span>
                    <div className="p-2 bg-slate-900/90 rounded border border-slate-800 font-mono text-[9px] text-slate-400 break-all">
                      {userProfile.encryptedHealthVault.ciphertext.slice(0, 70)}...
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSaveEncryptedHealthVault} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      Emergency Contact Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={healthData.emergencyContactName}
                      onChange={(e) => setHealthData({ ...healthData, emergencyContactName: e.target.value })}
                      placeholder="e.g. Sarah Vance (Spouse / Next of Kin)"
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-750 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      Emergency Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={healthData.emergencyContactPhone}
                      onChange={(e) => setHealthData({ ...healthData, emergencyContactPhone: e.target.value })}
                      placeholder="+254 700 123456"
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-750 rounded-lg text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      Blood Group
                    </label>
                    <select
                      value={healthData.bloodGroup}
                      onChange={(e) => setHealthData({ ...healthData, bloodGroup: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-750 rounded-lg text-white font-bold"
                    >
                      <option value="O+">O Positive (O+)</option>
                      <option value="O-">O Negative (O-)</option>
                      <option value="A+">A Positive (A+)</option>
                      <option value="A-">A Negative (A-)</option>
                      <option value="B+">B Positive (B+)</option>
                      <option value="B-">B Negative (B-)</option>
                      <option value="AB+">AB Positive (AB+)</option>
                      <option value="AB-">AB Negative (AB-)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      Known Drug Allergies / Sensitivities
                    </label>
                    <input
                      type="text"
                      value={healthData.allergies}
                      onChange={(e) => setHealthData({ ...healthData, allergies: e.target.value })}
                      placeholder="e.g. Penicillin, Aspirin, None"
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-750 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Chronic Medical Conditions / First-Aid Notes
                  </label>
                  <textarea
                    rows={2}
                    value={healthData.medicalConditions}
                    onChange={(e) => setHealthData({ ...healthData, medicalConditions: e.target.value })}
                    placeholder="e.g. Asthma inhaler in drawer #2; Diabetic; High BP medication..."
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-750 rounded-lg text-white"
                  />
                </div>

                <div className="p-2.5 bg-indigo-950/40 border border-indigo-800 rounded-xl space-y-1.5">
                  <label className="block text-[10px] uppercase font-bold text-indigo-300">
                    Confirm Vault Encryption PIN *
                  </label>
                  <input
                    type="password"
                    required
                    value={healthPin}
                    onChange={(e) => setHealthPin(e.target.value)}
                    placeholder="Enter PIN to encrypt & seal record"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-indigo-700 rounded-lg text-white"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsVaultUnlocked(false);
                      setHealthPin("");
                    }}
                    className="px-3 py-1.5 text-slate-400 hover:text-white font-bold text-xs"
                  >
                    Lock Vault
                  </button>

                  <button
                    type="submit"
                    disabled={isEncryptingHealth}
                    className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase rounded-xl flex items-center gap-1.5 cursor-pointer neon-glow-amber"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{isEncryptingHealth ? "Encrypting with AES-256..." : "Encrypt & Save Health Vault"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Tab 3: KYC ID Verification Application */}
        {activeTab === "verification" && (
          <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
            {userProfile.isVerified ? (
              <div className="p-4 bg-emerald-950/50 border border-emerald-500/50 rounded-xl text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-yellow-400 text-slate-950 flex items-center justify-center mx-auto neon-glow-amber shadow-lg">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h3 className="text-base font-black text-white">Verified INCO Smart Shop Merchant</h3>
                <p className="text-slate-300 text-xs max-w-sm mx-auto">
                  Your legal identification and passport photograph have been officially confirmed and verified by INCO Admin.
                </p>
                <div className="inline-block px-3 py-1 bg-emerald-900/60 text-emerald-300 rounded-full font-mono text-[10px] font-bold">
                  Status: Approved & Active
                </div>
              </div>
            ) : userProfile.verificationStatus === "pending" || kycSubmitted ? (
              <div className="p-4 bg-amber-950/40 border border-amber-500/50 rounded-xl text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center mx-auto shadow-lg">
                  <Clock className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h3 className="text-base font-black text-amber-300">KYC Verification In Review</h3>
                <p className="text-slate-300 text-xs max-w-sm mx-auto">
                  Your documents (Passport Photo & Government ID) have been submitted to the INCO Admin Approval Desk. Verification usually takes 2–4 hours.
                </p>
                <div className="inline-block px-3 py-1 bg-amber-900/60 text-amber-300 rounded-full font-mono text-[10px] font-bold">
                  Status: Pending Admin Confirmation
                </div>
              </div>
            ) : (
              <form onSubmit={handleKycSubmit} className="space-y-3">
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-yellow-400 font-black text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Apply for Verified INCO User Badge</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Submit your government ID document and passport photo for administrative verification.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      Legal Full Name (As on ID) *
                    </label>
                    <input
                      type="text"
                      required
                      value={legalName}
                      onChange={(e) => setLegalName(e.target.value)}
                      placeholder="e.g. Alexander K. Vance"
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      ID Document Type *
                    </label>
                    <select
                      value={idType}
                      onChange={(e: any) => setIdType(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                    >
                      <option value="National ID">National Identity Card</option>
                      <option value="Passport">International Passport</option>
                      <option value="Driver's License">Driver's License</option>
                      <option value="Voter Card">Voter Registration Card</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    ID Document Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="e.g. A092837492"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                {/* 2 Document Upload Boxes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      1. Passport-Sized Photo *
                    </label>
                    <input
                      type="file"
                      ref={passportFileRef}
                      accept="image/*"
                      className="hidden"
                      onChange={handlePassportUpload}
                    />
                    <div
                      onClick={() => passportFileRef.current?.click()}
                      className="h-24 bg-slate-950 border-2 border-dashed border-slate-700 hover:border-yellow-400 rounded-xl flex flex-col items-center justify-center cursor-pointer p-2 text-center transition-colors"
                    >
                      {passportPhoto ? (
                        <img src={passportPhoto} alt="Passport" className="h-full w-full object-contain rounded-md" />
                      ) : (
                        <>
                          <Camera className="w-5 h-5 text-yellow-400 mb-1" />
                          <span className="text-[10px] font-bold text-slate-300">Upload Portrait Photo</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      2. Government ID Photo *
                    </label>
                    <input
                      type="file"
                      ref={idDocFileRef}
                      accept="image/*"
                      className="hidden"
                      onChange={handleIdDocUpload}
                    />
                    <div
                      onClick={() => idDocFileRef.current?.click()}
                      className="h-24 bg-slate-950 border-2 border-dashed border-slate-700 hover:border-yellow-400 rounded-xl flex flex-col items-center justify-center cursor-pointer p-2 text-center transition-colors"
                    >
                      {idDocPhoto ? (
                        <img src={idDocPhoto} alt="ID Document" className="h-full w-full object-contain rounded-md" />
                      ) : (
                        <>
                          <FileText className="w-5 h-5 text-yellow-400 mb-1" />
                          <span className="text-[10px] font-bold text-slate-300">Upload ID Scan / Document</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer neon-glow-amber mt-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Submit KYC for Admin Approval</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tab 4: Subscription & Payment Requests */}
        {activeTab === "subscription" && (
          <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Current Active Plan</div>
                <div className="text-sm font-black text-yellow-400">{userProfile.subscription.plan}</div>
              </div>
              <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase">
                {userProfile.subscription.status}
              </span>
            </div>

            {paymentSubmitted || userProfile.subscription.status === "pending_approval" ? (
              <div className="p-4 bg-amber-950/40 border border-amber-500/50 rounded-xl text-center space-y-2">
                <Clock className="w-8 h-8 text-amber-400 mx-auto" />
                <h3 className="font-black text-white text-sm">Payment Confirmation In Progress</h3>
                <p className="text-[11px] text-slate-300">
                  Your payment receipt (Ref: <strong className="font-mono text-yellow-400">{userProfile.subscription.transactionRef || transactionRef}</strong>) is currently being verified by the INCO Admin. Pro capabilities will unlock automatically upon confirmation.
                </p>
              </div>
            ) : (
              <form onSubmit={handlePaymentSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Select Upgrade Tier
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { name: "INCO Pro AI", price: "$19/mo", desc: "Unlimited AI speech & vision scans" },
                      { name: "Enterprise Cloud", price: "$49/mo", desc: "Multi-branch & team roles" },
                      { name: "Lifetime Kiosk", price: "$149 one-time", desc: "Lifetime offline & sync license" },
                    ].map((plan) => (
                      <div
                        key={plan.name}
                        onClick={() => setSelectedPlan(plan.name as any)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                          selectedPlan === plan.name
                            ? "bg-yellow-400/10 border-yellow-400 text-white shadow-xs neon-border-amber"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <div className="font-bold text-white text-xs">{plan.name}</div>
                        <div className="text-yellow-400 font-black text-xs font-mono">{plan.price}</div>
                        <div className="text-[9px] text-slate-400 mt-1">{plan.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Select Payment Gateway
                  </label>
                  <select
                    value={selectedPaymentMethod}
                    onChange={(e: any) => setSelectedPaymentMethod(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="Mobile Money (M-Pesa/MTN)">Mobile Money (M-Pesa / MTN Momo / Airtel)</option>
                    <option value="Credit/Debit Card">Credit / Debit Card (Visa / Mastercard)</option>
                    <option value="Bank Transfer">Direct Bank Wire / Electronic Transfer</option>
                    <option value="Crypto (USDT/BTC)">Crypto (USDT TRC20 / ERC20 / Bitcoin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Transaction Reference / Receipt Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. MPESA-QW92810X / TXID-892183"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Attach Payment Screenshot / Receipt (Optional)
                  </label>
                  <input
                    type="file"
                    ref={paymentProofFileRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handlePaymentProofUpload}
                  />
                  <div
                    onClick={() => paymentProofFileRef.current?.click()}
                    className="p-3 bg-slate-950 border-2 border-dashed border-slate-750 hover:border-yellow-400 rounded-xl flex items-center justify-center gap-2 cursor-pointer text-slate-300"
                  >
                    <Upload className="w-4 h-4 text-yellow-400" />
                    <span className="font-bold text-[11px]">
                      {paymentProofUrl ? "Payment Proof Attached ✓" : "Upload Receipt Screenshot"}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer neon-glow-amber"
                >
                  <Zap className="w-4 h-4 stroke-[2.5]" />
                  <span>Submit Payment for Approval</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-slate-900 border border-rose-600 rounded-2xl max-w-sm w-full p-4 space-y-3 shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-rose-950 border border-rose-700 flex items-center justify-center mx-auto text-rose-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h3 className="font-black text-white text-base">Permanently Delete Account?</h3>
              <p className="text-xs text-slate-300 mt-1">
                This action is irreversible. All your inventory counts, KYC submissions, and store credentials will be deleted.
              </p>
            </div>

            {deleteError && (
              <div className="p-2 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-lg text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="space-y-2">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Type <strong className="text-rose-400">DELETE</strong> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-rose-800 rounded-lg text-center text-xs font-mono text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Your Account Password (to verify):
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                  setDeletePassword("");
                  setDeleteError(null);
                }}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmText.trim().toUpperCase() !== "DELETE" || isDeletingAccount}
                onClick={handleConfirmDelete}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-lg text-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1"
              >
                {isDeletingAccount ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
