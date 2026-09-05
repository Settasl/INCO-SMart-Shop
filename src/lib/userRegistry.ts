import { UserProfile, PaymentRequest, VerificationRequest } from "../types";

export interface RegisteredAccount {
  id: string;
  emailOrPhone: string;
  passwordHash: string; // In-app stored password
  displayName: string;
  storeName: string;
  role: "admin" | "merchant" | "manager" | "cashier";
  isVerified: boolean;
  verificationStatus: "none" | "pending" | "approved" | "rejected";
  accountStatus: "active" | "pending_approval" | "suspended" | "blocked";
  isPro: boolean;
  proMonths?: number;
  proExpiresAt?: string;
  avatarUrl: string;
  createdAt: string;
}

export const SUPER_ADMIN_EMAIL = "settaholdings@gmail.com";
export const DEFAULT_ADMIN_PASS = "INCOAdmin@2026!";

export const DEFAULT_ACCOUNTS: RegisteredAccount[] = [
  {
    id: "user-super-admin-01",
    emailOrPhone: SUPER_ADMIN_EMAIL,
    passwordHash: DEFAULT_ADMIN_PASS,
    displayName: "INCO Master Admin (Setta SL)",
    storeName: "INCO Headquarters",
    role: "admin",
    isVerified: true,
    verificationStatus: "approved",
    accountStatus: "active",
    isPro: true,
    proExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3650).toISOString(), // 10 years
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=140&auto=format&fit=crop&q=80",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "user-demo-merchant-02",
    emailOrPhone: "merchant@kiosk.com",
    passwordHash: "password123",
    displayName: "David Kiosk",
    storeName: "David Provisions & Mini Mart",
    role: "merchant",
    isVerified: false,
    verificationStatus: "none",
    accountStatus: "active",
    isPro: false,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=140&auto=format&fit=crop&q=80",
    createdAt: "2026-02-15T00:00:00.000Z",
  },
];

const STORAGE_USERS_KEY = "inco_registered_users_v3";
const STORAGE_CURRENT_USER_KEY = "inco_active_session_user_v3";

// Safari-safe in-memory fallback store if localStorage is blocked (e.g. Private Browsing)
const memoryStorage: Record<string, string> = {};

function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const val = localStorage.getItem(key);
      if (val !== null) return val;
    }
  } catch (e) {
    // Safari SecurityError or QuotaExceededError fallback
  }
  return memoryStorage[key] || null;
}

function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(key, value);
    }
  } catch (e) {}
  memoryStorage[key] = value;
}

function safeRemoveItem(key: string): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem(key);
    }
  } catch (e) {}
  delete memoryStorage[key];
}

// Cross-tab broadcast channel for immediate multi-window synchronization
let syncChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    syncChannel = new BroadcastChannel("inco_sync_channel_v1");
  }
} catch (e) {}

export function broadcastUsersChange(): void {
  try {
    if (syncChannel) {
      syncChannel.postMessage({ type: "USERS_UPDATED", timestamp: Date.now() });
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("inco:users-updated", { detail: { timestamp: Date.now() } }));
    }
  } catch (e) {}
}

