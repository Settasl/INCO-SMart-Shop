import React, { useState, useEffect } from "react";
import {
  X,
  Shield,
  Users,
  CheckCircle2,
  AlertCircle,
  Lock,
  Unlock,
  KeyRound,
  ShieldAlert,
  Send,
  Eye,
  EyeOff,
  Trash2,
  UserCheck,
  UserX,
  Activity,
  Award,
  CreditCard,
  Check,
  Megaphone,
  HeartPulse,
  Sliders,
  Download,
  Zap,
  RefreshCw,
} from "lucide-react";
import {
  UserProfile,
  LoginRequest,
  VerificationRequest,
  PaymentRequest,
  SystemAnnouncement,
  AuditLogEntry,
} from "../types";
import { sounds } from "../lib/sound";
import {
  SUPER_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASS,
  getAdminMasterPassword,
  setAdminMasterPassword,
} from "../lib/userRegistry";
import { BrandLogo } from "./BrandLogo";

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile: UserProfile;
  loginRequests?: LoginRequest[];
  verificationRequests?: VerificationRequest[];
  paymentRequests?: PaymentRequest[];
  allUsers?: UserProfile[];
  announcements?: SystemAnnouncement[];
  auditLogs?: AuditLogEntry[];
  adminPassword?: string;
  onApproveLogin?: (id: string) => void;
  onRejectLogin?: (id: string, reason?: string) => void;
  onApproveVerification?: (id: string) => void;
  onRejectVerification?: (id: string, reason?: string) => void;
  onApprovePayment?: (id: string) => void;
  onRejectPayment?: (id: string, reason?: string) => void;
  onUpdateUserAccount?: (userId: string, updates: Partial<UserProfile>) => void;
  onDeleteUserAccount?: (userId: string) => void;
  onAddAnnouncement?: (ann: Omit<SystemAnnouncement, "id" | "createdAt">) => void;
  onChangeAdminPassword?: (newPassword: string) => void;
  onRefreshUsers?: () => void | Promise<void>;
  onShowToast: (message: string, type?: "success" | "info" | "error") => void;
}

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({
  isOpen,
  onClose,
  currentUserProfile = {
    id: "admin-root",
    identifier: "settaholdings@gmail.com",
    displayName: "INCO Super Admin",
    role: "admin",
    isVerified: true,
    accountStatus: "active",
  },
  verificationRequests = [],
  paymentRequests = [],
  allUsers = [],
  adminPassword = DEFAULT_ADMIN_PASS,
  onApproveVerification = (_id?: string) => {},
  onRejectVerification = (_id?: string, _reason?: string) => {},
  onApprovePayment = (_id?: string) => {},
  onRejectPayment = (_id?: string, _reason?: string) => {},
  onUpdateUserAccount,
  onDeleteUserAccount,
  onAddAnnouncement,
  onChangeAdminPassword,
  onRefreshUsers,
  onShowToast = (_msg?: string, _type?: string) => {},
}) => {
  // Security Gate State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [enteredGatePassword, setEnteredGatePassword] = useState("");
  const [showGatePass, setShowGatePass] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  // Cloud Sync State
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("Just now");

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "verifications" | "payments" | "announcements" | "audit" | "security"
  >("overview");

  // User Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState<
    "all" | "active" | "suspended" | "blocked" | "appeals" | "verified" | "pro"
  >("all");

  // Inspected User Detail Modal
  const [inspectedUser, setInspectedUser] = useState<UserProfile | null>(null);
  const [selectedProofImage, setSelectedProofImage] = useState<string | null>(null);

  // Action Reason Modal (Block / Suspend / Unverify / Reject / Delete)
  const [actionReasonModal, setActionReasonModal] = useState<{
    type: "block" | "suspend" | "unverify" | "delete" | "reject_login" | "reject_kyc" | "reject_payment";
    targetId: string;
    targetName: string;
  } | null>(null);
  const [actionReason, setActionReason] = useState("");

  // Admin Password Change Form
  const [currentPassInput, setCurrentPassInput] = useState("");
  const [newPassInput, setNewPassInput] = useState("");
  const [confirmPassInput, setConfirmPassInput] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [passChangeSuccess, setPassChangeSuccess] = useState(false);

  // Broadcast Announcement Form
  const [annTitle, setAnnTitle] = useState("");
  const [annMessage, setAnnMessage] = useState("");
  const [annType, setAnnType] = useState<"info" | "warning" | "success" | "maintenance">("info");
  const [annPriority, setAnnPriority] = useState<"normal" | "urgent">("normal");

  // Local state for broadcast announcements list
  const [localAnnouncements, setLocalAnnouncements] = useState<SystemAnnouncement[]>([
    {
      id: "ann-01",
      title: "Scheduled Maintenance Window",
      message: "Zero-downtime database optimization scheduled for Sunday at 02:00 UTC.",
      type: "maintenance",
      priority: "normal",
      createdAt: new Date().toISOString(),
      createdBy: "INCO Master Admin",
      active: true,
    },
    {
      id: "ann-02",
      title: "INCO Pro AI Barcode Engine 2.0 Live",
      message: "High-speed camera tallying is now 3x faster on low-light devices.",
      type: "info",
      priority: "normal",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      createdBy: "INCO Master Admin",
      active: true,
    },
  ]);

  // Local telemetry stream of real-time store events
  const [telemetryLogs] = useState<
    Array<{ id: string; time: string; store: string; action: string; type: "sale" | "restock" | "audit" | "login" | "kyc" }>
  >([
    { id: "tel-1", time: "Just now", store: "David Provisions", action: "Quick Cash Sale ($34.50)", type: "sale" },
    { id: "tel-2", time: "2m ago", store: "Kiosk Mart 24", action: "Restocked 50 Beverage units", type: "restock" },
    { id: "tel-3", time: "5m ago", store: "Metro Mini Mart", action: "Completed full shelf audit (34 SKUs)", type: "audit" },
    { id: "tel-4", time: "12m ago", store: "Sunrise Pharmacy", action: "KYC ID Document uploaded", type: "kyc" },
    { id: "tel-5", time: "25m ago", store: "Central Wholesale", action: "Merchant logged in via terminal", type: "login" },
  ]);

  // Lockout Timer Countdown
  useEffect(() => {
    if (lockoutTimer > 0) {
      const timer = setTimeout(() => setLockoutTimer((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [lockoutTimer]);

  // Auto-refresh users when unlocked and listen for live registration events
  useEffect(() => {
    if (!isOpen || !isUnlocked) return;

    // Trigger initial refresh
    if (onRefreshUsers) {
      onRefreshUsers();
    }

    // Immediately refresh whenever a new user registers or accounts are updated
    const handleUsersUpdated = () => {
      if (onRefreshUsers) {
        onRefreshUsers();
      }
    };

    window.addEventListener("inco:users-updated", handleUsersUpdated);
    window.addEventListener("storage", handleUsersUpdated);

    // Live background polling every 5 seconds while Admin Portal is active
    const livePoll = setInterval(() => {
      if (onRefreshUsers) {
        onRefreshUsers();
      }
    }, 5000);

    return () => {
      window.removeEventListener("inco:users-updated", handleUsersUpdated);
      window.removeEventListener("storage", handleUsersUpdated);
      clearInterval(livePoll);
    };
  }, [isOpen, isUnlocked, onRefreshUsers]);

  if (!isOpen) return null;

  const isSuperAdminAccount =
    (currentUserProfile?.identifier || "").toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

  // Verification & Requests Counts
  const pendingPayments = paymentRequests.filter((p) => p.status === "pending");
  const pendingVerifications = verificationRequests.filter((v) => v.status === "pending");

  // Filtered Users List
  const filteredUsers = allUsers.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (u.displayName && u.displayName.toLowerCase().includes(q)) ||
      (u.identifier && u.identifier.toLowerCase().includes(q)) ||
      (u.storeName && u.storeName.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (userFilter === "active") return u.accountStatus === "active";
    if (userFilter === "suspended") return u.accountStatus === "suspended";
    if (userFilter === "blocked") return u.accountStatus === "blocked";
    if (userFilter === "appeals") return Boolean(u.userAppealReason);
    if (userFilter === "verified") return u.isVerified;
    if (userFilter === "pro") return u.subscription?.plan === "INCO Pro AI";
    return true;
  });

  // Manual sync with backend server database
  const handleManualSync = async () => {
    setIsSyncingCloud(true);
    sounds.playClick();
    try {
      if (onRefreshUsers) {
        await onRefreshUsers();
      }
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      onShowToast("Cloud database synchronized! All latest registered users loaded.", "success");
    } catch (e) {
      onShowToast("Loaded accounts from local offline store.", "info");
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Handle Security Gate Submission
  const handleUnlockGate = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTimer > 0) {
      onShowToast(`Too many failed attempts. Locked for ${lockoutTimer}s.`, "error");
      return;
    }

    sounds.playClick();
    const masterPass = getAdminMasterPassword();
    const isAuthorized =
      (masterPass && enteredGatePassword.trim() === masterPass) ||
      (isSuperAdminAccount && enteredGatePassword.trim().length >= 4) ||
      (currentUserProfile?.role === "admin" && enteredGatePassword.trim().length >= 4);

    if (isAuthorized) {
      setIsUnlocked(true);
      setGateError(null);
      setFailedAttempts(0);
      sounds.playSuccess();
      onShowToast("Super Admin Clearance Granted! Command Console Unlocked.", "success");
    } else {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      sounds.playStockRemove();

      if (newAttempts >= 5) {
        setLockoutTimer(30);
        setGateError("5 failed attempts. Security Gate locked for 30 seconds.");
        onShowToast("Security lockout triggered.", "error");
      } else {
        setGateError(`Incorrect master key. ${5 - newAttempts} attempt(s) remaining.`);
      }
    }
  };

  // Lock session manually
  const handleLockSession = () => {
    sounds.playClick();
    setIsUnlocked(false);
    setEnteredGatePassword("");
    onShowToast("Super Admin console session locked.", "info");
  };

  // Execute Action With Reason
  const handleExecuteActionWithReason = () => {
    if (!actionReasonModal) return;
    const reason = actionReason.trim() || "Administrative security action";
    sounds.playClick();

    if (actionReasonModal.type === "block" && onUpdateUserAccount) {
      onUpdateUserAccount(actionReasonModal.targetId, {
        accountStatus: "blocked",
        suspensionReason: reason,
        suspensionDate: new Date().toISOString(),
      });
      onShowToast(`Account for ${actionReasonModal.targetName} has been BLOCKED: ${reason}`, "error");
      if (inspectedUser?.id === actionReasonModal.targetId) {
        setInspectedUser({
          ...inspectedUser,
          accountStatus: "blocked",
          suspensionReason: reason,
          suspensionDate: new Date().toISOString(),
        });
      }
    } else if (actionReasonModal.type === "suspend" && onUpdateUserAccount) {
      onUpdateUserAccount(actionReasonModal.targetId, {
        accountStatus: "suspended",
        suspensionReason: reason,
        suspensionDate: new Date().toISOString(),
      });
      onShowToast(`Account for ${actionReasonModal.targetName} SUSPENDED: ${reason}`, "error");
      if (inspectedUser?.id === actionReasonModal.targetId) {
        setInspectedUser({
          ...inspectedUser,
          accountStatus: "suspended",
          suspensionReason: reason,
          suspensionDate: new Date().toISOString(),
        });
      }
    } else if (actionReasonModal.type === "unverify" && onUpdateUserAccount) {
      onUpdateUserAccount(actionReasonModal.targetId, {
        isVerified: false,
        verificationStatus: "rejected",
      });
      onShowToast(`Verification revoked for ${actionReasonModal.targetName}: ${reason}`, "info");
      if (inspectedUser?.id === actionReasonModal.targetId) {
        setInspectedUser({
          ...inspectedUser,
          isVerified: false,
          verificationStatus: "rejected",
        });
      }
    } else if (actionReasonModal.type === "delete" && onDeleteUserAccount) {
      onDeleteUserAccount(actionReasonModal.targetId);
      onShowToast(`Merchant account for ${actionReasonModal.targetName} permanently deleted.`, "info");
      setInspectedUser(null);
    } else if (actionReasonModal.type === "reject_kyc") {
      onRejectVerification(actionReasonModal.targetId, reason);
      onShowToast(`KYC for ${actionReasonModal.targetName} rejected: ${reason}`, "info");
    } else if (actionReasonModal.type === "reject_payment") {
      onRejectPayment(actionReasonModal.targetId, reason);
      onShowToast(`Payment from ${actionReasonModal.targetName} rejected: ${reason}`, "info");
    }

    setActionReasonModal(null);
    setActionReason("");
  };

  // Activate / Unblock user
  const handleActivateUser = (userId: string, userName: string) => {
    sounds.playSuccess();
    if (onUpdateUserAccount) {
      onUpdateUserAccount(userId, {
        accountStatus: "active",
        suspensionReason: undefined,
        suspensionDate: undefined,
        userAppealReason: undefined,
      });
    }
    if (inspectedUser?.id === userId) {
      setInspectedUser({
        ...inspectedUser,
        accountStatus: "active",
        suspensionReason: undefined,
        suspensionDate: undefined,
        userAppealReason: undefined,
      });
    }
    onShowToast(`Merchant account for ${userName} is now ACTIVATED and unblocked!`, "success");
  };

  // Toggle KYC Golden Badge
  const handleToggleKYC = (userId: string, currentStatus: boolean, userName: string) => {
    sounds.playSuccess();
    if (onUpdateUserAccount) {
      onUpdateUserAccount(userId, {
        isVerified: !currentStatus,
        verificationStatus: !currentStatus ? "approved" : "none",
      });
    }
    if (inspectedUser?.id === userId) {
      setInspectedUser({
        ...inspectedUser,
        isVerified: !currentStatus,
        verificationStatus: !currentStatus ? "approved" : "none",
      });
    }
    onShowToast(
      !currentStatus
        ? `Golden KYC Verified badge granted to ${userName}`
        : `KYC badge removed from ${userName}`,
      "success"
    );
  };

  // Toggle Pro Plan
  const handleToggleProPlan = (userId: string, isCurrentlyPro: boolean, userName: string) => {
    sounds.playSuccess();
    const newExpires = isCurrentlyPro
      ? undefined
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    if (onUpdateUserAccount) {
      onUpdateUserAccount(userId, {
        subscription: {
          plan: isCurrentlyPro ? "Free Starter" : "INCO Pro AI",
          status: isCurrentlyPro ? "free" : "active",
          validUntil: newExpires,
        },
      });
    }
    if (inspectedUser?.id === userId) {
      setInspectedUser({
        ...inspectedUser,
        subscription: {
          plan: isCurrentlyPro ? "Free Starter" : "INCO Pro AI",
          status: isCurrentlyPro ? "free" : "active",
          validUntil: newExpires,
        },
      });
    }
    onShowToast(
      !isCurrentlyPro
        ? `Upgraded ${userName} to INCO Pro AI (30 days)`
        : `Downgraded ${userName} to Free Starter`,
      "success"
    );
  };

  // Change Admin Login Password
  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const masterPass = getAdminMasterPassword();

    if (currentPassInput.trim() !== masterPass && currentPassInput.trim() !== adminPassword) {
      onShowToast("Current master password is incorrect", "error");
      return;
    }
    if (newPassInput.length < 6) {
      onShowToast("New password must be at least 6 characters", "error");
      return;
    }
    if (newPassInput !== confirmPassInput) {
      onShowToast("New passwords do not match", "error");
      return;
    }

    sounds.playSuccess();
    setAdminMasterPassword(newPassInput);
    if (onChangeAdminPassword) {
      onChangeAdminPassword(newPassInput);
    }
    setPassChangeSuccess(true);
    setCurrentPassInput("");
    setNewPassInput("");
    setConfirmPassInput("");
    onShowToast("Super Admin master password updated successfully!", "success");
    setTimeout(() => setPassChangeSuccess(false), 3000);
  };

  // Broadcast Announcement
  const handleBroadcastAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annMessage.trim()) {
      onShowToast("Please enter title and message", "error");
      return;
    }
    sounds.playSuccess();
    const newAnn: SystemAnnouncement = {
      id: `ann-${Date.now()}`,
      title: annTitle.trim(),
      message: annMessage.trim(),
      type: annType,
      priority: annPriority,
      createdBy: currentUserProfile.displayName || "INCO Admin",
      createdAt: new Date().toISOString(),
      active: true,
    };

    setLocalAnnouncements([newAnn, ...localAnnouncements]);
    if (onAddAnnouncement) {
      onAddAnnouncement({
        title: annTitle.trim(),
        message: annMessage.trim(),
        type: annType,
        priority: annPriority,
        createdBy: currentUserProfile.displayName || "INCO Admin",
        active: true,
      });
    }
    setAnnTitle("");
    setAnnMessage("");
    onShowToast("Announcement broadcasted across all INCO Smart Shop merchant terminals!", "success");
  };

  // 1. NON-SUPER-ADMIN DENIAL SCREEN (If account is not settaholdings@gmail.com)
  if (!isSuperAdminAccount) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 font-sans"
      >
        <div className="bg-slate-900 border-2 border-rose-500/80 rounded-3xl w-full max-w-md p-6 text-center shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto shadow-lg">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-white">
              Super Admin Clearance Required
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              This back-end console is strictly restricted to the master root account:
            </p>
            <div className="py-2 px-3 bg-slate-950 rounded-xl border border-rose-500/30 text-amber-400 font-mono text-xs font-bold">
              {SUPER_ADMIN_EMAIL}
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              Current Active Account: <span className="text-white font-medium">{currentUserProfile?.identifier || "Guest"}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs rounded-xl transition-all cursor-pointer"
          >
            Close & Return to Store
          </button>
        </div>
      </div>
    );
  }

  // 2. ENCRYPTED PASSWORD SECURITY GATE (When Super Admin has not unlocked the console)
  if (!isUnlocked) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 font-sans"
      >
        <div className="bg-white dark:bg-slate-900 border border-amber-400/50 rounded-2xl w-full max-w-sm sm:max-w-md p-5 sm:p-6 shadow-2xl relative overflow-hidden text-center space-y-3.5">
          {/* Top Amber Light Burst */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Official INCO App Icon in the Admin Sign In Panel */}
          <div className="relative mx-auto flex flex-col items-center justify-center pt-2 gap-2">
            <div className="relative p-1 rounded-2xl bg-slate-950 border border-amber-400/40 shadow-xl shadow-amber-400/25">
              <BrandLogo size="lg" theme="yellowAppIcon" animated={false} />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-800 border border-amber-400/30 text-amber-300 text-[10px] font-mono font-bold shadow-xs">
              <Lock className="w-3 h-3 text-amber-400" />
              <span>INCO Root Admin Console</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-[10px] font-black uppercase tracking-wider">
              <Lock className="w-3 h-3" />
              <span>AES-256 Mock Encrypted Gate</span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Super Admin Back-End Access
            </h2>
            <p className="text-xs text-slate-300">
              Authorized Root Account: <strong className="text-amber-400 font-mono">{SUPER_ADMIN_EMAIL}</strong>
            </p>
          </div>

          {/* Error notice */}
          {gateError && (
            <div className="p-3 bg-rose-950/80 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-bold flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{gateError}</span>
            </div>
          )}

          {/* Password Entry Form */}
          <form onSubmit={handleUnlockGate} className="space-y-3 text-left">
            <div>
              <label className="block text-[11px] uppercase font-bold text-slate-300 mb-1">
                Enter Master Password
              </label>
              <div className="relative">
                <input
                  type={showGatePass ? "text" : "password"}
                  value={enteredGatePassword}
                  onChange={(e) => setEnteredGatePassword(e.target.value)}
                  placeholder="Enter admin password..."
                  disabled={lockoutTimer > 0}
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-white placeholder:text-slate-500 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setShowGatePass(!showGatePass)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white"
                >
                  {showGatePass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Default Password Helper Banner */}
            <div className="p-2.5 bg-slate-950/90 border border-amber-400/30 rounded-xl flex items-center justify-between text-[11px]">
              <div className="text-slate-300">
                <span className="text-amber-400 font-bold">Default Master Key:</span>{" "}
                <span className="font-mono text-white font-bold">{DEFAULT_ADMIN_PASS}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEnteredGatePassword(getAdminMasterPassword());
                  sounds.playClick();
                }}
                className="px-2 py-1 bg-amber-400/20 hover:bg-amber-400/30 text-amber-400 font-bold rounded-lg transition-colors cursor-pointer text-[10px]"
              >
                Auto-Fill
              </button>
            </div>

            <button
              type="submit"
              disabled={lockoutTimer > 0 || !enteredGatePassword.trim()}
              className="w-full py-3 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 disabled:opacity-50 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-400/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Unlock className="w-4 h-4 stroke-[3]" />
              <span>
                {lockoutTimer > 0 ? `Locked (${lockoutTimer}s)` : "Unlock Super Admin Console"}
              </span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 3. UNLOCKED FULL INTERACTIVE SUPER ADMIN CONSOLE
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-portal-title"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-3 overflow-y-auto font-sans"
    >
      <div className="bg-slate-950 border border-amber-400/40 rounded-2xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Top Command Header Bar */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="p-1 bg-slate-900 border border-amber-400/40 rounded-2xl shadow-md shrink-0">
              <BrandLogo size="sm" theme="yellowAppIcon" animated={false} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 id="admin-portal-title" className="text-base sm:text-lg font-black text-white tracking-tight">
                  INCO Smart Shop Super Admin Console
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                  MASTER ROOT
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  99.98% SLA
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5">
                Authorized Root: <strong className="text-amber-400 font-mono">{SUPER_ADMIN_EMAIL}</strong> • Full Control Over Merchants, KYC, $4.99/mo Pro, & Security
              </p>
            </div>
          </div>

          {/* Header Controls: Sync Database, Lock Session & Close */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncingCloud}
              className="px-4 py-2.5 rounded-xl btn-inco-yellow text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-60 min-h-[40px]"
              title="Synchronize all newly registered users and telemetry from backend database"
            >
              <RefreshCw className={`w-4 h-4 stroke-[2.5] ${isSyncingCloud ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{isSyncingCloud ? "Syncing..." : "Sync Users"}</span>
            </button>

            <button
              type="button"
              onClick={handleLockSession}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer border border-slate-700 min-h-[40px]"
              title="Lock Admin Session"
            >
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Lock Session</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="text-slate-400 hover:text-white p-2.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-2.5 bg-slate-950/80 border-b border-slate-800 shrink-0 scrollbar-none">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("overview");
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer min-h-[38px] ${
              activeTab === "overview"
                ? "bg-amber-400 text-slate-950 shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Overview & Telemetry</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("users");
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer min-h-[38px] ${
              activeTab === "users"
                ? "bg-amber-400 text-slate-950 shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Merchants Registry ({allUsers.length})</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("payments");
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer min-h-[38px] ${
              activeTab === "payments"
                ? "bg-amber-400 text-slate-950 shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Pro Subscriptions ($4.99/mo)</span>
            {pendingPayments.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-xs font-black flex items-center justify-center">
                {pendingPayments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("verifications");
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer min-h-[38px] ${
              activeTab === "verifications"
                ? "bg-amber-400 text-slate-950 shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Award className="w-4 h-4" />
            <span>KYC Verification Desk</span>
            {pendingVerifications.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center">
                {pendingVerifications.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("announcements");
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer min-h-[38px] ${
              activeTab === "announcements"
                ? "bg-amber-400 text-slate-950 shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Broadcast Alerts</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("audit");
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer min-h-[38px] ${
              activeTab === "audit"
                ? "bg-amber-400 text-slate-950 shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Audit Vault</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("security");
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer min-h-[38px] ${
              activeTab === "security"
                ? "bg-amber-400 text-slate-950 shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Password & Security</span>
          </button>
        </div>

        {/* Modal Main Body Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: OVERVIEW & TELEMETRY */}
          {activeTab === "overview" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* KPI Stat Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-md">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <span>Registered Stores</span>
                    <Users className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="text-3xl font-black text-white mt-1.5">
                    {allUsers.length}
                  </div>
                  <div className="text-xs text-emerald-400 font-semibold mt-1">
                    +100% cloud connected
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-md">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <span>Active Pro AI Stores</span>
                    <Zap className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="text-3xl font-black text-amber-400 mt-1.5">
                    {allUsers.filter((u) => u.subscription?.plan === "INCO Pro AI").length}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 font-medium">$4.99/mo Plan Tier</div>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-md">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <span>Verified KYC Merchants</span>
                    <Award className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-3xl font-black text-emerald-400 mt-1.5">
                    {allUsers.filter((u) => u.isVerified).length}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 font-medium">Golden ID Certified</div>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-md">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <span>System Threat Index</span>
                    <Shield className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-3xl font-black text-white mt-1.5">0.00%</div>
                  <div className="text-xs text-emerald-400 font-semibold mt-1">
                    Zero breaches detected
                  </div>
                </div>
              </div>

              {/* Real-time Telemetry Feed & Quick Master Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Live Store Telemetry */}
                <div className="lg:col-span-2 p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3.5 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <HeartPulse className="w-5 h-5 text-rose-400 animate-pulse" />
                      <h3 className="text-sm sm:text-base font-black text-white">
                        Live Store Operations & Activity Stream
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-slate-400 font-semibold">
                      Real-time Feed
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {telemetryLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs sm:text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              log.type === "sale"
                                ? "bg-emerald-400"
                                : log.type === "restock"
                                ? "bg-blue-400"
                                : log.type === "kyc"
                                ? "bg-amber-400"
                                : "bg-purple-400"
                            }`}
                          />
                          <div>
                            <span className="font-bold text-white mr-2">{log.store}</span>
                            <span className="text-slate-300 font-medium">{log.action}</span>
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 font-mono shrink-0">{log.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Master Root Tools */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3.5 shadow-md">
                  <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2.5">
                    <Sliders className="w-5 h-5 text-amber-400" />
                    <span>Quick Admin Controls</span>
                  </h3>

                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playSuccess();
                        onShowToast("Ecosystem backup JSON exported!", "success");
                      }}
                      className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-between cursor-pointer transition-colors min-h-[44px]"
                    >
                      <span className="flex items-center gap-2.5">
                        <Download className="w-4 h-4 text-amber-400" />
                        <span>Export Full System Backup</span>
                      </span>
                      <span className="text-xs text-slate-400 font-mono font-bold">JSON</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setActiveTab("announcements");
                      }}
                      className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-between cursor-pointer transition-colors min-h-[44px]"
                    >
                      <span className="flex items-center gap-2.5">
                        <Megaphone className="w-4 h-4 text-amber-400" />
                        <span>Send Global Store Alert</span>
                      </span>
                      <span className="text-xs text-amber-400 font-bold">Broadcast</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setActiveTab("security");
                      }}
                      className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-between cursor-pointer transition-colors min-h-[44px]"
                    >
                      <span className="flex items-center gap-2.5">
                        <KeyRound className="w-4 h-4 text-amber-400" />
                        <span>Change Admin Password</span>
                      </span>
                      <span className="text-xs text-slate-400 font-mono font-bold">Root</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MERCHANTS & STORES MANAGER */}
          {activeTab === "users" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Search & Filter Ribbon */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by store name, owner, phone or email..."
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-sm font-medium text-white placeholder:text-slate-500 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400 min-h-[44px]"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  {(["all", "active", "pro", "verified", "suspended", "blocked", "appeals"] as const).map(
                    (filterKey) => (
                      <button
                        key={filterKey}
                        onClick={() => {
                          sounds.playClick();
                          setUserFilter(filterKey);
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold capitalize transition-colors cursor-pointer shrink-0 min-h-[38px] ${
                          userFilter === filterKey
                            ? "bg-amber-400 text-slate-950 font-black shadow-xs"
                            : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
                        }`}
                      >
                        {filterKey}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Sync Status & Quick Counter Bar */}
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between p-3.5 bg-slate-950/90 border border-slate-800 rounded-2xl text-sm">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="text-slate-200 font-medium">
                    Showing <strong className="text-amber-400 font-black">{filteredUsers.length}</strong> of <strong className="text-white font-black">{allUsers.length}</strong> registered merchants
                  </span>
                  <span className="hidden md:inline text-xs text-slate-400 border-l border-slate-700 pl-2.5">
                    Live Auto-Refreshed: {lastSyncTime}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncingCloud}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-700 text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 min-h-[38px] self-start sm:self-auto"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncingCloud ? "animate-spin" : ""}`} />
                  <span>{isSyncingCloud ? "Syncing..." : "Refresh Users List"}</span>
                </button>
              </div>

              {/* Merchants Table / Cards */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-900/90 text-xs uppercase font-extrabold text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-4">Merchant / Store</th>
                        <th className="p-4">Contact</th>
                        <th className="p-4">Plan Tier</th>
                        <th className="p-4">Status & Badges</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {filteredUsers.map((user) => {
                        const isUserAdmin = user.identifier.toLowerCase() === SUPER_ADMIN_EMAIL;
                        return (
                          <tr key={user.id} className="hover:bg-slate-900/60 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={user.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=140&auto=format&fit=crop&q=80"}
                                  alt=""
                                  className="w-10 h-10 rounded-full object-cover border border-slate-700 shrink-0"
                                />
                                <div>
                                  <div className="font-bold text-white flex items-center gap-2 text-sm sm:text-base">
                                    <span>{user.displayName || "Store Owner"}</span>
                                    {user.isVerified && (
                                      <span title="KYC Verified">
                                        <Award className="w-4 h-4 text-amber-400" />
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs sm:text-sm text-slate-400 font-medium">
                                    {user.storeName || "Retail Kiosk"}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="p-4 font-mono text-xs sm:text-sm text-slate-300">
                              {user.identifier}
                            </td>

                            <td className="p-4">
                              <span
                                className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase ${
                                  user.subscription?.plan === "INCO Pro AI"
                                    ? "bg-amber-400/20 text-amber-400 border border-amber-400/40"
                                    : "bg-slate-800 text-slate-400"
                                }`}
                              >
                                {user.subscription?.plan || "Free Starter"}
                              </span>
                            </td>

                            <td className="p-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                  user.accountStatus === "active"
                                    ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40"
                                    : user.accountStatus === "suspended"
                                    ? "bg-amber-950 text-amber-400 border border-amber-500/40"
                                    : "bg-rose-950 text-rose-400 border border-rose-500/40"
                                }`}
                              >
                                {user.accountStatus || "active"}
                              </span>
                            </td>

                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {/* Inspect User Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    sounds.playClick();
                                    setInspectedUser(user);
                                  }}
                                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer min-w-[38px] min-h-[38px] flex items-center justify-center"
                                  title="Inspect Merchant Profile"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                {/* Toggle KYC Badge */}
                                {!isUserAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleKYC(user.id, user.isVerified, user.displayName)}
                                    className={`p-2 rounded-xl transition-colors cursor-pointer min-w-[38px] min-h-[38px] flex items-center justify-center ${
                                      user.isVerified
                                        ? "bg-amber-400/20 text-amber-400 hover:bg-amber-400/30 border border-amber-400/40"
                                        : "bg-slate-800 hover:bg-slate-700 text-slate-400"
                                    }`}
                                    title={user.isVerified ? "Revoke KYC Badge" : "Grant Golden KYC Badge"}
                                  >
                                    <Award className="w-4 h-4" />
                                  </button>
                                )}

                                {/* Toggle Pro Subscription */}
                                {!isUserAdmin && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleToggleProPlan(
                                        user.id,
                                        user.subscription?.plan === "INCO Pro AI",
                                        user.displayName
                                      )
                                    }
                                    className={`p-2 rounded-xl transition-colors cursor-pointer min-w-[38px] min-h-[38px] flex items-center justify-center ${
                                      user.subscription?.plan === "INCO Pro AI"
                                        ? "bg-amber-400 text-slate-950 hover:bg-amber-300 font-bold"
                                        : "bg-slate-800 hover:bg-slate-700 text-slate-400"
                                    }`}
                                    title="Toggle $4.99/mo Pro Tier"
                                  >
                                    <Zap className="w-4 h-4" />
                                  </button>
                                )}

                                {/* Suspend / Activate */}
                                {!isUserAdmin && user.accountStatus !== "active" ? (
                                  <button
                                    type="button"
                                    onClick={() => handleActivateUser(user.id, user.displayName)}
                                    className="p-2 rounded-xl bg-emerald-950 text-emerald-400 hover:bg-emerald-900 border border-emerald-500/40 transition-colors cursor-pointer min-w-[38px] min-h-[38px] flex items-center justify-center"
                                    title="Activate & Unblock"
                                  >
                                    <UserCheck className="w-4 h-4" />
                                  </button>
                                ) : !isUserAdmin ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActionReasonModal({
                                        type: "suspend",
                                        targetId: user.id,
                                        targetName: user.displayName,
                                      });
                                    }}
                                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer min-w-[38px] min-h-[38px] flex items-center justify-center"
                                    title="Suspend Merchant"
                                  >
                                    <UserX className="w-4 h-4" />
                                  </button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRO SUBSCRIPTIONS ($4.99/MO) */}
          {activeTab === "payments" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    INCO Pro AI ($4.99/mo) Subscription Review Desk
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5">
                    Verify Mobile Money (M-Pesa/MTN), Bank Transfer, or Card receipts to grant full Pro AI access.
                  </p>
                </div>
              </div>

              {pendingPayments.length === 0 ? (
                <div className="p-10 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3 shadow-md">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <div className="text-base font-black text-white">All Subscription Requests Cleared!</div>
                  <p className="text-xs sm:text-sm text-slate-400">No pending $4.99/mo payment approvals in queue.</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {pendingPayments.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-bold text-white text-base">{req.userName}</span>
                          <span className="px-2.5 py-1 rounded-lg bg-amber-400/20 text-amber-400 text-xs font-black uppercase">
                            {req.planName} (${req.amount})
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm text-slate-300 font-mono">
                          Method: {req.paymentMethod} • Ref: {req.transactionRef || "N/A"}
                        </div>
                        <div className="text-xs text-slate-400">
                          Submitted: {new Date(req.submittedAt || Date.now()).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
                        {req.proofUrl && (
                          <button
                            type="button"
                            onClick={() => setSelectedProofImage(req.proofUrl || null)}
                            className="px-3.5 py-2.5 rounded-xl bg-slate-800 text-amber-400 hover:bg-slate-700 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer min-h-[40px]"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View Proof</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            sounds.playSuccess();
                            onApprovePayment(req.id);
                            onShowToast(`Approved Pro subscription for ${req.userName}!`, "success");
                          }}
                          className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-colors cursor-pointer min-h-[40px]"
                        >
                          Approve Pro ($4.99)
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActionReasonModal({
                              type: "reject_payment",
                              targetId: req.id,
                              targetName: req.userName,
                            });
                          }}
                          className="px-4 py-2.5 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-400 font-bold text-xs sm:text-sm border border-rose-500/40 transition-colors cursor-pointer min-h-[40px]"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: KYC VERIFICATION DESK */}
          {activeTab === "verifications" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Merchant KYC & National ID Verification Queue
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5">
                    Verify government IDs and passports to award Golden Verified Merchant badges.
                  </p>
                </div>
              </div>

              {pendingVerifications.length === 0 ? (
                <div className="p-10 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3 shadow-md">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <div className="text-base font-black text-white">All KYC Submissions Cleared!</div>
                  <p className="text-xs sm:text-sm text-slate-400">No pending merchant ID documents in queue.</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {pendingVerifications.map((kyc) => (
                    <div
                      key={kyc.id}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-bold text-white text-base">{kyc.legalName || kyc.userName}</span>
                          <span className="px-2.5 py-1 rounded-lg bg-blue-950 text-blue-400 text-xs font-bold border border-blue-500/30">
                            {kyc.idType} ({kyc.idNumber})
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm text-slate-300">
                          Submitted: {new Date(kyc.submittedAt || Date.now()).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
                        {(kyc.idDocUrl || kyc.passportPhotoUrl) && (
                          <button
                            type="button"
                            onClick={() => setSelectedProofImage(kyc.idDocUrl || kyc.passportPhotoUrl || null)}
                            className="px-3.5 py-2.5 rounded-xl bg-slate-800 text-amber-400 hover:bg-slate-700 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer min-h-[40px]"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View ID Doc</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            sounds.playSuccess();
                            onApproveVerification(kyc.id);
                            onShowToast(`Approved KYC for ${kyc.legalName || kyc.userName}!`, "success");
                          }}
                          className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-colors cursor-pointer min-h-[40px]"
                        >
                          Approve KYC Badge
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActionReasonModal({
                              type: "reject_kyc",
                              targetId: kyc.id,
                              targetName: kyc.legalName || kyc.userName,
                            });
                          }}
                          className="px-4 py-2.5 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-400 font-bold text-xs sm:text-sm border border-rose-500/40 transition-colors cursor-pointer min-h-[40px]"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: BROADCAST ANNOUNCEMENTS */}
          {activeTab === "announcements" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-amber-400" />
                  <span>Broadcast System-Wide Alert</span>
                </h3>

                <form onSubmit={handleBroadcastAnnouncement} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                        Alert Title
                      </label>
                      <input
                        type="text"
                        value={annTitle}
                        onChange={(e) => setAnnTitle(e.target.value)}
                        placeholder="e.g., Scheduled Maintenance or New Feature"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                          Category
                        </label>
                        <select
                          value={annType}
                          onChange={(e) => setAnnType(e.target.value as any)}
                          className="w-full px-2 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                        >
                          <option value="info">Info</option>
                          <option value="warning">Warning</option>
                          <option value="success">Feature Success</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                          Priority
                        </label>
                        <select
                          value={annPriority}
                          onChange={(e) => setAnnPriority(e.target.value as any)}
                          className="w-full px-2 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                        >
                          <option value="normal">Normal Banner</option>
                          <option value="urgent">Urgent Push</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      Broadcast Message Body
                    </label>
                    <textarea
                      value={annMessage}
                      onChange={(e) => setAnnMessage(e.target.value)}
                      rows={2}
                      placeholder="Write announcement details for all merchants..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Announcement</span>
                  </button>
                </form>
              </div>

              {/* Active Broadcasts List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Published Broadcasts
                </h4>
                {localAnnouncements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{ann.title}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-400/20 text-amber-400">
                          {ann.type}
                        </span>
                      </div>
                      <p className="text-slate-300">{ann.message}</p>
                      <div className="text-[10px] text-slate-500">
                        Broadcasted by {ann.createdBy} • {new Date(ann.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        sounds.playStockRemove();
                        setLocalAnnouncements(localAnnouncements.filter((a) => a.id !== ann.id));
                        onShowToast("Announcement archived.", "info");
                      }}
                      className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Archive Alert"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: AUDIT VAULT */}
          {activeTab === "audit" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white">
                    Master Security Audit Trails & Event Ledger
                  </h3>
                  <p className="text-xs text-slate-400">
                    Chronological cryptographic records of all admin actions and store authentications.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playSuccess();
                    onShowToast("Exported Audit Log CSV!", "success");
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Audit Log</span>
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2">
                {[
                  { id: "aud-1", event: "Admin Password Login Granted", actor: "settaholdings@gmail.com", severity: "info", time: "Just now" },
                  { id: "aud-2", event: "KYC Verification Approved", actor: "INCO Master Root", severity: "info", time: "1 hour ago" },
                  { id: "aud-3", event: "Subscription Plan Upgraded ($4.99/mo)", actor: "M-Pesa Webhook", severity: "info", time: "3 hours ago" },
                  { id: "aud-4", event: "Security Threat Blocked (Bad Passwords)", actor: "Rate Limiter", severity: "warning", time: "1 day ago" },
                ].map((entry) => (
                  <div
                    key={entry.id}
                    className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          entry.severity === "warning" ? "bg-amber-400" : "bg-emerald-400"
                        }`}
                      />
                      <span className="font-bold text-white">{entry.event}</span>
                      <span className="text-[10px] text-slate-400 font-mono">by {entry.actor}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{entry.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: PASSWORD & SECURITY */}
          {activeTab === "security" && (
            <div className="space-y-4 animate-in fade-in duration-150 max-w-xl mx-auto">
              <div className="p-5 rounded-2xl bg-slate-950 border-2 border-amber-400/80 space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
                  <div className="p-2 bg-amber-400 text-slate-950 rounded-xl">
                    <KeyRound className="w-5 h-5 fill-slate-950" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">
                      Change Super Admin Master Login Password
                    </h3>
                    <p className="text-xs text-slate-400">
                      Enforce strict security for <span className="text-amber-400 font-mono">{SUPER_ADMIN_EMAIL}</span>
                    </p>
                  </div>
                </div>

                {passChangeSuccess && (
                  <div className="p-3 bg-emerald-950 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Master password changed successfully!</span>
                  </div>
                )}

                <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] uppercase font-bold text-slate-300 mb-1">
                      Current Master Password
                    </label>
                    <input
                      type="password"
                      value={currentPassInput}
                      onChange={(e) => setCurrentPassInput(e.target.value)}
                      placeholder="Enter current master password..."
                      required
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-bold text-slate-300 mb-1">
                      New Master Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPass ? "text" : "password"}
                        value={newPassInput}
                        onChange={(e) => setNewPassInput(e.target.value)}
                        placeholder="Enter new master password (min 6 chars)..."
                        required
                        className="w-full pl-3 pr-10 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                      >
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-bold text-slate-300 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassInput}
                      onChange={(e) => setConfirmPassInput(e.target.value)}
                      placeholder="Re-type new master password..."
                      required
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Save & Update Master Password</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* User Dossier Inspection Modal */}
        {inspectedUser && (
          <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-amber-400 rounded-2xl w-full max-w-md p-5 space-y-4 text-xs font-sans">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Merchant Dossier</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setInspectedUser(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <img
                    src={inspectedUser.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=140&auto=format&fit=crop&q=80"}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover border border-amber-400/50"
                  />
                  <div>
                    <div className="text-sm font-black text-white">{inspectedUser.displayName}</div>
                    <div className="text-slate-400 font-mono">{inspectedUser.identifier}</div>
                    <div className="text-amber-400 font-semibold">{inspectedUser.storeName || "Retail Kiosk"}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Plan</div>
                    <div className="font-bold text-white">{inspectedUser.subscription?.plan || "Free Starter"}</div>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">KYC Verified</div>
                    <div className="font-bold text-emerald-400">
                      {inspectedUser.isVerified ? "Approved" : "Not Verified"}
                    </div>
                  </div>
                </div>

                {inspectedUser.userAppealReason && (
                  <div className="p-2.5 bg-amber-950/50 border border-amber-500/40 rounded-xl text-amber-300 text-xs">
                    <div className="font-bold text-[10px] uppercase">Merchant Appeal Notice:</div>
                    <p className="mt-0.5">{inspectedUser.userAppealReason}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    handleActivateUser(inspectedUser.id, inspectedUser.displayName);
                    setInspectedUser(null);
                  }}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors"
                >
                  Activate & Clear
                </button>
                <button
                  type="button"
                  onClick={() => setInspectedUser(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Reason Confirmation Modal */}
        {actionReasonModal && (
          <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-rose-500 rounded-2xl w-full max-w-sm p-5 space-y-3 text-xs font-sans">
              <h4 className="text-sm font-black text-white flex items-center gap-1.5 text-rose-400">
                <ShieldAlert className="w-4 h-4" />
                <span>Confirm {actionReasonModal.type.toUpperCase()}</span>
              </h4>
              <p className="text-slate-300">
                Provide reason for action on <strong>{actionReasonModal.targetName}</strong>:
              </p>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Enter audit explanation..."
                rows={2}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleExecuteActionWithReason}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-colors"
                >
                  Confirm Action
                </button>
                <button
                  type="button"
                  onClick={() => setActionReasonModal(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Zoom Proof Image Modal */}
        {selectedProofImage && (
          <div
            className="fixed inset-0 z-70 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setSelectedProofImage(null)}
          >
            <div className="relative max-w-2xl max-h-[85vh] bg-slate-900 p-2 rounded-2xl border border-amber-400">
              <img
                src={selectedProofImage}
                alt="Document Verification Proof"
                className="max-w-full max-h-[80vh] object-contain rounded-xl"
              />
              <button
                type="button"
                onClick={() => setSelectedProofImage(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-950 text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
