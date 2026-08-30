import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ScanLine,
  Box,
  PieChart,
  ChevronLeft,
  RefreshCw,
  Check,
  Sparkles,
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import {
  SUPER_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASS,
  RegisteredAccount,
  loadRegisteredAccounts,
  saveRegisteredAccounts,
  setActiveSessionUser,
  generateAndStoreOtp,
  verifyOtpCode,
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
}

type AuthTab = "signup" | "login";
type AuthStep = "form" | "otp" | "forgot_password" | "reset_password";

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUserAccount,
  onSuccessLogin,
  onLogout,
  strictMode = false,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<AuthTab>("signup");
  const [authStep, setAuthStep] = useState<AuthStep>("form");

  // Form Fields
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP Verification
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [otpCountdown, setOtpCountdown] = useState<number>(300);
  const [pendingTarget, setPendingTarget] = useState<string>("");
  const [pendingAccount, setPendingAccount] = useState<RegisteredAccount | null>(null);
  const [otpPurpose, setOtpPurpose] = useState<"login" | "signup" | "reset_password">("signup");

  // Reset Password Fields
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Status
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // OTP Countdown timer
  useEffect(() => {
    let timer: any;
    if (authStep === "otp" && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [authStep, otpCountdown]);

  if (!isOpen) return null;

  const triggerOtpDispatch = (target: string, purpose: "login" | "signup" | "reset_password") => {
    const { code } = generateAndStoreOtp(target, purpose);
    setPendingTarget(target);
    setOtpPurpose(purpose);
    setOtpCountdown(300);
    setOtpCode(["", "", "", "", "", ""]);
    setAuthStep("otp");
    sounds.playSuccess();

    // Notify user via simulated email/SMS delivery toast without leaking system secrets
    const maskedTarget = target.includes("@")
      ? target.replace(/^(.{2})(.*)(@.*)$/, "$1***$3")
      : target.slice(0, 3) + "***" + target.slice(-3);

    if (onShowToast) {
      onShowToast(
        `📩 Verification code dispatched to ${maskedTarget} (Code: ${code})`,
        "info"
      );
    }

    setTimeout(() => {
      otpInputRefs.current[0]?.focus();
    }, 150);
  };

  // Submit Sign Up
  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    setErrorMsg(null);
    setSuccessMsg(null);

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

      setPendingAccount(newAccount);
      triggerOtpDispatch(cleanId, "signup");
    }, 200);
  };

  // Submit Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    setErrorMsg(null);
    setSuccessMsg(null);

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
          setErrorMsg("Incorrect credentials. Please check and try again.");
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

        setPendingAccount(adminAcc);
        triggerOtpDispatch(cleanId, "login");
        return;
      }

      if (!existing) {
        setErrorMsg("Account not found. Please verify your credentials or create an account.");
        return;
      }

      if (existing.passwordHash && existing.passwordHash !== password.trim()) {
        setErrorMsg("Incorrect password. Please try again or reset your password.");
        return;
      }

      if (existing.accountStatus === "blocked" || existing.accountStatus === "suspended") {
        setErrorMsg(`Your account is currently ${existing.accountStatus}. Please contact support.`);
        return;
      }

      setPendingAccount(existing);
      triggerOtpDispatch(cleanId, "login");
    }, 200);
  };

  // Submit Forgot Password Request
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

    triggerOtpDispatch(cleanId, "reset_password");
  };

  // OTP Digit Change
  const handleOtpDigitChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, "").slice(-1);
    const newOtp = [...otpCode];
    newOtp[index] = cleanVal;
    setOtpCode(newOtp);

    if (cleanVal && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handlePasteOtp = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      const newOtp = ["", "", "", "", "", ""];
      for (let i = 0; i < pasted.length; i++) {
        newOtp[i] = pasted[i];
      }
      setOtpCode(newOtp);
      const nextFocus = Math.min(pasted.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
    }
  };

  // Verify OTP Code
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    setErrorMsg(null);

    const fullCode = otpCode.join("");
    if (fullCode.length !== 6) {
      setErrorMsg("Please enter the complete 6-digit OTP code.");
      return;
    }

    const verificationResult = verifyOtpCode(pendingTarget, fullCode, otpPurpose);
    if (!verificationResult.success) {
      setErrorMsg(verificationResult.error || "Invalid OTP code. Please check and try again.");
      sounds.playBeep();
      return;
    }

    sounds.playSuccess();

    if (otpPurpose === "reset_password") {
      setAuthStep("reset_password");
      setSuccessMsg("OTP verified! Create your new password below.");
      return;
    }

    if (otpPurpose === "signup" && pendingAccount) {
      const accounts = loadRegisteredAccounts();
      const updated = [pendingAccount, ...accounts.filter((a) => a.id !== pendingAccount.id)];
      saveRegisteredAccounts(updated);
      setActiveSessionUser(pendingAccount);
      onSuccessLogin(pendingAccount);
      onClose();
      return;
    }

    if (otpPurpose === "login" && pendingAccount) {
      setActiveSessionUser(pendingAccount);
      onSuccessLogin(pendingAccount);
      onClose();
      return;
    }
  };

  // Save New Reset Password
  const handleSaveResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    setErrorMsg(null);

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

    sounds.playSuccess();
    setSuccessMsg("Password successfully reset! You can now log in.");
    setPassword(newPassword.trim());
    setNewPassword("");
    setConfirmNewPassword("");
    setActiveTab("login");
    setAuthStep("form");
  };

  const handleResendOtp = () => {
    sounds.playClick();
    triggerOtpDispatch(pendingTarget, otpPurpose);
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
              {authStep === "otp"
                ? "Security Verification"
                : authStep === "forgot_password"
                ? "Password Recovery"
                : authStep === "reset_password"
                ? "Set New Password"
                : activeTab === "signup"
                ? "Merchant Registration"
                : "Merchant Sign In"}
            </span>
          </div>
        </div>

        <div>
          {authStep === "otp" ? (
            /* ========================================================================= */
            /* OTP VERIFICATION STEP */
            /* ========================================================================= */
            <div>
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setAuthStep(otpPurpose === "reset_password" ? "forgot_password" : "form");
                    setErrorMsg(null);
                  }}
                  className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Verify Your Account
                </h3>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                Enter the 6-digit verification code sent to{" "}
                <strong className="text-slate-900 dark:text-amber-400 font-mono">{pendingTarget}</strong>.
              </p>

              {errorMsg && (
                <div className="mb-2.5 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <div className="flex justify-between gap-1 sm:gap-1.5">
                  {otpCode.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpInputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handlePasteOtp}
                      className="w-10 h-11 text-center text-lg font-black font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 transition-all"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                  <span>
                    Expires in:{" "}
                    <strong className="font-mono text-slate-700 dark:text-slate-200">
                      {Math.floor(otpCountdown / 60)}:{(otpCountdown % 60).toString().padStart(2, "0")}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-amber-600 dark:text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Resend Code</span>
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                >
                  <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                  <span>Verify & Continue</span>
                </button>
              </form>
            </div>
          ) : authStep === "forgot_password" ? (
            /* ========================================================================= */
            /* FORGOT PASSWORD STEP */
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
                Enter your registered email address or phone number to receive a verification OTP code.
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
                    Email or Phone
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Enter email address or phone number"
                      required
                      className="w-full pl-8.5 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-amber-400 transition-all font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-3"
                >
                  <span>Send Verification Code</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </form>
            </div>
          ) : authStep === "reset_password" ? (
            /* ========================================================================= */
            /* SET NEW PASSWORD STEP */
            /* ========================================================================= */
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white mb-1">
                Create New Password
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                Set a new secure password for <strong className="text-slate-900 dark:text-amber-400">{pendingTarget}</strong>.
              </p>

              {errorMsg && (
                <div className="mb-2.5 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveResetPassword} className="space-y-2.5">
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
                      placeholder="Create password"
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
                      placeholder="Confirm password"
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
                  <span>Save Password & Log In</span>
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
                    Email or Phone
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
              <div className="text-center pt-2.5 text-xs text-slate-500 dark:text-slate-400">
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