export function loadRegisteredAccounts(): RegisteredAccount[] {
  try {
    const raw = safeGetItem(STORAGE_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure super admin is always present
        const hasAdmin = parsed.some(
          (u) => u.emailOrPhone?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
        );
        if (!hasAdmin) {
          parsed.unshift(DEFAULT_ACCOUNTS[0]);
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed loading registered accounts", e);
  }
  return DEFAULT_ACCOUNTS;
}

export function saveRegisteredAccounts(accounts: RegisteredAccount[]): void {
  try {
    safeSetItem(STORAGE_USERS_KEY, JSON.stringify(accounts));
    broadcastUsersChange();
  } catch (e) {}
}

export function getActiveSessionUser(): RegisteredAccount | null {
  try {
    const activeId = safeGetItem(STORAGE_CURRENT_USER_KEY);
    if (!activeId) {
      // Default to guest/demo or super admin if previously stored
      const oldId = safeGetItem("inco_user_id");
      if (oldId) {
        const accounts = loadRegisteredAccounts();
        const found = accounts.find(
          (a) => a.emailOrPhone.toLowerCase() === oldId.toLowerCase()
        );
        if (found) return found;
      }
      return null;
    }
    const accounts = loadRegisteredAccounts();
    return accounts.find((a) => a.id === activeId || a.emailOrPhone.toLowerCase() === activeId.toLowerCase()) || null;
  } catch (e) {
    return null;
  }
}

export function setActiveSessionUser(user: RegisteredAccount | null): void {
  try {
    if (user) {
      safeSetItem(STORAGE_CURRENT_USER_KEY, user.id);
      safeSetItem("inco_user_id", user.emailOrPhone);
    } else {
      safeRemoveItem(STORAGE_CURRENT_USER_KEY);
      safeRemoveItem("inco_user_id");
    }
  } catch (e) {}
}

export interface OtpSession {
  target: string; // email or phone
  code: string;
  purpose: "signup" | "login" | "reset_password";
  expiresAt: number;
  createdAt: number;
}

const STORAGE_OTP_KEY = "inco_otp_session_v1";

export function generateAndStoreOtp(
  target: string,
  purpose: "signup" | "login" | "reset_password"
): { code: string; expiresAt: number } {
  const cleanTarget = target.trim().toLowerCase();
  // Generate secure 6-digit OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

  const otpData: OtpSession = {
    target: cleanTarget,
    code,
    purpose,
    expiresAt,
    createdAt: Date.now(),
  };

  try {
    localStorage.setItem(STORAGE_OTP_KEY, JSON.stringify(otpData));
  } catch (e) {}

  return { code, expiresAt };
}

export function getActiveOtpSession(): OtpSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_OTP_KEY);
    if (raw) {
      const parsed: OtpSession = JSON.parse(raw);
      if (parsed.expiresAt > Date.now()) {
        return parsed;
      }
    }
  } catch (e) {}
  return null;
}

export function verifyOtpCode(
  target: string,
  enteredCode: string,
  purpose: "signup" | "login" | "reset_password"
): { success: boolean; error?: string } {
  const cleanTarget = target.trim().toLowerCase();
  const cleanCode = enteredCode.trim();

  try {
    const raw = localStorage.getItem(STORAGE_OTP_KEY);
    if (!raw) {
      return { success: false, error: "No active OTP found. Please request a new code." };
    }

    const session: OtpSession = JSON.parse(raw);
    if (session.target !== cleanTarget) {
      return { success: false, error: "OTP target mismatch. Please request a new code." };
    }
    if (session.purpose !== purpose) {
      return { success: false, error: "Invalid OTP session purpose." };
    }
    if (Date.now() > session.expiresAt) {
      return { success: false, error: "OTP code has expired. Please click Resend Code." };
    }
    if (session.code !== cleanCode) {
      return { success: false, error: "Incorrect 6-digit OTP code. Please check and try again." };
    }

    // OTP verified successfully, clear used OTP
    localStorage.removeItem(STORAGE_OTP_KEY);
    return { success: true };
  } catch (e) {
    return { success: false, error: "Verification failed. Please try again." };
  }
}

export interface ResetTokenSession {
  target: string;
  token: string;
  expiresAt: number;
  createdAt: number;
}

const STORAGE_RESET_TOKEN_KEY = "inco_reset_token_session_v1";

export function generateResetToken(target: string): { token: string; expiresAt: number } {
  const cleanTarget = target.trim().toLowerCase();
  // Generate formatted mock reset token e.g. RST-482915
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  const token = `RST-${randomNum}`;
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity

  const session: ResetTokenSession = {
    target: cleanTarget,
    token,
    expiresAt,
    createdAt: Date.now(),
  };

  try {
    localStorage.setItem(STORAGE_RESET_TOKEN_KEY, JSON.stringify(session));
  } catch (e) {}

  return { token, expiresAt };
}

export function getActiveResetTokenSession(): ResetTokenSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_RESET_TOKEN_KEY);
    if (raw) {
      const parsed: ResetTokenSession = JSON.parse(raw);
      if (parsed.expiresAt > Date.now()) {
        return parsed;
      }
    }
  } catch (e) {}
  return null;
}

export function verifyResetToken(target: string, enteredToken: string): { success: boolean; error?: string } {
  const cleanTarget = target.trim().toLowerCase();
  const cleanToken = enteredToken.trim().toUpperCase();

  try {
    const raw = localStorage.getItem(STORAGE_RESET_TOKEN_KEY);
    if (!raw) {
      return { success: false, error: "No active reset token found. Please request a new reset token." };
    }

    const session: ResetTokenSession = JSON.parse(raw);
    if (session.target !== cleanTarget) {
      return { success: false, error: "Reset token was requested for a different email or phone number." };
    }
    if (Date.now() > session.expiresAt) {
      return { success: false, error: "Reset token has expired (15-minute limit). Please generate a new one." };
    }
    if (session.token.toUpperCase() !== cleanToken && session.token.replace("RST-", "") !== cleanToken) {
      return { success: false, error: "Invalid reset token. Please check and try again." };
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: "Token verification failed. Please try again." };
  }
}

