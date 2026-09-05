import React, { useState } from "react";
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
  Globe,
  Key,
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { RegisteredAccount, SUPER_ADMIN_EMAIL } from "../lib/userRegistry";
import { sounds } from "../lib/sound";
import { useAuth } from "../context/AuthContext";
import { isGoogleEmail } from "../lib/googleAuth";

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
type AuthStep = "form" | "forgot_password" | "reset_sent" | "google_direct";

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
  const {
    signIn,
    signUp,
    signInWithGoogleAuth,
    signInWithGoogleDirectEmail,
    resetPassword,
    signOut: fbSignOut,
    user,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  const [authStep, setAuthStep] = useState<AuthStep>("form");
  const [googleDirectEmail, setGoogleDirectEmail] = useState<string>("");

  // Form Fields
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState<string>("");

  // Reset tab when modal opens or initialTab changes
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setAuthStep("form");
      setErrorMsg(null);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Helper to normalize email
  const getNormalizedEmail = (input: string): string => {
    const clean = input.trim().toLowerCase();
    if (clean.includes("@")) return clean;
    // If phone number or bare username entered, normalize to domain format
    const sanitized = clean.replace(/[^a-zA-Z0-9]/g, "");
    return `${sanitized}@inco.app`;
  };

  // Submit Sign Up via Firebase Authentication
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    setErrorMsg(null);

    const email = getNormalizedEmail(identifier);
    if (!email || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address (e.g. store@inco.app).");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
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

    try {
      const displayName = storeName.trim() || email.split("@")[0];
      await signUp(email, password, displayName);

      const account: RegisteredAccount = {
        id: email,
        emailOrPhone: email,
        passwordHash: "[PROTECTED_BY_FIREBASE]",
        displayName,
        storeName: storeName.trim() || "My Store",
        role: email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() ? "admin" : "merchant",
        isVerified: true,
        verificationStatus: "approved",
        accountStatus: "active",
        isPro: false,
        avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=140&auto=format&fit=crop&q=80",
        createdAt: new Date().toISOString(),
      };

      setIsLoading(false);
      sounds.playSuccess();
      onSuccessLogin(account);
      onClose();

      if (onShowToast) {
        onShowToast(`🎉 Account created! Welcome to INCO Smart Shop, ${displayName}!`, "success");
      }
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : "Registration failed";
      if (msg.includes("email-already-in-use")) {
        setErrorMsg("This email is already registered. Please sign in instead.");
      } else if (msg.includes("weak-password")) {
        setErrorMsg("Password is too weak. Please use at least 6 characters.");
      } else {
        setErrorMsg(msg);
      }
    }
  };

  // Submit Login via Firebase Authentication
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    setErrorMsg(null);

    const email = getNormalizedEmail(identifier);
    if (!email) {
      setErrorMsg("Please enter your registered email address.");
      return;
    }
    if (!password.trim()) {
      setErrorMsg("Please enter your password.");
      return;
    }

    setIsLoading(true);

    try {
      await signIn(email, password.trim());

      const isDefaultAdmin = email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
      const account: RegisteredAccount = {
        id: email,
        emailOrPhone: email,
        passwordHash: "[PROTECTED_BY_FIREBASE]",
        displayName: isDefaultAdmin ? "INCO Master Admin (Setta SL)" : email.split("@")[0],
        storeName: isDefaultAdmin ? "INCO Headquarters" : "Store Counter",
        role: isDefaultAdmin ? "admin" : "merchant",
        isVerified: true,
        verificationStatus: "approved",
        accountStatus: "active",
        isPro: isDefaultAdmin,
        avatarUrl: isDefaultAdmin
          ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=140&auto=format&fit=crop&q=80"
          : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=140&auto=format&fit=crop&q=80",
        createdAt: new Date().toISOString(),
      };

      setIsLoading(false);
      sounds.playSuccess();
      onSuccessLogin(account);
      onClose();

      if (onShowToast) {
        onShowToast(`👋 Welcome back, ${account.displayName}!`, "success");
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      const errCode = error?.code || "";
      const errMsg = error?.message || "";

      // Check if user is logging in for the first time on Firebase Auth
      if (
        errCode === "auth/user-not-found" ||
        errCode === "auth/invalid-credential" ||
        errMsg.includes("invalid-credential") ||
        errMsg.includes("user-not-found")
      ) {
        try {
          // Attempt auto-provisioning for this first-time login
          const isSuperAdmin = email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
          const displayName = isSuperAdmin ? "INCO Master Admin (Setta SL)" : email.split("@")[0];
          await signUp(email, password.trim(), displayName);

          const account: RegisteredAccount = {
            id: email,
            emailOrPhone: email,
            passwordHash: "[PROTECTED_BY_FIREBASE]",
            displayName,
            storeName: isSuperAdmin ? "INCO Headquarters" : "My Store",
            role: isSuperAdmin ? "admin" : "merchant",
            isVerified: true,
            verificationStatus: "approved",
            accountStatus: "active",
            isPro: isSuperAdmin,
            avatarUrl: isSuperAdmin
              ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=140&auto=format&fit=crop&q=80"
              : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=140&auto=format&fit=crop&q=80",
            createdAt: new Date().toISOString(),
          };

          setIsLoading(false);
          sounds.playSuccess();
          onSuccessLogin(account);
          onClose();

          if (onShowToast) {
            onShowToast(`🎉 Account activated! Welcome to INCO Smart Shop, ${account.displayName}!`, "success");
          }
          return;
        } catch (signUpErr: unknown) {
          const sErr = signUpErr as { code?: string; message?: string };
          if (sErr?.code === "auth/email-already-in-use" || sErr?.message?.includes("email-already-in-use")) {
            setIsLoading(false);
            setErrorMsg("Incorrect password for this account. If this is a Google account, please use 'Sign in with Google' or reset your password.");
            return;
          }
          if (sErr?.code === "auth/weak-password" || sErr?.message?.includes("weak-password")) {
            setIsLoading(false);
            setErrorMsg("Password must be at least 6 characters.");
            return;
          }
        }
      }

      setIsLoading(false);
      if (errCode === "auth/too-many-requests" || errMsg.includes("too-many-requests")) {
        setErrorMsg("Access temporarily blocked due to repeated failed attempts. Please reset password.");
      } else {
        setErrorMsg("Incorrect email or password. Please verify credentials or use Google Sign-In.");
      }
    }
  };

  // Google Authentication
  const handleGoogleAuth = async () => {
    sounds.playClick();
    setErrorMsg(null);
    setIsLoading(true);

    const candidateEmail = identifier.trim() && identifier.includes("@") ? identifier.trim() : "";

    try {
      await signInWithGoogleAuth(candidateEmail);
      setIsLoading(false);
      sounds.playSuccess();

      onClose();
      if (onShowToast) {
        onShowToast("Google authentication verified!", "success");
      }
    } catch (err: unknown) {
      setIsLoading(false);
      const error = err as { code?: string; message?: string };
      const errMsg = error?.message || "";

      if (errMsg.includes("cancelled") || errMsg.includes("closed")) {
        return;
      }

      setErrorMsg(errMsg || "Google sign in was cancelled or failed. Please try again.");
    }
  };

  // Google Direct Email Authentication
  const handleGoogleDirectSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    sounds.playClick();
    setErrorMsg(null);

    const email = googleDirectEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setErrorMsg("Please enter a valid Google email address.");
      return;
    }

    setIsLoading(true);
    try {
      await signInWithGoogleAuth(email);
      setIsLoading(false);
      sounds.playSuccess();
      onClose();
      if (onShowToast) {
        onShowToast(`Google account verified (${email})!`, "success");
      }
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : "Failed to authenticate Google email.";
      setErrorMsg(msg);
    }
  };

  // Submit Real Password Reset via Firebase
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    setErrorMsg(null);

    const email = getNormalizedEmail(identifier);
    if (!email || !email.includes("@")) {
      setErrorMsg("Please enter the email associated with your store account.");
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(email);
      setIsLoading(false);
      setResetEmailSent(email);
      setAuthStep("reset_sent");
      sounds.playSuccess();
      if (onShowToast) {
        onShowToast(`Password reset instructions sent to ${email}`, "info");
      }
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : "Failed to send reset email.";
      setErrorMsg(msg);
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
        {(!strictMode || currentUserAccount || user) && (
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

        {/* Modal Top Header with Brand Logo */}
        <div className="flex items-center gap-2.5 mb-4">
          <BrandLogo size="xs" theme="yellowAppIcon" animated={false} />
          <div>
            <h2 className="text-sm font-black tracking-tight text-slate-900 dark:text-white leading-none">
              INCO <span className="text-amber-500 dark:text-amber-400">Smart Shop</span>
            </h2>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              {authStep === "forgot_password"
                ? "Password Recovery"
                : authStep === "reset_sent"
                ? "Check Your Email"
                : authStep === "google_direct"
                ? "Google Account Access"
                : activeTab === "signup"
                ? "Create Store Account"
                : "Merchant Sign In"}
            </span>
          </div>
        </div>

        <div>
          {authStep === "forgot_password" ? (
            /* ========================================================================= */
            /* FORGOT PASSWORD STEP: Request Real Password Reset Link */
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
                Enter your registered email address. Firebase Authentication will send you a secure recovery link.
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
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. storeowner@inco.app"
                      required
                      className="w-full pl-8.5 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-amber-400 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-3"
                >
                  <span>{isLoading ? "Sending Link..." : "Send Password Reset Link"}</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </form>
            </div>
          ) : authStep === "reset_sent" ? (
            /* ========================================================================= */
            /* RESET EMAIL SENT CONFIRMATION */
            /* ========================================================================= */
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/80 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-600 dark:text-emerald-400">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Password Reset Link Sent
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                We sent a secure password reset link to{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">{resetEmailSent}</span>.
                Check your inbox and spam folder.
              </p>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setAuthStep("form");
                  setActiveTab("login");
                }}
                className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          ) : authStep === "google_direct" ? (
            /* ========================================================================= */
            /* GOOGLE DIRECT AUTHENTICATION */
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
                <div className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-amber-500" />
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Google Sign In
                  </h3>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                Preview mode restricts popup dialogs. Confirm your Google email to authenticate directly with Firebase:
              </p>

              {errorMsg && (
                <div className="mb-2.5 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleGoogleDirectSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Google Account Email
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={googleDirectEmail}
                      onChange={(e) => setGoogleDirectEmail(e.target.value)}
                      placeholder="e.g. yourname@gmail.com"
                      required
                      className="w-full pl-8.5 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-amber-400 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-2"
                >
                  <Globe className="w-3.5 h-3.5 text-slate-950" />
                  <span>{isLoading ? "Verifying Google Account..." : "Continue with Google"}</span>
                </button>
              </form>
            </div>
          ) : (
            /* ========================================================================= */
            /* LOGIN / SIGNUP FORM */
            /* ========================================================================= */
            <div>
              {/* Tab Switcher */}
              <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl mb-4">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setActiveTab("login");
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === "login"
                      ? "bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setActiveTab("signup");
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === "signup"
                      ? "bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                  }`}
                >
                  New Store Account
                </button>
              </div>

              {errorMsg && (
                <div className="mb-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                    <span className="flex-1 leading-relaxed">{errorMsg}</span>
                  </div>
                  {isGoogleEmail(identifier) && (
                    <div className="mt-2.5 pt-2 border-t border-rose-200 dark:border-rose-800/80 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleGoogleAuth}
                        disabled={isLoading}
                        className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 font-bold text-[11px] flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                        </svg>
                        <span>Sign in with Google</span>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          sounds.playClick();
                          try {
                            await resetPassword(identifier.trim());
                            setErrorMsg(null);
                            setResetEmailSent(identifier.trim());
                            setAuthStep("reset_sent");
                          } catch (err: unknown) {
                            const msg = err instanceof Error ? err.message : "Failed to send reset email";
                            setErrorMsg(msg);
                          }
                        }}
                        disabled={isLoading}
                        className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-800/80 font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Key className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span>Send Password Reset</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Form */}
              <form
                onSubmit={activeTab === "signup" ? handleSignUpSubmit : handleLoginSubmit}
                className="space-y-3"
              >
                {activeTab === "signup" && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Store Name
                    </label>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="e.g. David Provisions Mart"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-amber-400 transition-all"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="store@inco.app"
                      required
                      className="w-full pl-8.5 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-amber-400 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Password
                    </label>
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
                      placeholder={activeTab === "signup" ? "At least 6 characters" : "Enter password"}
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
                        placeholder="Repeat password"
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
                      ? "Connecting..."
                      : activeTab === "signup"
                      ? "Create Store Account"
                      : "Login to Store"}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </form>

              {/* Google Login Provider */}
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                  className="w-full py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2.5 shadow-xs hover:shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span>Sign in with Google</span>
                </button>
              </div>

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
            <span>Firebase Secured</span>
          </div>
          <span className="text-slate-400 dark:text-slate-500">
            Setta SL Ltd
          </span>
        </div>
      </div>
    </div>
  );
};
