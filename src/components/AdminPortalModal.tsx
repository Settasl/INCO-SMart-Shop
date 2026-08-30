import React, { useState } from "react";
import {
  X,
  Shield,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  DollarSign,
  FileText,
  AlertCircle,
  Sparkles,
  Lock,
  Unlock,
  KeyRound,
  ShieldAlert,
  Send,
  Eye,
  Trash2,
  UserCheck,
  UserX,
  PlusCircle,
  Activity,
  Award,
  CreditCard,
  Building,
  Smartphone,
  Check,
  Megaphone,
  Layers,
  HelpCircle,
  BadgeAlert,
  RefreshCw,
  HeartPulse,
  Sliders,
  LogOut
} from "lucide-react";
import {
  UserProfile,
  LoginRequest,
  VerificationRequest,
  PaymentRequest,
  SystemAnnouncement,
  AuditLogEntry,
} from "../types";
import { BrandLogo } from "./BrandLogo";
import { sounds } from "../lib/sound";

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile: UserProfile;
  loginRequests: LoginRequest[];
  verificationRequests: VerificationRequest[];
  paymentRequests: PaymentRequest[];
  allUsers: UserProfile[];
  announcements?: SystemAnnouncement[];
  auditLogs?: AuditLogEntry[];
  adminPassword?: string;
  onApproveLogin: (id: string) => void;
  onRejectLogin: (id: string, reason?: string) => void;
  onApproveVerification: (id: string) => void;
  onRejectVerification: (id: string, reason?: string) => void;
  onApprovePayment: (id: string) => void;
  onRejectPayment: (id: string, reason?: string) => void;
  onUpdateUserAccount?: (userId: string, updates: Partial<UserProfile>) => void;
  onDeleteUserAccount?: (userId: string) => void;
  onAddAnnouncement?: (ann: Omit<SystemAnnouncement, "id" | "createdAt">) => void;
  onChangeAdminPassword?: (newPassword: string) => void;
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
  loginRequests = [],
  verificationRequests = [],
  paymentRequests = [],
  allUsers = [],
  announcements = [],
  auditLogs = [],
  adminPassword = "INCOAdmin@2026!",
  onApproveLogin = (_id?: string) => {},
  onRejectLogin = (_id?: string, _reason?: string) => {},
  onApproveVerification = (_id?: string) => {},
  onRejectVerification = (_id?: string, _reason?: string) => {},
  onApprovePayment = (_id?: string) => {},
  onRejectPayment = (_id?: string, _reason?: string) => {},
  onUpdateUserAccount,
  onDeleteUserAccount,
  onAddAnnouncement,
  onChangeAdminPassword,
  onShowToast = (_msg?: string, _type?: string) => {},
}) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "appeals" | "logins" | "verifications" | "payments" | "announcements" | "security"
  >("overview");

  // User Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState<"all" | "active" | "suspended" | "blocked" | "appeals" | "verified">("all");

  // Inspected User Detail Modal
  const [inspectedUser, setInspectedUser] = useState<UserProfile | null>(null);
  const [selectedProofImage, setSelectedProofImage] = useState<string | null>(null);

  // Admin Action with Reason Modal (Block / Suspend / Unverify / Reject)
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
  const [passChangeSuccess, setPassChangeSuccess] = useState(false);

  // New Merchant Modal
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserIdentifier, setNewUserIdentifier] = useState("");
  const [newUserRole, setNewUserRole] = useState<"owner" | "manager" | "cashier" | "admin">("owner");
  const [newUserStore, setNewUserStore] = useState("");

  // Broadcast Announcement
  const [annTitle, setAnnTitle] = useState("");
  const [annMessage, setAnnMessage] = useState("");
  const [annType, setAnnType] = useState<"info" | "warning" | "success" | "maintenance">("info");
  const [annPriority, setAnnPriority] = useState<"normal" | "urgent">("normal");

  if (!isOpen) return null;

  const pendingLogins = loginRequests.filter((l) => l.status === "pending");
  const pendingPayments = paymentRequests.filter((p) => p.status === "pending");
  const pendingVerifications = verificationRequests.filter((v) => v.status === "pending");
  const usersWithAppeals = allUsers.filter(
    (u) => (u.accountStatus === "suspended" || u.accountStatus === "blocked") && !!u.userAppealReason
  );
  const totalPendingCount = pendingLogins.length + pendingPayments.length + pendingVerifications.length + usersWithAppeals.length;

  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch =
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.identifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.storeName && u.storeName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (userFilter === "active") return u.accountStatus === "active";
    if (userFilter === "suspended") return u.accountStatus === "suspended";
    if (userFilter === "blocked") return u.accountStatus === "blocked";
    if (userFilter === "appeals") return !!u.userAppealReason;
    if (userFilter === "verified") return u.isVerified;
    return true;
  });

  // Handle Admin Reason Actions
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
    } else if (actionReasonModal.type === "reject_login") {
      onRejectLogin(actionReasonModal.targetId, reason);
      onShowToast(`Login request for ${actionReasonModal.targetName} rejected`, "info");
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

  // Change Admin Login Password
  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPassInput !== adminPassword) {
      onShowToast("Current admin password is incorrect", "error");
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
    if (onChangeAdminPassword) {
      onChangeAdminPassword(newPassInput);
    }
    setPassChangeSuccess(true);
    setCurrentPassInput("");
    setNewPassInput("");
    setConfirmPassInput("");
    onShowToast("Admin master login password updated successfully!", "success");
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
    onShowToast("Announcement broadcasted across all INCO Smart Shop devices!", "success");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-portal-title"
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <div className="bg-slate-900 border border-yellow-400/80 rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden neon-border-amber font-sans my-auto">
        {/* Top Header */}
        <div className="p-3 sm:p-4 bg-slate-950/95 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-yellow-400 text-slate-950 rounded-xl font-bold shadow-xs neon-glow-amber">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="admin-portal-title" className="text-sm sm:text-base font-black text-white">
                  INCO Smart Shop Super Admin Console
                </h2>
                <span className="px-2 py-0.2 rounded-full bg-yellow-400 text-slate-950 text-[9px] font-black tracking-wider uppercase shadow-xs">
                  ROOT DESK
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Authorized Admin: <strong className="text-yellow-400 font-mono">settaholdings@gmail.com</strong> • Full Control Over Users, KYC, & Security
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-slate-950 px-3 pt-2 border-b border-slate-800 gap-1 overflow-x-auto scrollbar-none text-xs shrink-0">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("overview");
            }}
            className={`pb-2 px-2.5 font-black border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "overview" ? "border-yellow-400 text-yellow-400" : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Dashboard Overview</span>
            {totalPendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-yellow-400 text-slate-950 text-[9px] font-black">
                {totalPendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("users");
            }}
            className={`pb-2 px-2.5 font-black border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "users" ? "border-yellow-400 text-yellow-400" : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>User Directory ({allUsers.length})</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("appeals");
            }}
            className={`pb-2 px-2.5 font-black border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "appeals" ? "border-yellow-400 text-yellow-400" : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Suspensions & Appeals ({usersWithAppeals.length})</span>
            {usersWithAppeals.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black animate-pulse">
                {usersWithAppeals.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("logins");
            }}
            className={`pb-2 px-2.5 font-black border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "logins" ? "border-yellow-400 text-yellow-400" : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Login Approvals ({pendingLogins.length})</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("verifications");
            }}
            className={`pb-2 px-2.5 font-black border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "verifications" ? "border-yellow-400 text-yellow-400" : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <Award className="w-3.5 h-3.5 text-yellow-400" />
            <span>KYC Audits ({pendingVerifications.length})</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("payments");
            }}
            className={`pb-2 px-2.5 font-black border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "payments" ? "border-yellow-400 text-yellow-400" : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payment Approvals ({pendingPayments.length})</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab("security");
            }}
            className={`pb-2 px-2.5 font-black border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "security" ? "border-yellow-400 text-yellow-400" : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Security & Passwords</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="p-3 sm:p-4 space-y-4 overflow-y-auto flex-1 text-xs">
            {/* Metric Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Total Registered Users</div>
                <div className="text-xl font-black text-white mt-0.5">{allUsers.length}</div>
                <div className="text-[10px] text-yellow-400 font-bold mt-1">
                  {allUsers.filter((u) => u.isVerified).length} Verified Merchants
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Pending Login Approvals</div>
                <div className="text-xl font-black text-yellow-400 mt-0.5">{pendingLogins.length}</div>
                <div className="text-[10px] text-slate-400 mt-1">Awaiting 2FA Admin Pass</div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Pending KYC Submissions</div>
                <div className="text-xl font-black text-amber-400 mt-0.5">{pendingVerifications.length}</div>
                <div className="text-[10px] text-slate-400 mt-1">Govt ID & Passport Audits</div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Pending Subscriptions</div>
                <div className="text-xl font-black text-emerald-400 mt-0.5">{pendingPayments.length}</div>
                <div className="text-[10px] text-slate-400 mt-1">Mobile Money / Cards</div>
              </div>
            </div>

            {/* Quick Appeals Section */}
            {usersWithAppeals.length > 0 && (
              <div className="p-3 bg-rose-950/40 border border-rose-600 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-rose-300 font-black text-xs">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>Active User Appeals Waiting for Admin Review ({usersWithAppeals.length})</span>
                  </div>
                  <button
                    onClick={() => setActiveTab("appeals")}
                    className="text-xs text-yellow-400 hover:underline font-bold"
                  >
                    View All Appeals →
                  </button>
                </div>

                <div className="divide-y divide-rose-900/60">
                  {usersWithAppeals.slice(0, 3).map((u) => (
                    <div key={u.id} className="py-2 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-white text-xs">{u.displayName}</span>
                        <span className="text-[10px] text-rose-300 ml-2">({u.identifier})</span>
                        <p className="text-[11px] text-slate-300 mt-0.5 italic">"{u.userAppealReason}"</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setInspectedUser(u)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] font-bold"
                        >
                          Inspect
                        </button>
                        <button
                          onClick={() => handleActivateUser(u.id, u.displayName)}
                          className="px-2.5 py-1 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded text-[10px] neon-glow-amber"
                        >
                          Approve Appeal & Unblock
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Broadcast Announcement */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <h4 className="font-black text-white text-xs flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-yellow-400" />
                <span>Broadcast System Announcement to All Terminals</span>
              </h4>
              <form onSubmit={handleBroadcastAnnouncement} className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    placeholder="Announcement Title..."
                    className="sm:col-span-2 px-3 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-white text-xs focus:outline-hidden focus:border-yellow-400"
                  />
                  <select
                    value={annType}
                    onChange={(e: any) => setAnnType(e.target.value)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-white text-xs"
                  >
                    <option value="info">Info Notice</option>
                    <option value="warning">Warning / Alert</option>
                    <option value="success">Upgrade News</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={annMessage}
                    onChange={(e) => setAnnMessage(e.target.value)}
                    placeholder="Message content shown on all merchant dashboards..."
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-white text-xs focus:outline-hidden focus:border-yellow-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1 cursor-pointer neon-glow-amber"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Broadcast</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: USER DIRECTORY & DEEP INSPECTION */}
        {activeTab === "users" && (
          <div className="p-3 sm:p-4 space-y-3 overflow-y-auto flex-1 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-black text-sm text-white">Merchant Accounts & Security Administration</h3>
                <p className="text-[11px] text-slate-400">
                  Click on any user to inspect their deep profile, KYC documents, suspension history, and security controls.
                </p>
              </div>

              <button
                onClick={() => setShowAddUserModal(true)}
                className="py-1.5 px-3 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1.5 cursor-pointer neon-glow-amber"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Merchant Account</span>
              </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search user name, email, phone, or store handle..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-yellow-400"
                />
              </div>

              <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
                {(["all", "active", "suspended", "blocked", "appeals", "verified"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      sounds.playClick();
                      setUserFilter(filter);
                    }}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase transition-colors shrink-0 ${
                      userFilter === filter
                        ? "bg-slate-800 text-yellow-400 border border-yellow-400/50"
                        : "bg-slate-950 text-slate-400 hover:text-white"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Merchant Cards List */}
            <div className="space-y-2">
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                    u.accountStatus === "blocked"
                      ? "bg-rose-950/20 border-rose-800/80"
                      : u.accountStatus === "suspended"
                      ? "bg-amber-950/20 border-amber-800/80"
                      : "bg-slate-950 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5 cursor-pointer flex-1" onClick={() => setInspectedUser(u)}>
                    <img
                      src={u.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"}
                      alt={u.displayName}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-white text-xs">{u.displayName}</span>
                        {u.isVerified && (
                          <span className="px-1.5 py-0.2 rounded-full bg-yellow-400 text-slate-950 text-[8px] font-black flex items-center gap-0.5 shadow-xs">
                            <Check className="w-2 h-2 stroke-[3]" />
                            VERIFIED
                          </span>
                        )}
                        <span
                          className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border ${
                            u.role === "admin"
                              ? "bg-rose-950 text-rose-300 border-rose-800"
                              : u.role === "owner"
                              ? "bg-indigo-950 text-indigo-300 border-indigo-800"
                              : "bg-slate-850 text-slate-300 border-slate-750"
                          }`}
                        >
                          {u.role}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            u.accountStatus === "blocked"
                              ? "bg-rose-950 text-rose-300 border border-rose-700"
                              : u.accountStatus === "suspended"
                              ? "bg-amber-950 text-amber-300 border border-amber-700"
                              : "bg-emerald-950/80 text-emerald-400 border border-emerald-800"
                          }`}
                        >
                          {u.accountStatus.toUpperCase()}
                        </span>
                        {u.userAppealReason && (
                          <span className="px-1.5 py-0.2 rounded bg-rose-500 text-white text-[8px] font-black uppercase">
                            Appeal Submitted
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>{u.identifier}</span>
                        <span>•</span>
                        <span>Store: <strong className="text-yellow-400">{u.storeName || "Provision Store"}</strong></span>
                        <span>•</span>
                        <span>Plan: {u.subscription?.plan || "Free Starter"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Dropdown / Quick Controls */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => setInspectedUser(u)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-[10px] font-bold border border-slate-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3 text-yellow-400" />
                      <span>Inspect User</span>
                    </button>

                    {u.accountStatus === "suspended" || u.accountStatus === "blocked" ? (
                      <button
                        type="button"
                        onClick={() => handleActivateUser(u.id, u.displayName)}
                        className="px-2.5 py-1 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-lg text-[10px] cursor-pointer neon-glow-amber"
                      >
                        Activate / Unblock
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setActionReasonModal({
                            type: "suspend",
                            targetId: u.id,
                            targetName: u.displayName,
                          })
                        }
                        className="px-2.5 py-1 bg-rose-950/70 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        Suspend
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: SUSPENSIONS & APPEALS QUEUE */}
        {activeTab === "appeals" && (
          <div className="p-3 sm:p-4 space-y-3 overflow-y-auto flex-1 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm text-white">Suspended & Blocked Accounts Review Desk</h3>
                <p className="text-[11px] text-slate-400">
                  Review user explanations for why they were blocked. If satisfied, unblock and activate their account.
                </p>
              </div>
            </div>

            {usersWithAppeals.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="font-bold text-white">No pending suspension appeals in queue.</p>
                <p className="text-[11px] mt-0.5">When suspended users submit their reason for review, they will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {usersWithAppeals.map((u) => (
                  <div key={u.id} className="p-3.5 bg-slate-950 border border-rose-800/80 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={u.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"}
                          alt={u.displayName}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <strong className="text-white font-black text-xs">{u.displayName}</strong>
                            <span className="text-[10px] text-slate-400 font-mono">({u.identifier})</span>
                            <span className="px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[9px] font-black uppercase">
                              {u.accountStatus}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Reason Blocked: <strong className="text-rose-400">{u.suspensionReason || "Admin Review"}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setInspectedUser(u)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-[10px] font-bold"
                        >
                          Inspect Profile
                        </button>
                        <button
                          onClick={() => handleActivateUser(u.id, u.displayName)}
                          className="px-3 py-1 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-lg text-xs cursor-pointer neon-glow-amber"
                        >
                          Satisfied • Unblock & Activate
                        </button>
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
                      <span className="text-[10px] uppercase font-bold text-yellow-400 flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-yellow-400" />
                        <span>Merchant's Submitted Explanation & Appeal:</span>
                      </span>
                      <p className="text-xs text-white leading-relaxed whitespace-pre-wrap font-sans">
                        "{u.userAppealReason}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: LOGIN APPROVALS */}
        {activeTab === "logins" && (
          <div className="p-3 sm:p-4 space-y-3 overflow-y-auto flex-1 text-xs">
            <div>
              <h3 className="font-black text-sm text-white">Merchant Login Access Requests</h3>
              <p className="text-[11px] text-slate-400">
                Grant or deny one-time authorization tokens for merchants logging into the web application.
              </p>
            </div>

            {loginRequests.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 text-slate-400">
                <KeyRound className="w-8 h-8 text-yellow-400/50 mx-auto mb-2" />
                <p className="font-bold text-white">No pending login authorization requests.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {loginRequests.map((req) => (
                  <div
                    key={req.id}
                    className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                      req.status === "pending"
                        ? "bg-slate-950 border-amber-500/50 neon-border-amber"
                        : "bg-slate-950/50 border-slate-800 opacity-80"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-white text-xs">{req.userName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({req.userEmailOrPhone})</span>
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                          {req.deviceInfo}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        IP: {req.ipAddress} • {new Date(req.requestedAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      {req.status === "pending" ? (
                        <>
                          <button
                            onClick={() =>
                              setActionReasonModal({
                                type: "reject_login",
                                targetId: req.id,
                                targetName: req.userName,
                              })
                            }
                            className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-300 rounded-lg text-[10px] font-bold"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => {
                              sounds.playSuccess();
                              onApproveLogin(req.id);
                              onShowToast(`Login approved for ${req.userName}`, "success");
                            }}
                            className="px-3 py-1 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-lg text-xs neon-glow-amber"
                          >
                            Authorize Login
                          </button>
                        </>
                      ) : (
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold bg-slate-800 text-slate-300">
                          {req.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: KYC VERIFICATIONS */}
        {activeTab === "verifications" && (
          <div className="p-3 sm:p-4 space-y-3 overflow-y-auto flex-1 text-xs">
            <div>
              <h3 className="font-black text-sm text-white">Merchant KYC Document Verification Queue</h3>
              <p className="text-[11px] text-slate-400">
                Inspect passport portrait photos, government IDs, document numbers, and grant the Golden Verified Badge.
              </p>
            </div>

            {verificationRequests.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 text-slate-400">
                <Award className="w-8 h-8 text-yellow-400/50 mx-auto mb-2" />
                <p className="font-bold text-white">No KYC verification applications pending.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {verificationRequests.map((req) => (
                  <div
                    key={req.id}
                    className={`p-3.5 rounded-xl border space-y-2.5 ${
                      req.status === "pending"
                        ? "bg-slate-950 border-yellow-400/60 neon-border-amber"
                        : "bg-slate-950/60 border-slate-800 opacity-80"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white text-xs">{req.legalName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({req.userEmailOrPhone})</span>
                          <span className="px-1.5 py-0.2 rounded bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 text-[9px] font-bold">
                            {req.idType}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-300 mt-0.5">
                          ID Number: <strong className="text-yellow-400 font-mono">{req.idNumber}</strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {req.status === "pending" ? (
                          <>
                            <button
                              onClick={() =>
                                setActionReasonModal({
                                  type: "reject_kyc",
                                  targetId: req.id,
                                  targetName: req.legalName,
                                })
                              }
                              className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-300 rounded-lg text-[10px] font-bold"
                            >
                              Reject KYC
                            </button>
                            <button
                              onClick={() => {
                                sounds.playSuccess();
                                onApproveVerification(req.id);
                                onShowToast(`KYC for ${req.legalName} Approved! User is now Verified.`, "success");
                              }}
                              className="px-3 py-1 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-lg text-xs neon-glow-amber"
                            >
                              Approve & Grant Badge
                            </button>
                          </>
                        ) : (
                          <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold bg-slate-800 text-slate-300">
                            {req.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Image Previews */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div
                        onClick={() => setSelectedProofImage(req.passportPhotoUrl)}
                        className="h-28 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col items-center justify-center p-1 cursor-pointer hover:border-yellow-400 transition-colors"
                      >
                        <img src={req.passportPhotoUrl} alt="Passport" className="h-full w-full object-contain" />
                        <span className="text-[9px] text-slate-400 mt-0.5">1. Passport Photo (Click to zoom)</span>
                      </div>

                      <div
                        onClick={() => setSelectedProofImage(req.idDocUrl)}
                        className="h-28 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col items-center justify-center p-1 cursor-pointer hover:border-yellow-400 transition-colors"
                      >
                        <img src={req.idDocUrl} alt="ID Document" className="h-full w-full object-contain" />
                        <span className="text-[9px] text-slate-400 mt-0.5">2. ID Document Scan (Click to zoom)</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: PAYMENTS & SUBSCRIPTIONS */}
        {activeTab === "payments" && (
          <div className="p-3 sm:p-4 space-y-3 overflow-y-auto flex-1 text-xs">
            <div>
              <h3 className="font-black text-sm text-white">Merchant Pro Subscription Upgrades</h3>
              <p className="text-[11px] text-slate-400">
                Confirm payment transaction reference codes and activate Pro smartshop licenses.
              </p>
            </div>

            {paymentRequests.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 text-slate-400">
                <CreditCard className="w-8 h-8 text-yellow-400/50 mx-auto mb-2" />
                <p className="font-bold text-white">No subscription payments pending.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {paymentRequests.map((req) => (
                  <div
                    key={req.id}
                    className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      req.status === "pending"
                        ? "bg-slate-950 border-amber-500/50 neon-border-amber"
                        : "bg-slate-950/50 border-slate-800 opacity-80"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-white text-xs">{req.userName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({req.userEmailOrPhone})</span>
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                          {req.planName}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-300 mt-0.5 flex items-center gap-2">
                        <span>Gateway: <strong className="text-yellow-400">{req.paymentMethod}</strong></span>
                        <span>•</span>
                        <span>Ref: <strong className="text-emerald-400 font-mono">{req.transactionRef}</strong></span>
                        <span>•</span>
                        <span>Amount: <strong className="text-white font-mono">${req.amount} USD</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      {req.proofUrl && (
                        <button
                          onClick={() => setSelectedProofImage(req.proofUrl || null)}
                          className="px-2 py-1 bg-slate-800 text-slate-200 rounded text-[10px] font-bold"
                        >
                          Proof Receipt
                        </button>
                      )}

                      {req.status === "pending" ? (
                        <>
                          <button
                            onClick={() =>
                              setActionReasonModal({
                                type: "reject_payment",
                                targetId: req.id,
                                targetName: req.userName,
                              })
                            }
                            className="px-2.5 py-1 bg-rose-950/80 text-rose-300 rounded-lg text-[10px] font-bold"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => {
                              sounds.playSuccess();
                              onApprovePayment(req.id);
                              onShowToast(`Payment for ${req.userName} approved! Pro unlocked.`, "success");
                            }}
                            className="px-3 py-1 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-lg text-xs neon-glow-amber"
                          >
                            Confirm Payment
                          </button>
                        </>
                      ) : (
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold bg-slate-800 text-slate-300">
                          {req.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 7: SECURITY & ADMIN PASSWORD MANAGEMENT */}
        {activeTab === "security" && (
          <div className="p-3 sm:p-4 space-y-4 overflow-y-auto flex-1 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-yellow-400 font-black text-xs">
                <Lock className="w-4 h-4" />
                <span>Admin Login Security & Password Management</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Change your Super Admin master login password. Only the designated root email (<strong className="text-white">settaholdings@gmail.com</strong>) has access to this portal.
              </p>
            </div>

            {/* Password Change Form */}
            <form onSubmit={handleChangePasswordSubmit} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 max-w-lg">
              <h4 className="font-black text-white text-xs uppercase tracking-wider">Change Admin Master Password</h4>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Current Admin Password *
                </label>
                <input
                  type="password"
                  required
                  value={currentPassInput}
                  onChange={(e) => setCurrentPassInput(e.target.value)}
                  placeholder="Enter current password..."
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-750 focus:border-yellow-400 rounded-lg text-white text-xs focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    New Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassInput}
                    onChange={(e) => setNewPassInput(e.target.value)}
                    placeholder="Min 6 characters..."
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-750 focus:border-yellow-400 rounded-lg text-white text-xs focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassInput}
                    onChange={(e) => setConfirmPassInput(e.target.value)}
                    placeholder="Repeat new password..."
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-750 focus:border-yellow-400 rounded-lg text-white text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              {passChangeSuccess && (
                <div className="p-2 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-lg text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Admin password successfully updated!</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-lg text-xs uppercase cursor-pointer neon-glow-amber"
              >
                Update Admin Password
              </button>
            </form>

            {/* Extra Security Hardening Info */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <h4 className="font-black text-white text-xs">Security Hardening Layers Active</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <div className="font-bold text-yellow-400">AES-256 GCM Health Vault</div>
                  <div className="text-slate-400 text-[10px] mt-0.5">Confidential medical records sealed with SHA-256 derived keys.</div>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <div className="font-bold text-emerald-400">30-Day Anti-Tamper Cooldown</div>
                  <div className="text-slate-400 text-[10px] mt-0.5">Locks merchant profile names against rapid identity swapping.</div>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <div className="font-bold text-indigo-400">Role-Based Access Control</div>
                  <div className="text-slate-400 text-[10px] mt-0.5">Admin portal restricted strictly to authenticated root accounts.</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* USER DETAIL DEEP INSPECTION MODAL */}
      {inspectedUser && (
        <div className="fixed inset-0 z-60 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-yellow-400 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden neon-border-amber font-sans my-auto">
            {/* Modal Header */}
            <div className="p-3 sm:p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src={inspectedUser.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"}
                  alt={inspectedUser.displayName}
                  className="w-12 h-12 rounded-xl object-cover border-2 border-yellow-400"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-white text-base">{inspectedUser.displayName}</h3>
                    {inspectedUser.isVerified && (
                      <span className="px-1.5 py-0.2 rounded-full bg-yellow-400 text-slate-950 text-[9px] font-black">
                        VERIFIED
                      </span>
                    )}
                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[9px] font-mono uppercase">
                      Status: {inspectedUser.accountStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    ID: {inspectedUser.id} • {inspectedUser.identifier}
                  </p>
                </div>
              </div>

              <button onClick={() => setInspectedUser(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">
              {/* If Account is Suspended or Blocked */}
              {(inspectedUser.accountStatus === "suspended" || inspectedUser.accountStatus === "blocked") && (
                <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl space-y-2">
                  <div className="font-black text-rose-300 text-xs flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>Account is Currently {inspectedUser.accountStatus.toUpperCase()}</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Reason for Suspension: <strong className="text-white">{inspectedUser.suspensionReason || "Admin Review"}</strong>
                  </p>

                  {inspectedUser.userAppealReason && (
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-rose-900 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-yellow-400">
                        Merchant Submitted Appeal / Justification:
                      </span>
                      <p className="text-xs text-white leading-relaxed whitespace-pre-wrap">
                        "{inspectedUser.userAppealReason}"
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleActivateUser(inspectedUser.id, inspectedUser.displayName)}
                      className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-lg text-xs cursor-pointer neon-glow-amber"
                    >
                      ✓ Satisfied with Reason: Unblock & Activate Account
                    </button>
                  </div>
                </div>
              )}

              {/* Dossier Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Store & Location</span>
                  <div className="font-bold text-white text-xs">{inspectedUser.storeName || "Provision Store"}</div>
                  <div className="text-[11px] text-slate-400">{inspectedUser.location || "Location not set"}</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Subscription Tier</span>
                  <div className="font-bold text-yellow-400 text-xs">{inspectedUser.subscription?.plan || "Free Starter"}</div>
                  <div className="text-[11px] text-slate-400">Status: {inspectedUser.subscription?.status || "Active"}</div>
                </div>
              </div>

              {/* KYC Documents Section */}
              {inspectedUser.verificationDocs && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-yellow-400">
                      KYC Legal Identity Documents
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {inspectedUser.verificationDocs.idType}: {inspectedUser.verificationDocs.idNumber}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {inspectedUser.verificationDocs.passportPhotoUrl && (
                      <div
                        onClick={() => setSelectedProofImage(inspectedUser.verificationDocs?.passportPhotoUrl || null)}
                        className="h-28 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col items-center justify-center p-1 cursor-pointer hover:border-yellow-400"
                      >
                        <img
                          src={inspectedUser.verificationDocs.passportPhotoUrl}
                          alt="Passport"
                          className="h-full w-full object-contain"
                        />
                        <span className="text-[9px] text-slate-400 mt-0.5">Passport Photo</span>
                      </div>
                    )}

                    {inspectedUser.verificationDocs.idDocUrl && (
                      <div
                        onClick={() => setSelectedProofImage(inspectedUser.verificationDocs?.idDocUrl || null)}
                        className="h-28 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col items-center justify-center p-1 cursor-pointer hover:border-yellow-400"
                      >
                        <img
                          src={inspectedUser.verificationDocs.idDocUrl}
                          alt="ID Document"
                          className="h-full w-full object-contain"
                        />
                        <span className="text-[9px] text-slate-400 mt-0.5">Government ID</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Admin Control Actions */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Admin Master Actions for This User:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {inspectedUser.isVerified ? (
                    <button
                      onClick={() =>
                        setActionReasonModal({
                          type: "unverify",
                          targetId: inspectedUser.id,
                          targetName: inspectedUser.displayName,
                        })
                      }
                      className="p-2 bg-amber-950/70 hover:bg-amber-900 border border-amber-700 text-amber-300 rounded-lg text-center font-bold text-xs cursor-pointer"
                    >
                      Unverify Account
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        sounds.playSuccess();
                        if (onUpdateUserAccount) {
                          onUpdateUserAccount(inspectedUser.id, { isVerified: true });
                        }
                        setInspectedUser({ ...inspectedUser, isVerified: true });
                        onShowToast(`Verified badge granted to ${inspectedUser.displayName}`, "success");
                      }}
                      className="p-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 rounded-lg text-center font-black text-xs cursor-pointer neon-glow-amber"
                    >
                      Grant Verified Badge
                    </button>
                  )}

                  {inspectedUser.accountStatus === "active" ? (
                    <>
                      <button
                        onClick={() =>
                          setActionReasonModal({
                            type: "suspend",
                            targetId: inspectedUser.id,
                            targetName: inspectedUser.displayName,
                          })
                        }
                        className="p-2 bg-amber-950/70 hover:bg-amber-900 border border-amber-700 text-amber-300 rounded-lg text-center font-bold text-xs cursor-pointer"
                      >
                        Suspend User
                      </button>

                      <button
                        onClick={() =>
                          setActionReasonModal({
                            type: "block",
                            targetId: inspectedUser.id,
                            targetName: inspectedUser.displayName,
                          })
                        }
                        className="p-2 bg-rose-950/70 hover:bg-rose-900 border border-rose-700 text-rose-300 rounded-lg text-center font-bold text-xs cursor-pointer"
                      >
                        Block User
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleActivateUser(inspectedUser.id, inspectedUser.displayName)}
                      className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-center font-black text-xs cursor-pointer"
                    >
                      Activate Account
                    </button>
                  )}

                  <button
                    onClick={() =>
                      setActionReasonModal({
                        type: "delete",
                        targetId: inspectedUser.id,
                        targetName: inspectedUser.displayName,
                      })
                    }
                    className="p-2 bg-rose-950 hover:bg-rose-900 border border-rose-600 text-rose-300 rounded-lg text-center font-bold text-xs cursor-pointer"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REASON PROMPT MODAL (FOR BLOCK, SUSPEND, UNVERIFY, REJECT) */}
      {actionReasonModal && (
        <div className="fixed inset-0 z-70 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-slate-900 border border-yellow-400 rounded-2xl max-w-sm w-full p-4 space-y-3 shadow-2xl">
            <div className="text-center">
              <h4 className="font-black text-white text-sm uppercase">
                {actionReasonModal.type === "block"
                  ? "Block User Account"
                  : actionReasonModal.type === "suspend"
                  ? "Suspend User Account"
                  : actionReasonModal.type === "unverify"
                  ? "Revoke Verification Badge"
                  : actionReasonModal.type === "delete"
                  ? "Permanently Delete User"
                  : "Reject Request"}
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                Target: <strong className="text-yellow-400">{actionReasonModal.targetName}</strong>
              </p>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                State Reason for this Action *
              </label>
              <textarea
                rows={3}
                required
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="e.g. Identity discrepancy, fraudulent report, policy violation..."
                className="w-full p-2.5 bg-slate-950 border border-slate-750 focus:border-yellow-400 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setActionReasonModal(null);
                  setActionReason("");
                }}
                className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteActionWithReason}
                className="flex-1 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-lg text-xs cursor-pointer neon-glow-amber"
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROOF IMAGE ZOOM MODAL */}
      {selectedProofImage && (
        <div
          onClick={() => setSelectedProofImage(null)}
          className="fixed inset-0 z-70 bg-slate-950/95 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden p-2">
            <img src={selectedProofImage} alt="Document Proof" className="max-h-[80vh] object-contain mx-auto rounded-lg" />
            <button
              onClick={() => setSelectedProofImage(null)}
              className="absolute top-4 right-4 bg-slate-950/80 text-white p-2 rounded-full font-bold"
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