export function clearResetToken(): void {
  try {
    localStorage.removeItem(STORAGE_RESET_TOKEN_KEY);
  } catch (e) {}
}

export function updateAccountPassword(emailOrPhone: string, newPassword: string): boolean {
  const cleanId = emailOrPhone.trim().toLowerCase();
  const accounts = loadRegisteredAccounts();
  const index = accounts.findIndex((a) => a.emailOrPhone.toLowerCase() === cleanId);

  if (index === -1 && cleanId !== SUPER_ADMIN_EMAIL) {
    return false;
  }

  if (cleanId === SUPER_ADMIN_EMAIL) {
    localStorage.setItem("inco_admin_master_password", newPassword);
  }

  if (index !== -1) {
    accounts[index] = {
      ...accounts[index],
      passwordHash: newPassword,
    };
  } else if (cleanId === SUPER_ADMIN_EMAIL) {
    const adminAcc: RegisteredAccount = {
      ...DEFAULT_ACCOUNTS[0],
      passwordHash: newPassword,
    };
    accounts.unshift(adminAcc);
  }

  saveRegisteredAccounts(accounts);

  // If this is currently active session user, update it
  const activeUser = getActiveSessionUser();
  if (activeUser && activeUser.emailOrPhone.toLowerCase() === cleanId) {
    activeUser.passwordHash = newPassword;
    setActiveSessionUser(activeUser);
  }

  return true;
}

export function getAdminMasterPassword(): string {
  try {
    const saved = localStorage.getItem("inco_admin_master_password");
    if (saved && saved.trim()) {
      return saved.trim();
    }
    const accounts = loadRegisteredAccounts();
    const admin = accounts.find((a) => a.emailOrPhone.toLowerCase() === SUPER_ADMIN_EMAIL);
    if (admin?.passwordHash) {
      return admin.passwordHash;
    }
  } catch (e) {}
  return DEFAULT_ADMIN_PASS;
}

export function verifyAdminMasterPassword(enteredPass: string): boolean {
  if (!enteredPass) return false;
  const currentPass = getAdminMasterPassword();
  return enteredPass.trim() === currentPass;
}

export function setAdminMasterPassword(newPass: string): boolean {
  if (!newPass || newPass.length < 6) return false;
  return updateAccountPassword(SUPER_ADMIN_EMAIL, newPass);
}

export function convertAccountToUserProfile(acc: RegisteredAccount): UserProfile {
  const isProActive =
    acc.emailOrPhone.toLowerCase() === SUPER_ADMIN_EMAIL ||
    (acc.isPro && acc.proExpiresAt && new Date(acc.proExpiresAt).getTime() > Date.now());

  return {
    id: acc.id,
    identifier: acc.emailOrPhone,
    displayName: acc.displayName,
    avatarUrl: acc.avatarUrl,
    role: acc.emailOrPhone.toLowerCase() === SUPER_ADMIN_EMAIL ? "admin" : (acc.role as any),
    isVerified: acc.isVerified,
    verificationStatus: acc.verificationStatus,
    accountStatus: acc.accountStatus,
    storeName: acc.storeName,
    subscription: {
      plan: isProActive ? "INCO Pro AI" : "Free Starter",
      status: isProActive ? "active" : "free",
      validUntil: acc.proExpiresAt,
    },
    createdAt: acc.createdAt,
  };
}

// --- FRONTEND <-> BACKEND REALTIME CLOUD SYNCHRONIZATION ---

let isSyncing = false;

/**
 * Synchronize local user registry with the backend server.
 * Offline-first: if offline, returns local accounts seamlessly.
 * When online: sends local accounts to server, merges server accounts into local storage, and returns unified list.
 */
export async function syncUsersWithServer(): Promise<RegisteredAccount[]> {
  const localAccounts = loadRegisteredAccounts();

  // If browser is offline, return local cache immediately
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return localAccounts;
  }

  if (isSyncing) {
    return localAccounts;
  }

  isSyncing = true;
  try {
    const res = await fetch("/api/users/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientUsers: localAccounts }),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.users) && data.users.length > 0) {
        // Ensure super admin is preserved
        const hasAdmin = data.users.some(
          (u: RegisteredAccount) => u.emailOrPhone?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
        );
        if (!hasAdmin) {
          data.users.unshift(DEFAULT_ACCOUNTS[0]);
        }

        saveRegisteredAccounts(data.users);
        return data.users;
      }
    }
  } catch (err) {
    // Network error or server offline: fall back to local store
    console.warn("[SyncEngine] Offline or server unreachable. Operating from local cache.", err);
  } finally {
    isSyncing = false;
  }

  return localAccounts;
}

