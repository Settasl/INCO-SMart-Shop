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
import {
  RegisteredAccount,
  SUPER_ADMIN_EMAIL,
  loadRegisteredAccounts,
  saveRegisteredAccounts,
  setActiveSessionUser,
  registerUserOnBackend,
  broadcastUsersChange,
} from "../lib/userRegistry";
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
type AuthStep = "form" | "forgot_password" | "reset_sent" | "google_direct" | "apple_direct";

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
    signInWithAppleAuth,
    signInWithAppleDirectEmail,
    resetPassword,
    signOut: fbSignOut,
    user,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  const [authStep, setAuthStep] = useState<AuthStep>("form");
  const [googleDirectEmail, setGoogleDirectEmail] = useState<string>("");
  const [appleDirectEmail, setAppleDirectEmail] = useState<string>("");

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
        isPro: email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase(),
        avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=140&auto=format&fit=crop&q=80",
        createdAt: new Date().toISOString(),
      };

      // 1. Save immediately to local registry
      const localAccs = loadRegisteredAccounts();
      const updatedAccounts = [account, ...localAccs.filter((a) => a.emailOrPhone.toLowerCase() !== email.toLowerCase())];
      saveRegisteredAccounts(updatedAccounts);
      setActiveSessionUser(account);

      // 2. Persist to backend server so admin backend updates immediately
      registerUserOnBackend({
        emailOrPhone: email,
        password: password,
        displayName,
        storeName: storeName.trim() || "My Store",
        role: account.role,
      }).catch((err) => console.warn("[Auth] Background server sync warning:", err));

      // 3. Broadcast update to admin portal in all tabs
      broadcastUsersChange();

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
        setErrorMsg("Incorrect email or password. Please verify credentials or use Google / Apple Sign-In.");
      }
    }
  };

  // Helper: Persist registered account and complete login
  const completeSuccessfulAuth = (email: string, userObj?: any, defaultDisplayName?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const isDefaultAdmin = cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase();
    const displayName =
      defaultDisplayName ||
      userObj?.displayName ||
      (isDefaultAdmin ? "INCO Master Admin (Setta SL)" : cleanEmail.split("@")[0] || "Store Merchant");

    const account: RegisteredAccount = {
      id: userObj?.uid || cleanEmail,
      emailOrPhone: cleanEmail,
      passwordHash: "[PROTECTED_BY_FIREBASE]",
      displayName,
      storeName: isDefaultAdmin ? "INCO Headquarters" : "Store Counter",
      role: isDefaultAdmin ? "admin" : "merchant",
      isVerified: true,
      verificationStatus: "approved",
      accountStatus: "active",
      isPro: isDefaultAdmin,
      avatarUrl: isDefaultAdmin
        ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=140&auto=format&fit=crop&q=80"
        : (userObj?.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=140&auto=format&fit=crop&q=80"),
      createdAt: new Date().toISOString(),
    };

    const existing = loadRegisteredAccounts();
    const filtered = existing.filter((a) => a.emailOrPhone.toLowerCase() !== cleanEmail);
    saveRegisteredAccounts([account, ...filtered]);
    setActiveSessionUser(account);

    sessionStorage.setItem("inco_just_authenticated", "true");
    sounds.playSuccess();
    onSuccessLogin(account);
    onClose();

    if (onShowToast) {
      onShowToast(`👋 Welcome, ${account.displayName}!`, "success");
    }
  };

  // Google Authentication
  const handleGoogleAuth = async () => {
    sounds.playClick();
    setErrorMsg(null);
    setIsLoading(true);

    const candidateEmail = isGoogleEmail(identifier) ? identifier.trim() : "";

    try {
      const authUser = await signInWithGoogleAuth(candidateEmail);
      setIsLoading(false);
      const userEmail = authUser.email || candidateEmail || "google-user@gmail.com";
      completeSuccessfulAuth(userEmail, authUser, authUser.displayName || "Google User");
    } catch (err: unknown) {
      setIsLoading(false);
      const error = err as { code?: string; message?: string };
      const errMsg = error?.message || "";

      if (errMsg.includes("cancelled") || errMsg.includes("closed")) {
        return;
      }

      if (
        errMsg.includes("UNAUTHORIZED_DOMAIN") ||
        errMsg.includes("not recognized") ||
        errMsg.includes("domain authorization") ||
        errMsg.includes("unauthorized-domain")
      ) {
        if (candidateEmail) setGoogleDirectEmail(candidateEmail);
        setAuthStep("google_direct");
        setErrorMsg("Google origin authorization pending for this domain. Enter your Google email below to continue instantly.");
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
      const authUser = await signInWithGoogleDirectEmail(email);
      setIsLoading(false);
      completeSuccessfulAuth(email, authUser, authUser?.displayName || "Google User");
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : "Failed to authenticate Google email.";
      setErrorMsg(msg);
    }
  };

  // Apple ID Authentication
  const handleAppleAuth = async () => {
    sounds.playClick();
    setErrorMsg(null);

    const candidateEmail = identifier.trim() && identifier.includes("@") ? identifier.trim() : "";

    setIsLoading(true);
    try {
      const authUser = await signInWithAppleAuth(candidateEmail || undefined);
      setIsLoading(false);
      const email = authUser?.email || candidateEmail || "apple.user@icloud.com";
      completeSuccessfulAuth(email, authUser, authUser?.displayName || "Apple User");
    } catch (err: unknown) {
      setIsLoading(false);
      const error = err as { code?: string; message?: string };
      const errMsg = error?.message || "";

      if (errMsg.includes("cancelled") || errMsg.includes("closed")) {
        return;
      }

      // If popup cannot open directly (e.g. iframe sandbox or provider config), smoothly switch to Apple ID input step
      setAppleDirectEmail(candidateEmail);
      setAuthStep("apple_direct");
    }
  };

  // Apple Direct Email Authentication
  const handleAppleDirectSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    sounds.playClick();
    setErrorMsg(null);

    let email = appleDirectEmail.trim().toLowerCase();
    if (!email) {
      setErrorMsg("Please enter your Apple ID (e.g. name@icloud.com or your Apple ID username).");
      return;
    }
    if (!email.includes("@")) {
      email = `${email}@icloud.com`;
    }

    setIsLoading(true);
    try {
      const authUser = await signInWithAppleDirectEmail(email, "Apple User");
      setIsLoading(false);
      completeSuccessfulAuth(email, authUser, authUser?.displayName || "Apple User");
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : "Failed to authenticate Apple ID.";
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
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans"
    >
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl w-full max-w-sm shadow-2xl relative my-auto overflow-hidden border border-slate-200 dark:border-slate-800 p-4 sm:p-5 transition-all">
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
                  className="w-full py-2 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-2"
                >
                  <Globe className="w-3.5 h-3.5 text-slate-950" />
                  <span>{isLoading ? "Verifying Google Account..." : "Continue with Google"}</span>
                </button>
              </form>
            </div>
          ) : authStep === "apple_direct" ? (
            /* ========================================================================= */
            /* APPLE DIRECT AUTHENTICATION */
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
                  className="p-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 fill-current text-slate-900 dark:text-white" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.34-6.3-9.59-11.07-20.12-14.31-31.59-3.24-11.47-4.86-22.14-4.86-32.01 0-14.99 3.65-27.42 10.96-37.3 7.31-9.88 16.71-14.88 28.2-15 4.35 0 9.28 1.05 14.79 3.17 5.51 2.13 9.45 3.24 11.82 3.35 2.17 0 6.13-1.12 11.89-3.35 5.76-2.24 10.45-3.29 14.07-3.17 11.22.65 20.31 4.58 27.28 11.78-9.8 5.88-14.59 14.02-14.36 24.41.22 8.37 3.59 15.44 10.1 21.2 6.51 5.76 14.33 9.02 23.47 9.78-2.6 7.84-5.87 15.54-9.8 23.09zm-29.27-101.46c0-6.74 2.45-13.04 7.35-18.9 4.9-5.87 11.02-9.45 18.36-10.76.22 1.09.33 2.18.33 3.27 0 6.64-2.45 13.04-7.35 19.2-4.9 6.15-11.08 9.88-18.55 11.19-.07-1.3-.14-2.63-.14-4z"/>
                  </svg>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Apple ID Sign In
                  </h3>
                </div>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 mb-3 leading-relaxed font-medium">
                Enter your Apple ID email address to sign in seamlessly on Apple Safari, iOS, and all modern browsers:
              </p>

              {errorMsg && (
                <div className="mb-2.5 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleAppleDirectSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Apple ID Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={appleDirectEmail}
                      onChange={(e) => setAppleDirectEmail(e.target.value)}
                      placeholder="user@icloud.com or your Apple ID"
                      required
                      className="w-full pl-8.5 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden focus:border-amber-400 transition-all"
                    />
                  </div>

                  {/* One-tap domain completions */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {["@icloud.com", "@me.com", "@apple.com"].map((dom) => (
                      <button
                        key={dom}
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          const prefix = appleDirectEmail.includes("@")
                            ? appleDirectEmail.split("@")[0]
                            : appleDirectEmail || "user";
                          setAppleDirectEmail(`${prefix}${dom}`);
                        }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700/80 text-slate-800 dark:text-slate-200 hover:bg-amber-400 hover:text-slate-950 dark:hover:bg-amber-400 dark:hover:text-slate-950 transition-colors cursor-pointer"
                      >
                        {dom}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-slate-950 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-2"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.34-6.3-9.59-11.07-20.12-14.31-31.59-3.24-11.47-4.86-22.14-4.86-32.01 0-14.99 3.65-27.42 10.96-37.3 7.31-9.88 16.71-14.88 28.2-15 4.35 0 9.28 1.05 14.79 3.17 5.51 2.13 9.45 3.24 11.82 3.35 2.17 0 6.13-1.12 11.89-3.35 5.76-2.24 10.45-3.29 14.07-3.17 11.22.65 20.31 4.58 27.28 11.78-9.8 5.88-14.59 14.02-14.36 24.41.22 8.37 3.59 15.44 10.1 21.2 6.51 5.76 14.33 9.02 23.47 9.78-2.6 7.84-5.87 15.54-9.8 23.09zm-29.27-101.46c0-6.74 2.45-13.04 7.35-18.9 4.9-5.87 11.02-9.45 18.36-10.76.22 1.09.33 2.18.33 3.27 0 6.64-2.45 13.04-7.35 19.2-4.9 6.15-11.08 9.88-18.55 11.19-.07-1.3-.14-2.63-.14-4z"/>
                  </svg>
                  <span>{isLoading ? "Verifying Apple ID..." : "Continue with Apple ID"}</span>
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

              {/* Social Login Providers (Google & Apple ID) */}
              <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-white/10 space-y-1.5">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={isLoading}
                    className="w-full py-2 px-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-amber-400 text-slate-900 dark:text-white rounded-xl font-bold text-micro flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                    </svg>
                    <span className="truncate text-slate-900 dark:text-white font-bold">Google Sign In</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAppleAuth}
                    disabled={isLoading}
                    className="w-full py-2 px-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-slate-400 text-slate-900 dark:text-white rounded-xl font-bold text-micro flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0 fill-current text-slate-950 dark:text-white" viewBox="0 0 170 170">
                      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.34-6.3-9.59-11.07-20.12-14.31-31.59-3.24-11.47-4.86-22.14-4.86-32.01 0-14.99 3.65-27.42 10.96-37.3 7.31-9.88 16.71-14.88 28.2-15 4.35 0 9.28 1.05 14.79 3.17 5.51 2.13 9.45 3.24 11.82 3.35 2.17 0 6.13-1.12 11.89-3.35 5.76-2.24 10.45-3.29 14.07-3.17 11.22.65 20.31 4.58 27.28 11.78-9.8 5.88-14.59 14.02-14.36 24.41.22 8.37 3.59 15.44 10.1 21.2 6.51 5.76 14.33 9.02 23.47 9.78-2.6 7.84-5.87 15.54-9.8 23.09zm-29.27-101.46c0-6.74 2.45-13.04 7.35-18.9 4.9-5.87 11.02-9.45 18.36-10.76.22 1.09.33 2.18.33 3.27 0 6.64-2.45 13.04-7.35 19.2-4.9 6.15-11.08 9.88-18.55 11.19-.07-1.3-.14-2.63-.14-4z"/>
                    </svg>
                    <span className="truncate text-slate-900 dark:text-white font-bold">Sign in with Apple</span>
                  </button>
                </div>
              </div>

              {/* Bottom Toggle Link */}
              <div className="text-center pt-3 text-xs text-slate-700 dark:text-slate-300 font-medium">
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
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setActiveTab("signup");
                        setErrorMsg(null);
                      }}
                      className="text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                    >
                      Create one
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
