import React, { useState } from "react";
import { motion } from "motion/react";
import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  ChevronLeft,
  Check,
  KeyRound,
  Copy,
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import {
  SUPER_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASS,
  RegisteredAccount,
  loadRegisteredAccounts,
  saveRegisteredAccounts,
  setActiveSessionUser,
  generateResetToken,
  verifyResetToken,
  clearResetToken,
  updateAccountPassword,
} from "../lib/userRegistry";
import { sounds } from "../lib/sound";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserAccount: RegisteredAccount | null;
  onSuccessLogin: (account: RegisteredAccount) => void;
  onLogout: () => void;
  onDeleteAccount?: (accountId: string) => void;
  strictMode?: boolean;
  onShowToast?: (msg: string, type?: "success" | "error" | "info") => void;
  initialTab?: "signup" | "login";
}

type AuthTab = "signup" | "login";
type AuthStep = "form" | "forgot_password" | "reset_password";

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUserAccount,
  onSuccessLogin,
  onLogout,
  strictMode = false,
  onShowToast,
  initialTab = "login",
}) => {
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  const [authStep, setAuthStep] = useState<AuthStep>("form");

  // Reset tab when modal opens or initialTab changes
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setAuthStep("form");
      setErrorMsg(null);
    }
  }, [isOpen, initialTab]);

  // Form Fields
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Mock Reset Token & Password Recovery Fields
  const [pendingTarget, setPendingTarget] = useState<string>("");
  const [generatedMockToken, setGeneratedMockToken] = useState<string>("");
  const [enteredResetToken, setEnteredResetToken] = useState<string>("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [hasCopiedToken, setHasCopiedToken] = useState(false);

  // Status
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Submit Sign Up - Instant Direct Registration & Login
  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    setErrorMsg(null);

    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId || (!cleanId.includes("@") && cleanId.length < 6)) {
      setErrorMsg("Please enter a valid email address or phone number.");
      return;
    }
    if (password.length < 4) {
      setErrorMsg("Password must be at least 4 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please verify.");
      return;
    }
    if (!agreeTerms) {
      setErrorMsg("Please accept the Terms of Service & Privacy Policy.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const accounts = loadRegisteredAccounts();
      const existing = accounts.find((a) => a.emailOrPhone.toLowerCase() === cleanId);

      if (existing) {
        setErrorMsg("An account with this email/phone already exists. Please log in.");
        return;
      }

      const isDefaultSuperAdmin = cleanId === SUPER_ADMIN_EMAIL;

      const newAccount: RegisteredAccount = {
        id: `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        emailOrPhone: cleanId,
        passwordHash: password.trim(),
        displayName: cleanId.includes("@")
          ? cleanId.split("@")[0].charAt(0).toUpperCase() + cleanId.split("@")[0].slice(1)
          : `Merchant ${cleanId.slice(-4)}`,
        storeName: "My Store",
        role: isDefaultSuperAdmin ? "admin" : "merchant",
        isVerified: isDefaultSuperAdmin,
        verificationStatus: isDefaultSuperAdmin ? "approved" : "none",
        accountStatus: "active",
        isPro: isDefaultSuperAdmin,
        avatarUrl:
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=140&auto=format&fit=crop&q=80",
        createdAt: new Date().toISOString(),
      };

      // Save new user account and activate session immediately
      const updatedAccounts = [newAccount, ...accounts.filter((a) => a.id !== newAccount.id)];
      saveRegisteredAccounts(updatedAccounts);
      setActiveSessionUser(newAccount);
      sounds.playSuccess();
      onSuccessLogin(newAccount);
      onClose();

      if (onShowToast) {
        onShowToast(`🎉 Account created! Welcome to INCO Smart Shop, ${newAccount.displayName}!`, "success");
      }
    }, 150);
  };

  // Submit Login - Instant Direct Authentication
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    setErrorMsg(null);

    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId) {
      setErrorMsg("Please enter your registered email or phone number.");
      return;
    }
    if (!password.trim()) {
      setErrorMsg("Please enter your password.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const accounts = loadRegisteredAccounts();
      const existing = accounts.find((a) => a.emailOrPhone.toLowerCase() === cleanId);

      // Check Master Super Admin
      if (cleanId === SUPER_ADMIN_EMAIL) {
        const activeAdminPass =
          localStorage.getItem("inco_admin_master_password") || DEFAULT_ADMIN_PASS;

        if (password.trim() !== activeAdminPass && (!existing || password.trim() !== existing.passwordHash)) {
          setErrorMsg("Incorrect admin password. Please verify and try again.");
          return;
        }

        const adminAcc: RegisteredAccount = existing || {
          id: "user-super-admin-01",
          emailOrPhone: SUPER_ADMIN_EMAIL,
          passwordHash: activeAdminPass,
          displayName: "INCO Master Admin",
          storeName: "Setta SL Ltd",
          role: "admin",
          isVerified: true,
          verificationStatus: "approved",
          accountStatus: "active",
          isPro: true,
          avatarUrl:
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=140&auto=format&fit=crop&q=80",
          createdAt: new Date().toISOString(),
        };

        setActiveSessionUser(adminAcc);
        sounds.playSuccess();
        onSuccessLogin(adminAcc);
        onClose();

        if (onShowToast) {
          onShowToast(`👋 Welcome Master Admin (${SUPER_ADMIN_EMAIL})!`, "success");
        }
        return;
      }

      if (!existing) {
        setErrorMsg("Account not found. Please verify credentials or switch to Sign Up.");
        return;
      }

      if (existing.passwordHash && existing.passwordHash !== password.trim()) {
        setErrorMsg("Incorrect password. Please check your password or click Forgot Password.");
        return;
      }

      if (existing.accountStatus === "blocked" || existing.accountStatus === "suspended") {
        setErrorMsg(`Your account is currently ${existing.accountStatus}. Please contact support.`);
        return;
      }

      // Successful merchant login
      setActiveSessionUser(existing);
      sounds.playSuccess();
      onSuccessLogin(existing);
      onClose();

      if (onShowToast) {
        onShowToast(`👋 Welcome back, ${existing.displayName}!`, "success");
      }
    }, 150);
  };

  // Submit Forgot Password Request -> Generate Mock Reset Token
  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    setErrorMsg(null);

    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId) {
      setErrorMsg("Please enter your registered email or phone number.");
      return;
    }

    const accounts = loadRegisteredAccounts();
    const existing = accounts.find((a) => a.emailOrPhone.toLowerCase() === cleanId);
    if (!existing && cleanId !== SUPER_ADMIN_EMAIL) {
      setErrorMsg("No account found matching this email or phone number.");
      return;
    }

    const { token } = generateResetToken(cleanId);
    setPendingTarget(cleanId);
    setGeneratedMockToken(token);
    setEnteredResetToken(token); // Pre-fill token for seamless UX
    setAuthStep("reset_password");
    sounds.playSuccess();

    if (onShowToast) {
      onShowToast(`🔑 Mock Reset Token Generated: ${token}`, "info");
    }
  };

  // Copy Mock Token Helper
  const handleCopyMockToken = () => {
    if (generatedMockToken) {
      navigator.clipboard.writeText(generatedMockToken);
      setHasCopiedToken(true);
      sounds.playClick();
      setTimeout(() => setHasCopiedToken(false), 2000);
      if (onShowToast) {
        onShowToast("📋 Reset token copied to clipboard!", "info");
      }
    }
  };

  // Save New Reset Password with Token Verification
  const handleSaveResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    setErrorMsg(null);

    if (!enteredResetToken.trim()) {
      setErrorMsg("Please enter the reset token.");
      return;
    }

    const verifyResult = verifyResetToken(pendingTarget, enteredResetToken.trim());
    if (!verifyResult.success) {
      setErrorMsg(verifyResult.error || "Invalid or expired reset token.");
      return;
    }

    if (newPassword.length < 4) {
      setErrorMsg("New password must be at least 4 characters long.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMsg("Passwords do not match. Please verify.");
      return;
    }

    const updated = updateAccountPassword(pendingTarget, newPassword.trim());
    if (!updated) {
      setErrorMsg("Failed to update password. Account not found.");
      return;
    }

    clearResetToken();
    sounds.playSuccess();
    const accounts = loadRegisteredAccounts();
    const existing = accounts.find((a) => a.emailOrPhone.toLowerCase() === pendingTarget.toLowerCase());

    if (existing) {
      setActiveSessionUser(existing);
      onSuccessLogin(existing);
    }
    onClose();

    if (onShowToast) {
      onShowToast("✅ Password updated successfully! You are now logged in.", "success");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans"
    >
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl w-full max-w-sm sm:max-w-md shadow-2xl relative my-auto overflow-hidden border border-slate-200 dark:border-slate-800 p-5 sm:p-6 transition-colors">
        {/* Close Button */}
        {(!strictMode || currentUserAccount) && (
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="absolute top-4 right-4 z-20 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Modal Top Header with Yellow App Icon */}
        <div className="flex items-center gap-2.5 mb-4">
          <BrandLogo size="xs" theme="yellowAppIcon" animated={false} />
          <div>
            <h2 className="text-sm font-black tracking-tight text-slate-900 dark:text-white leading-none">
              INCO <span className="text-amber-500 dark:text-amber-400">Smart Shop</span>
            </h2>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              {authStep === "forgot_password"
                ? "Password Recovery"
                : authStep === "reset_password"
                ? "Verify Token & Reset"
                : activeTab === "signup"
                ? "Merchant Registration"
                : "Merchant Sign In"}
            </span>
          </div>
        </div>

        <div>
          {authStep === "forgot_password" ? (
            /* ========================================================================= */
            /* FORGOT PASSWORD STEP: Request Mock Reset Token */
            /* ========================================================================= */
            <div>
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setAuthStep("form");
                    setErrorMsg(null);
                  }}
                  className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Reset Password
                </h3>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                Enter your registered email address or phone number to generate a secure reset token.
              </p>

              {errorMsg && (
                <div className="mb-2.5 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email or Phone Number
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Enter email or phone number"
                      required
                      className="w-full pl-8.5 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-amber-400 transition-all font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-3"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Generate Reset Token</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </form>
            </div>
          ) : authStep === "reset_password" ? (
            /* ========================================================================= */
            /* SET NEW PASSWORD WITH MOCK RESET TOKEN STEP */
            /* ========================================================================= */
            <div>
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setAuthStep("forgot_password");
                    setErrorMsg(null);
                  }}
                  className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Enter Token & New Password
                </h3>
              </div>

              {/* Generated Mock Token Highlight Card */}
              {generatedMockToken && (
                <div className="mb-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 dark:border-amber-500/20 text-slate-900 dark:text-white">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <KeyRound className="w-3 h-3" />
                      Mock Reset Token (Valid 15m)
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyMockToken}
                      className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                    >
                      {hasCopiedToken ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-500">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-white dark:bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-amber-400/30">
                    <span className="font-mono text-sm font-black text-amber-600 dark:text-amber-400 tracking-wider">
                      {generatedMockToken}
                    </span>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400">
                      for {pendingTarget}
                    </span>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="mb-2.5 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveResetPassword} className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reset Token
                  </label>
                  <div className="relative">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={enteredResetToken}
                      onChange={(e) => setEnteredResetToken(e.target.value)}
                      placeholder="e.g. RST-123456"
                      required
                      className="w-full pl-8.5 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-amber-400 transition-all font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Create new password"
                      required
                      className="w-full pl-8.5 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-amber-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                      className="w-full pl-8.5 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-amber-400 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-3"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Verify Token & Reset Password</span>
                </button>
              </form>
            </div>
          ) : (
            /* ========================================================================= */
            /* MAIN SIGN UP / LOGIN FORM */
            /* ========================================================================= */
            <div>
              {/* Tab Switcher */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 mb-3">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setActiveTab("login");
                    setErrorMsg(null);
                  }}
                  className={`pb-2 px-3 text-xs font-black relative transition-colors cursor-pointer ${
                    activeTab === "login"
                      ? "text-slate-950 dark:text-amber-400"
                      : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  Login
                  {activeTab === "login" && (
                    <motion.div
                      layoutId="activeAuthUnderline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400"
                    />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setActiveTab("signup");
                    setErrorMsg(null);
                  }}
                  className={`pb-2 px-3 text-xs font-black relative transition-colors cursor-pointer ${
                    activeTab === "signup"
                      ? "text-slate-950 dark:text-amber-400"
                      : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  Sign Up
                  {activeTab === "signup" && (
                    <motion.div
                      layoutId="activeAuthUnderline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400"
                    />
                  )}
                </button>
              </div>

              {/* Error Banner */}
              {errorMsg && (
                <div className="mb-2.5 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Form Fields */}
              <form
                onSubmit={activeTab === "signup" ? handleSignUpSubmit : handleLoginSubmit}
                className="space-y-2.5"
              >
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email or Phone Number
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Enter email or phone number"
                      required
                      className="w-full pl-8.5 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-amber-400 transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Password</label>
                    {activeTab === "login" && (
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setAuthStep("forgot_password");
                          setErrorMsg(null);
                        }}
                        className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline font-bold cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={activeTab === "signup" ? "Create a password" : "Enter your password"}
                      required
                      className="w-full pl-8.5 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-amber-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {activeTab === "signup" && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        required
                        className="w-full pl-8.5 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-amber-400 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "signup" && (
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <input
                      type="checkbox"
                      id="terms-checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
                    />
                    <label htmlFor="terms-checkbox" className="text-[10px] text-slate-600 dark:text-slate-400 cursor-pointer">
                      I agree to the{" "}
                      <span className="text-amber-600 dark:text-amber-400 font-bold underline">Terms</span> &{" "}
                      <span className="text-amber-600 dark:text-amber-400 font-bold underline">Privacy Policy</span>
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-2"
                >
                  <span>
                    {isLoading
                      ? "Verifying..."
                      : activeTab === "signup"
                      ? "Create Store Account"
                      : "Login to Store"}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </form>

              {/* Bottom Toggle Link */}
              <div className="text-center pt-3 text-xs text-slate-500 dark:text-slate-400">
                {activeTab === "signup" ? (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setActiveTab("login");
                        setErrorMsg(null);
                      }}
                      className="text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                    >
                      Login
                    </button>
                  </>
                ) : (
                  <>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setActiveTab("signup");
                        setErrorMsg(null);
                      }}
                      className="text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Security Badges */}
        <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-medium">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>Encrypted Session</span>
          </div>
          <span className="text-slate-400 dark:text-slate-500">
            Setta SL Ltd
          </span>
        </div>
      </div>
    </div>
  );
};