/**
 * Register user directly on backend server and update local storage.
 */
export async function registerUserOnBackend(userData: {
  emailOrPhone: string;
  password: string;
  displayName?: string;
  storeName?: string;
  role?: "admin" | "merchant" | "manager" | "cashier";
}): Promise<{ success: boolean; user?: RegisteredAccount; error?: string }> {
  const cleanId = userData.emailOrPhone.trim().toLowerCase();

  // 1. Check local cache first
  const localAccounts = loadRegisteredAccounts();
  const existingLocal = localAccounts.find(
    (u) => u.emailOrPhone.toLowerCase() === cleanId
  );
  if (existingLocal) {
    return { success: false, error: "An account with this email/phone already exists. Please sign in." };
  }

  // 2. Attempt registration on backend server
  try {
    const res = await fetch("/api/users/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        const updated = [data.user, ...localAccounts.filter((a) => a.id !== data.user.id)];
        saveRegisteredAccounts(updated);
        setActiveSessionUser(data.user);
        return { success: true, user: data.user };
      }
    } else {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error || "Failed to register account." };
    }
  } catch (netErr) {
    console.warn("[SyncEngine] Backend unreachable during signup, creating local offline account.", netErr);
  }

  // 3. Offline fallback: create valid local account and queue for background sync
  const isDefaultAdmin = cleanId === SUPER_ADMIN_EMAIL.toLowerCase();
  const offlineUser: RegisteredAccount = {
    id: `user-offline-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    emailOrPhone: cleanId,
    passwordHash: userData.password.trim(),
    displayName:
      userData.displayName?.trim() ||
      (cleanId.includes("@")
        ? cleanId.split("@")[0].charAt(0).toUpperCase() + cleanId.split("@")[0].slice(1)
        : `Merchant ${cleanId.slice(-4)}`),
    storeName: userData.storeName?.trim() || "My Store",
    role: isDefaultAdmin ? "admin" : (userData.role || "merchant"),
    isVerified: isDefaultAdmin,
    verificationStatus: isDefaultAdmin ? "approved" : "none",
    accountStatus: "active",
    isPro: isDefaultAdmin,
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=140&auto=format&fit=crop&q=80",
    createdAt: new Date().toISOString(),
  };

  const updatedAccounts = [offlineUser, ...localAccounts];
  saveRegisteredAccounts(updatedAccounts);
  setActiveSessionUser(offlineUser);

  // Attempt async sync in background
  syncUsersWithServer().catch(() => {});

  return { success: true, user: offlineUser };
}

/**
 * Update user account on backend and sync locally.
 */
export async function updateUserOnBackend(
  userId: string,
  updates: Partial<RegisteredAccount>
): Promise<boolean> {
  // Update local immediately for zero-lag UI
  const accounts = loadRegisteredAccounts().map((a) => {
    if (a.id === userId || a.emailOrPhone.toLowerCase() === userId.toLowerCase()) {
      return { ...a, ...updates };
    }
    return a;
  });
  saveRegisteredAccounts(accounts);

  // Sync with backend if online
  try {
    const res = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.users)) {
        saveRegisteredAccounts(data.users);
      }
      return true;
    }
  } catch (err) {
    console.warn("[SyncEngine] Backend unreachable during user update, saved locally.", err);
  }

  return true;
}

/**
 * Delete user account on backend and sync locally.
 */
export async function deleteUserOnBackend(userId: string): Promise<boolean> {
  const accounts = loadRegisteredAccounts().filter(
    (a) => a.id !== userId && a.emailOrPhone.toLowerCase() !== userId.toLowerCase()
  );
  saveRegisteredAccounts(accounts);

  try {
    await fetch(`/api/users/${encodeURIComponent(userId)}`, {
      method: "DELETE",
    });
  } catch (err) {}

  return true;
}

/**
 * Dispatch real-time telemetry event to backend for live Super Admin dashboard feed.
 */
export function logTelemetryEvent(
  type: "sale" | "restock" | "signup" | "login" | "kyc" | "pro_upgrade" | "admin_action",
  storeName: string,
  userIdentifier: string,
  description: string,
  amount?: number
): void {
  try {
    fetch("/api/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, storeName, userIdentifier, description, amount }),
    }).catch(() => {});
  } catch (e) {}
}
