import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import confetti from "canvas-confetti";
import { Header } from "./components/Header";
import { QuickTallyView } from "./components/QuickTallyView";
import { UrgentRestockWidget } from "./components/UrgentRestockWidget";
import { BarcodeScannerModal } from "./components/BarcodeScannerModal";
import { AuditModeModal } from "./components/AuditModeModal";
import { QuickSaleModal } from "./components/QuickSaleModal";
import { QuickRestockModal } from "./components/QuickRestockModal";
import { AIAssistantModal } from "./components/AIAssistantModal";
import { StockHistoryModal } from "./components/StockHistoryModal";
import { PrintableStockSheet } from "./components/PrintableStockSheet";
import { SettingsModal } from "./components/SettingsModal";
import { SplashScreen } from "./components/SplashScreen";
import { AuthModal } from "./components/AuthModal";
import { SalesReportModal } from "./components/SalesReportModal";
import { LowStockEmailModal } from "./components/LowStockEmailModal";
import { StockFinancialsBanner } from "./components/StockFinancialsBanner";
import { InlineQuickSaleBar } from "./components/InlineQuickSaleBar";
import { DashboardAnalyticsSection } from "./components/DashboardAnalyticsSection";
import { StockValuationModal } from "./components/StockValuationModal";
import { WhatsAppOrderModal } from "./components/WhatsAppOrderModal";
import { InstallAppBanner } from "./components/InstallAppBanner";
import { InstallShortcutModal } from "./components/InstallShortcutModal";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { ChatModal } from "./components/ChatModal";
import { ProfileModal } from "./components/ProfileModal";
import { AdminPortalModal } from "./components/AdminPortalModal";
import { SubscriptionModal } from "./components/SubscriptionModal";
import { ToolsPageView } from "./components/ToolsPageView";
import { SalesSuccessOverlay, SaleSuccessInfo } from "./components/SalesSuccessOverlay";
import { SalePaymentDetails } from "./components/QuickSaleModal";
import { GlobalMenuDrawer } from "./components/GlobalMenuDrawer";
import { DashboardView } from "./components/DashboardView";
import { POSView } from "./components/POSView";
import { ProductsView } from "./components/ProductsView";
import { ReportsView } from "./components/ReportsView";
import { ProfileView } from "./components/ProfileView";
import { SalesView } from "./components/SalesView";
import {
  InventoryItem,
  StockMovement,
  StoreSettings,
  ParsedAIAction,
  DetectedAIPhotoItem,
  CreditRecord,
  PaymentStatus,
  UserProfile,
  PaymentRequest,
  VerificationRequest,
  ChatMessage,
  Category,
  Unit,
} from "./types";
import { INITIAL_INVENTORY, INITIAL_CREDIT_RECORDS } from "./data/sampleData";
import {
  RegisteredAccount,
  SUPER_ADMIN_EMAIL,
  loadRegisteredAccounts,
  saveRegisteredAccounts,
  getActiveSessionUser,
  setActiveSessionUser,
  convertAccountToUserProfile,
  syncUsersWithServer,
  updateUserOnBackend,
  deleteUserOnBackend,
} from "./lib/userRegistry";
import {
  syncItemsToFirestore,
  saveSaleToFirestore,
  saveItemToBusinessFirestore,
  deleteItemFromBusinessFirestore,
  subscribeToTenantItems,
  syncItemsToBusinessFirestore,
  executeSaleTransactionAtomic,
  fetchAllUsersFromFirestore,
  subscribeToAllUsersFromFirestore,
  updateUserInFirestore,
  deleteUserFromFirestore,
} from "./lib/firebase";
import { useAuth } from "./context/AuthContext";
import { useBusiness } from "./context/BusinessContext";
import { recordAuditLog } from "./lib/auditService";
import { safeStorage } from "./lib/safeStorage";

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "INCO Smart Shop",
  currencySymbol: "L$",
  currencyCode: "LRD",
  enableSound: true,
  lowStockAlerts: true,
  autoEmailAlerts: true,
  darkMode: true,
};

const INITIAL_CHAT_MESSAGES: ChatMessage[] = [];

const INITIAL_PAYMENT_REQUESTS: PaymentRequest[] = [];

const INITIAL_VERIFICATION_REQUESTS: VerificationRequest[] = [];

export function App() {
  const { user: fbUser, signOut: fbSignOut } = useAuth();
  const { activeBusinessId, activeBusiness, userRole, canEdit, canAdmin } = useBusiness();

  // Navigation & Page State ("dashboard" | "pos" | "products" | "reports" | "profile" | "sales" | "stock" | "valuation" | "suppliers" | "tools")
  const [activeView, setActiveView] = useState<string>("dashboard");
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    return !safeStorage.getItem("inco_splash_dismissed");
  });

  // User Accounts & Authentication
  const [registeredAccounts, setRegisteredAccounts] = useState<RegisteredAccount[]>(
    loadRegisteredAccounts
  );
  const [currentAccount, setCurrentAccount] = useState<RegisteredAccount | null>(
    getActiveSessionUser
  );
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(() => {
    return !getActiveSessionUser();
  });
  const [authInitialTab, setAuthInitialTab] = useState<"login" | "signup">("login");
  const [saleSuccessInfo, setSaleSuccessInfo] = useState<SaleSuccessInfo | null>(null);

  // Sync Firebase Auth user with active session state
  useEffect(() => {
    if (fbUser) {
      const email = fbUser.email || (fbUser.isAnonymous ? "guest@store.local" : "merchant@store.local");
      const isSuperAdmin = email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
      const account: RegisteredAccount = {
        id: fbUser.uid,
        emailOrPhone: email,
        passwordHash: "[PROTECTED_BY_FIREBASE]",
        displayName: fbUser.displayName || email.split("@")[0] || "Store Merchant",
        storeName: activeBusiness?.businessName || activeBusiness?.name || "My Store",
        role: isSuperAdmin ? "admin" : (userRole as any) || "merchant",
        isVerified: true,
        verificationStatus: "approved",
        accountStatus: "active",
        isPro: isSuperAdmin,
        avatarUrl:
          fbUser.photoURL ||
          (isSuperAdmin
            ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=140&auto=format&fit=crop&q=80"
            : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=140&auto=format&fit=crop&q=80"),
        createdAt: new Date().toISOString(),
      };
      setCurrentAccount(account);
      setActiveSessionUser(account);
      setIsAuthOpen(false);
    }
  }, [fbUser, activeBusiness, userRole]);

  // Convert active account to userProfile
  const userProfile: UserProfile = useMemo(() => {
    if (currentAccount) {
      return convertAccountToUserProfile(currentAccount);
    }
    return {
      id: "guest-usr",
      identifier: "",
      displayName: "Store Owner",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
      role: "user",
      isVerified: false,
      verificationStatus: "none",
      subscription: {
        plan: "Free Starter",
        status: "free",
      },
      createdAt: new Date().toISOString(),
    };
  }, [currentAccount]);

  const userPhoneOrEmail = currentAccount?.emailOrPhone || null;

  // Inventory & Store State - Strictly clean tenant isolation (no fake demo figures)
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [credits, setCredits] = useState<CreditRecord[]>([]);
  const [cashAtHand, setCashAtHand] = useState<number>(0.0);

  const [settings, setSettings] = useState<StoreSettings>(() => {
    return safeStorage.getJSON<StoreSettings>("inco_store_settings", DEFAULT_SETTINGS);
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return safeStorage.getJSON<boolean>("inco_dark_mode", false);
  });

  // One-time startup purge of legacy demo accounts, demo items, and demo movements from browser cache
  useEffect(() => {
    try {
      const demoBlocked = ["merchant@kiosk.com", "david@kiosk.com", "merchant@inco.app", "demo@inco.app", "john@example.com"];
      const rawUsers = safeStorage.getItem("inco_registered_users_v3");
      if (rawUsers) {
        const parsed = JSON.parse(rawUsers);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(
            (u) =>
              u.emailOrPhone?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() ||
              (!demoBlocked.includes((u.emailOrPhone || "").toLowerCase()) &&
                !(u.id || "").toLowerCase().startsWith("demo-") &&
                !(u.id || "").toLowerCase().startsWith("user-demo-") &&
                !(u.emailOrPhone || "").toLowerCase().includes("kiosk.com"))
          );
          if (cleaned.length !== parsed.length) {
            safeStorage.setJSON("inco_registered_users_v3", cleaned);
            setRegisteredAccounts(cleaned);
          }
        }
      }

      const rootItems = safeStorage.getJSON<any[]>("inco_inventory_items", []);
      if (Array.isArray(rootItems) && rootItems.some((i) => i && i.id && (i.id.startsWith("item-med-") || i.id.startsWith("pos-") || i.id.startsWith("item-shoe-")))) {
        safeStorage.setJSON("inco_inventory_items", []);
      }
      const rootMovements = safeStorage.getJSON<any[]>("inco_stock_movements", []);
      if (Array.isArray(rootMovements) && rootMovements.some((m) => m && m.id && (m.id.startsWith("mov-demo-") || m.id.startsWith("demo-")))) {
        safeStorage.setJSON("inco_stock_movements", []);
      }
    } catch (e) {}
  }, []);

  // Load tenant-scoped inventory, movements and cash when currentAccount changes
  useEffect(() => {
    if (!currentAccount) {
      setItems([]);
      setMovements([]);
      setCredits([]);
      setCashAtHand(0);
      return;
    }

    const tKey = currentAccount.id ? currentAccount.id.replace(/[^a-zA-Z0-9_-]/g, "_") : "guest";
    // Check if user already has saved inventory
    const savedItems = safeStorage.getJSON<InventoryItem[] | null>(`inco_items_${tKey}`, null);
    if (savedItems !== null && Array.isArray(savedItems)) {
      const cleaned = savedItems.filter(
        (i) => i && i.id && !i.id.startsWith("pos-") && !i.id.startsWith("item-med-") && !i.id.startsWith("item-shoe-") && !i.id.startsWith("item-cloth-")
      );
      setItems(cleaned);
    } else {
      // Clean brand new user: strictly 0 items!
      setItems([]);
      safeStorage.setJSON(`inco_items_${tKey}`, []);
    }

    const savedMovements = safeStorage.getJSON<StockMovement[] | null>(`inco_movements_${tKey}`, null);
    if (savedMovements !== null && Array.isArray(savedMovements)) {
      setMovements(savedMovements.filter((m) => m && m.id && !m.id.startsWith("mov-demo-") && !m.id.startsWith("demo-")));
    } else {
      setMovements([]);
      safeStorage.setJSON(`inco_movements_${tKey}`, []);
    }

    const savedCredits = safeStorage.getJSON<CreditRecord[] | null>(`inco_credits_${tKey}`, null);
    if (savedCredits !== null && Array.isArray(savedCredits)) {
      setCredits(savedCredits.filter((c) => c && c.id && !c.id.startsWith("cred-")));
    } else {
      setCredits([]);
      safeStorage.setJSON(`inco_credits_${tKey}`, []);
    }

    const savedCash = safeStorage.getItem(`inco_cash_${tKey}`);
    setCashAtHand(savedCash ? parseFloat(savedCash) : 0.0);
  }, [currentAccount?.id]);

  // Filter & Search state
  const [activeFilter, setActiveFilter] = useState<"all" | "low_stock" | "out_of_stock">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals & Panels
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [targetItemForAssign, setTargetItemForAssign] = useState<InventoryItem | null>(null);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isQuickSaleOpen, setIsQuickSaleOpen] = useState(false);
  const [isQuickRestockOpen, setIsQuickRestockOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPrintSheetOpen, setIsPrintSheetOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSalesReportOpen, setIsSalesReportOpen] = useState(false);
  const [isLowStockEmailOpen, setIsLowStockEmailOpen] = useState(false);
  const [isStockValuationOpen, setIsStockValuationOpen] = useState(false);
  const [isWhatsappOrderOpen, setIsWhatsappOrderOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isInstallShortcutOpen, setIsInstallShortcutOpen] = useState(false);

  // Community Chat & Back-office State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    return safeStorage.getJSON<ChatMessage[]>("inco_chat_messages", INITIAL_CHAT_MESSAGES);
  });

  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>(() => {
    return safeStorage.getJSON<PaymentRequest[]>("inco_payment_requests", INITIAL_PAYMENT_REQUESTS);
  });

  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>(() => {
    return safeStorage.getJSON<VerificationRequest[]>("inco_verification_requests", INITIAL_VERIFICATION_REQUESTS);
  });

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type?: "success" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  // Realtime subscription to tenant items in Firestore
  useEffect(() => {
    if (!activeBusinessId) return;
    const unsubscribe = subscribeToTenantItems(activeBusinessId, (remoteItems) => {
      if (remoteItems && remoteItems.length > 0) {
        setItems(remoteItems);
      } else if (items.length > 0) {
        syncItemsToBusinessFirestore(activeBusinessId, items).catch(() => {});
      }
    });
    return () => unsubscribe();
  }, [activeBusinessId]);

  // Sync to local cache and fallback Firestore
  useEffect(() => {
    if (currentAccount?.id) {
      const tKey = currentAccount.id.replace(/[^a-zA-Z0-9_-]/g, "_");
      safeStorage.setJSON(`inco_items_${tKey}`, items);
    }
    safeStorage.setJSON("inco_inventory_items", items);
    if (activeBusinessId) {
      syncItemsToBusinessFirestore(activeBusinessId, items).catch(() => {});
    } else if (userPhoneOrEmail) {
      syncItemsToFirestore(userPhoneOrEmail, items);
    }
  }, [items, activeBusinessId, userPhoneOrEmail, currentAccount?.id]);

  useEffect(() => {
    if (currentAccount?.id) {
      const tKey = currentAccount.id.replace(/[^a-zA-Z0-9_-]/g, "_");
      safeStorage.setJSON(`inco_movements_${tKey}`, movements);
    }
    safeStorage.setJSON("inco_stock_movements", movements);
  }, [movements, currentAccount?.id]);

  useEffect(() => {
    if (currentAccount?.id) {
      const tKey = currentAccount.id.replace(/[^a-zA-Z0-9_-]/g, "_");
      safeStorage.setJSON(`inco_credits_${tKey}`, credits);
    }
    safeStorage.setJSON("inco_credit_records", credits);
  }, [credits, currentAccount?.id]);

  useEffect(() => {
    if (currentAccount?.id) {
      const tKey = currentAccount.id.replace(/[^a-zA-Z0-9_-]/g, "_");
      safeStorage.setItem(`inco_cash_${tKey}`, cashAtHand.toString());
    }
    safeStorage.setItem("inco_cash_at_hand", cashAtHand.toString());
  }, [cashAtHand, currentAccount?.id]);

  useEffect(() => {
    safeStorage.setJSON("inco_store_settings", settings);
  }, [settings]);

  useEffect(() => {
    safeStorage.setJSON("inco_dark_mode", darkMode);
    if (darkMode) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
    }
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute("content", "#000000");
    }
  }, [darkMode]);

  useEffect(() => {
    safeStorage.setJSON("inco_chat_messages", chatMessages);
  }, [chatMessages]);

  useEffect(() => {
    safeStorage.setJSON("inco_payment_requests", paymentRequests);
  }, [paymentRequests]);

  useEffect(() => {
    safeStorage.setJSON("inco_verification_requests", verificationRequests);
  }, [verificationRequests]);

  // Admin Users List from Firestore & Backend Server
  const [adminUsersList, setAdminUsersList] = useState<UserProfile[]>([]);

  const refreshAdminUsers = useCallback(async () => {
    try {
      const fsUsers = await fetchAllUsersFromFirestore().catch(() => []);
      let serverUsers: UserProfile[] = [];
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const d = await res.json();
          if (Array.isArray(d.users)) {
            serverUsers = d.users.map((u: any) => ({
              id: u.id,
              identifier: u.emailOrPhone,
              displayName: u.displayName,
              storeName: u.storeName,
              role: u.role,
              isVerified: u.isVerified,
              verificationStatus: u.verificationStatus,
              accountStatus: u.accountStatus,
              avatarUrl: u.avatarUrl,
              createdAt: u.createdAt,
              subscription: {
                plan: u.isPro ? "INCO Pro AI" : "Free Starter",
                status: u.isPro ? "active" : "free",
                validUntil: u.proExpiresAt,
              },
            }));
          }
        }
      } catch (err) {}

      const localUsers = loadRegisteredAccounts().map(convertAccountToUserProfile);

      // Merge and deduplicate by identifier / email / id
      const map = new Map<string, UserProfile>();
      localUsers.forEach((u) => {
        const key = (u.identifier || u.id || "").toLowerCase();
        if (key) map.set(key, u);
      });
      serverUsers.forEach((u) => {
        const key = (u.identifier || u.id || "").toLowerCase();
        if (key) {
          const existing = map.get(key);
          map.set(key, existing ? { ...existing, ...u } : u);
        }
      });
      (fsUsers || []).forEach((u: any) => {
        const key = (u.identifier || u.email || u.id || "").toLowerCase();
        if (key) {
          const existing = map.get(key);
          map.set(key, existing ? { ...existing, ...u } : u);
        }
      });

      const merged = Array.from(map.values());
      if (merged.length > 0) {
        setAdminUsersList(merged);
        return;
      }
    } catch (e) {
      console.warn("[Admin] User fetch error:", e);
    }
    setAdminUsersList(loadRegisteredAccounts().map(convertAccountToUserProfile));
  }, []);

  // Combined master user list for Admin Portal ensuring brand new registrations are immediately visible
  const displayAllUsers = useMemo(() => {
    const map = new Map<string, UserProfile>();
    // 1. Seed with local registered accounts (ensures instant visibility upon signup)
    registeredAccounts.map(convertAccountToUserProfile).forEach((u) => {
      const key = (u.identifier || u.id || "").toLowerCase();
      if (key) map.set(key, u);
    });
    // 2. Merge backend server & firestore users
    adminUsersList.forEach((u) => {
      const key = (u.identifier || u.id || "").toLowerCase();
      if (key) {
        const existing = map.get(key);
        map.set(key, existing ? { ...existing, ...u } : u);
      }
    });
    return Array.from(map.values());
  }, [adminUsersList, registeredAccounts]);

  // Real-time Firestore users subscription for live cross-device Admin Portal updates
  useEffect(() => {
    const unsub = subscribeToAllUsersFromFirestore((liveUsers) => {
      if (Array.isArray(liveUsers) && liveUsers.length > 0) {
        const localUsers = loadRegisteredAccounts().map(convertAccountToUserProfile);
        const map = new Map<string, UserProfile>();
        localUsers.forEach((u) => {
          const key = (u.identifier || u.id || "").toLowerCase();
          if (key) map.set(key, u);
        });
        liveUsers.forEach((u) => {
          const key = (u.identifier || u.email || u.id || "").toLowerCase();
          if (key) {
            const existing = map.get(key);
            map.set(key, existing ? { ...existing, ...u } : u);
          }
        });
        setAdminUsersList(Array.from(map.values()));
      }
    });
    return () => unsub();
  }, []);

  // Initial and reactive sync of registered users with the backend database
  useEffect(() => {
    refreshAdminUsers();

    // 1. Sync on mount
    syncUsersWithServer()
      .then((synced) => {
        if (Array.isArray(synced) && synced.length > 0) {
          setRegisteredAccounts(synced);
        }
      })
      .catch(() => {});

    // 2. Listen to local and cross-tab user account updates
    const handleRemoteUsersUpdate = () => {
      refreshAdminUsers();
      syncUsersWithServer()
        .then((synced) => {
          if (Array.isArray(synced) && synced.length > 0) {
            setRegisteredAccounts(synced);
          } else {
            setRegisteredAccounts(loadRegisteredAccounts());
          }
        })
        .catch(() => {
          setRegisteredAccounts(loadRegisteredAccounts());
        });
    };
    window.addEventListener("inco:users-updated", handleRemoteUsersUpdate);
    window.addEventListener("storage", handleRemoteUsersUpdate);

    // 3. Periodic background synchronization (every 8 seconds) to catch newly registered users
    const pollInterval = setInterval(handleRemoteUsersUpdate, 8000);

    // 4. Sync whenever connectivity comes online
    const handleOnline = () => {
      handleRemoteUsersUpdate();
    };
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("inco:users-updated", handleRemoteUsersUpdate);
      window.removeEventListener("storage", handleRemoteUsersUpdate);
      window.removeEventListener("online", handleOnline);
      clearInterval(pollInterval);
    };
  }, []);

  const handleToggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const handleEnterApp = () => {
    setShowSplash(false);
    localStorage.setItem("inco_splash_dismissed", "true");
  };

  // Login handler
  const handleSuccessLogin = (account: RegisteredAccount) => {
    setCurrentAccount(account);
    setActiveSessionUser(account);
    const updatedAccounts = loadRegisteredAccounts();
    setRegisteredAccounts(updatedAccounts);
    refreshAdminUsers();
    syncUsersWithServer().catch(() => {});
    setIsAuthOpen(false);
    showToast(`Welcome back, ${account.displayName || account.emailOrPhone}!`, "success");

    // Automatically prompt to install home screen shortcut after user sign up and login
    const isStandalone =
      (typeof window !== "undefined" && (window.navigator as any).standalone === true) ||
      (typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches);

    if (!isStandalone) {
      setTimeout(() => {
        setIsInstallShortcutOpen(true);
      }, 500);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await fbSignOut();
    } catch (e) {}
    setActiveSessionUser(null);
    setCurrentAccount(null);
    setIsAuthOpen(true);
    showToast("Signed out of store session");
  };

  // Delete account handler
  const handleDeleteAccount = (accountId?: string) => {
    const targetId = accountId || currentAccount?.id;
    if (!targetId) return;

    const remaining = registeredAccounts.filter((a) => a.id !== targetId);
    saveRegisteredAccounts(remaining);
    setRegisteredAccounts(remaining);

    if (currentAccount?.id === targetId) {
      setActiveSessionUser(null);
      setCurrentAccount(null);
      setIsAuthOpen(true);
      showToast("Account deleted.");
    }
  };

  // Profile update handler
  const handleUpdateProfile = (
    updates: Partial<UserProfile>,
    newSettings?: Partial<StoreSettings>
  ) => {
    if (!currentAccount) return;
    const newLogo =
      updates.businessLogo !== undefined
        ? updates.businessLogo
      : updates.logoUrl !== undefined
      ? updates.logoUrl
      : currentAccount.businessLogo;

    const updatedAccount: RegisteredAccount = {
      ...currentAccount,
      displayName: updates.displayName || currentAccount.displayName,
      storeName: updates.storeName || currentAccount.storeName,
      avatarUrl: updates.avatarUrl || currentAccount.avatarUrl,
      businessLogo: newLogo,
      logoUrl: newLogo,
    };

    const accounts = registeredAccounts.map((a) =>
      a.id === currentAccount.id ? updatedAccount : a
    );
    saveRegisteredAccounts(accounts);
    setRegisteredAccounts(accounts);
    setCurrentAccount(updatedAccount);
    setActiveSessionUser(updatedAccount);

    setSettings((prev) => {
      const merged = {
        ...prev,
        storeName: updates.storeName || prev.storeName,
        storeLogo: newLogo !== undefined ? newLogo : prev.storeLogo,
        businessLogo: newLogo !== undefined ? newLogo : prev.businessLogo,
        ...(newSettings || {}),
      };
      safeStorage.setJSON("inco_store_settings", merged);
      return merged;
    });

    if (newSettings?.darkMode !== undefined) {
      setDarkMode(newSettings.darkMode);
    }

    // Multi-cloud sync to Firestore and backend Express server
    updateUserInFirestore(currentAccount.id, {
      displayName: updatedAccount.displayName,
      storeName: updatedAccount.storeName,
      avatarUrl: updatedAccount.avatarUrl,
      businessLogo: updatedAccount.businessLogo,
      logoUrl: updatedAccount.logoUrl,
    } as any).catch(() => {});

    updateUserOnBackend(currentAccount.id, {
      displayName: updatedAccount.displayName,
      storeName: updatedAccount.storeName,
      avatarUrl: updatedAccount.avatarUrl,
      businessLogo: updatedAccount.businessLogo,
      logoUrl: updatedAccount.logoUrl,
    } as any).catch(() => {});

    showToast("Profile & Store branding updated successfully!", "success");
  };

  // Verification request submit
  const handleSubmitVerification = (data: any) => {
    if (!currentAccount) return;

    const newReq: VerificationRequest = {
      id: "ver-req-" + Date.now(),
      userId: currentAccount.id,
      userEmailOrPhone: currentAccount.emailOrPhone,
      userName: data.userName || currentAccount.displayName || currentAccount.emailOrPhone,
      legalName: data.legalName || currentAccount.displayName || currentAccount.emailOrPhone,
      idType: data.idType || data.documentType || "National ID",
      idNumber: data.idNumber || data.documentNumber || "ID-DOC",
      passportPhotoUrl: data.passportPhotoUrl || currentAccount.avatarUrl,
      idDocUrl: data.idDocUrl || data.documentUrl || "",
      status: "pending",
      submittedAt: new Date().toISOString(),
    };

    setVerificationRequests((prev) => [newReq, ...prev]);

    const updatedAccount: RegisteredAccount = {
      ...currentAccount,
      verificationStatus: "pending",
    };

    const accounts = registeredAccounts.map((a) =>
      a.id === currentAccount.id ? updatedAccount : a
    );
    saveRegisteredAccounts(accounts);
    setRegisteredAccounts(accounts);
    setCurrentAccount(updatedAccount);
    setActiveSessionUser(updatedAccount);

    showToast("Verification document submitted for Admin approval!", "success");
  };

  // Subscription upgrade request submit ($4.99/mo)
  const handleSubmitSubscriptionRequest = (data: {
    months: number;
    amount: number;
    paymentMethod: any;
    transactionRef: string;
    proofUrl?: string;
  }) => {
    if (!currentAccount) return;

    const newPayReq: PaymentRequest = {
      id: "pay-req-" + Date.now(),
      userId: currentAccount.id,
      userEmailOrPhone: currentAccount.emailOrPhone,
      userName: currentAccount.displayName || currentAccount.emailOrPhone,
      planName: "INCO Pro AI",
      amount: data.amount,
      currency: "USD",
      paymentMethod: "Mobile Money (M-Pesa/MTN)",
      transactionRef: data.transactionRef,
      proofUrl: data.proofUrl,
      status: "pending",
      submittedAt: new Date().toISOString(),
    };

    setPaymentRequests((prev) => [newPayReq, ...prev]);
    showToast("Payment confirmation submitted to Admin for approval!", "success");
  };

  // Chat message send
  const handleSendMessage = (msgOrContent: Omit<ChatMessage, "id" | "timestamp" | "status"> | string, channelId?: any) => {
    const content = typeof msgOrContent === "string" ? msgOrContent : msgOrContent.content;
    const channel = typeof msgOrContent === "object" ? msgOrContent.channelId : (channelId || "support");
    const newMsg: ChatMessage = {
      id: "msg-" + Date.now(),
      channelId: channel || "support",
      senderId: userProfile.id,
      senderName: userProfile.displayName || "Store Merchant",
      senderAvatar: userProfile.avatarUrl,
      senderRole: userProfile.role === "admin" ? "admin" : "user",
      isVerified: userProfile.isVerified,
      content,
      timestamp: new Date().toISOString(),
      status: "delivered",
    };

    setChatMessages((prev) => [...prev, newMsg]);

    // If support desk, simulate intelligent support response
    setTimeout(() => {
      const reply: ChatMessage = {
        id: "msg-reply-" + Date.now(),
        channelId: "support",
        senderId: "inco-support-agent",
        senderName: "INCO Live Helpdesk",
        senderAvatar:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
        senderRole: "admin",
        isVerified: true,
        content: `Thank you for reaching out! A verified INCO representative has received your request: "${content.substring(
          0,
          40
        )}...". We are checking your account status and stock sync.`,
        timestamp: new Date().toISOString(),
        status: "delivered",
      };
      setChatMessages((prev) => [...prev, reply]);
    }, 1200);
  };

  // Super Admin: Payment Approval
  const handleApprovePayment = (requestId: string) => {
    const req = paymentRequests.find((p) => p.id === requestId);
    if (!req) return;

    setPaymentRequests((prev) =>
      prev.map((p) => (p.id === requestId ? { ...p, status: "approved" } : p))
    );

    const targetAccount = registeredAccounts.find(
      (a) =>
        a.id === req.userId ||
        a.emailOrPhone.toLowerCase() === req.userEmailOrPhone.toLowerCase()
    );

    if (targetAccount) {
      const now = new Date();
      const expires = new Date(now.setMonth(now.getMonth() + 1)).toISOString();
      const updatedAcc: RegisteredAccount = {
        ...targetAccount,
        isPro: true,
        proExpiresAt: expires,
      };
      const updatedAccounts = registeredAccounts.map((a) =>
        a.id === targetAccount.id ? updatedAcc : a
      );
      saveRegisteredAccounts(updatedAccounts);
      setRegisteredAccounts(updatedAccounts);

      if (currentAccount?.id === targetAccount.id) {
        setCurrentAccount(updatedAcc);
        setActiveSessionUser(updatedAcc);
      }
    }

    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    showToast(`Payment of $${req.amount.toFixed(2)} approved! Pro Tier activated.`, "success");
  };

  const handleRejectPayment = (requestId: string, reason?: string) => {
    setPaymentRequests((prev) =>
      prev.map((p) => (p.id === requestId ? { ...p, status: "rejected" } : p))
    );
    showToast(`Payment rejected: ${reason || "Invalid transaction details"}`);
  };

  // Super Admin: Verification Approval
  const handleApproveVerification = (requestId: string) => {
    const req = verificationRequests.find((v) => v.id === requestId);
    if (!req) return;

    setVerificationRequests((prev) =>
      prev.map((v) => (v.id === requestId ? { ...v, status: "approved" } : v))
    );

    const targetAcc = registeredAccounts.find(
      (a) =>
        a.id === req.userId ||
        a.emailOrPhone.toLowerCase() === req.userEmailOrPhone.toLowerCase()
    );

    if (targetAcc) {
      const updatedAcc: RegisteredAccount = {
        ...targetAcc,
        isVerified: true,
        verificationStatus: "approved",
      };
      const updatedAccounts = registeredAccounts.map((a) =>
        a.id === targetAcc.id ? updatedAcc : a
      );
      saveRegisteredAccounts(updatedAccounts);
      setRegisteredAccounts(updatedAccounts);

      if (currentAccount?.id === targetAcc.id) {
        setCurrentAccount(updatedAcc);
        setActiveSessionUser(updatedAcc);
      }
    }

    confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
    showToast(`Merchant ${req.userName} officially verified with golden badge!`, "success");
  };

  const handleRejectVerification = (requestId: string, reason?: string) => {
    setVerificationRequests((prev) =>
      prev.map((v) => (v.id === requestId ? { ...v, status: "rejected" } : v))
    );
    showToast(`Verification rejected: ${reason || "Document mismatch"}`);
  };

  const logMovement = (
    itemId: string,
    itemName: string,
    type: StockMovement["type"],
    delta: number,
    newQuantity: number,
    note?: string
  ) => {
    const newMov: StockMovement = {
      id: "mov-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      itemId,
      itemName,
      type,
      delta,
      newQuantity,
      timestamp: new Date().toISOString(),
      note,
    };
    setMovements((prev) => [newMov, ...prev.slice(0, 199)]);
  };

  const handleUpdateQuantity = (id: string, delta: number, note?: string) => {
    setItems((prev) => {
      const next = prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(0, item.quantity + delta);
          logMovement(
            item.id,
            item.name,
            delta > 0 ? "add_stock" : "remove_stock",
            delta,
            newQty,
            note
          );
          return {
            ...item,
            quantity: newQty,
            lastCountedAt: new Date().toISOString(),
          };
        }
        return item;
      });
      return next;
    });
  };

  const handleSetExactQuantity = (id: string, newQuantity: number, note?: string) => {
    setItems((prev) => {
      const next = prev.map((item) => {
        if (item.id === id) {
          const delta = newQuantity - item.quantity;
          if (delta !== 0) {
            logMovement(
              item.id,
              item.name,
              "count_set",
              delta,
              newQuantity,
              note || "Manual count set"
            );
          }
          return {
            ...item,
            quantity: newQuantity,
            lastCountedAt: new Date().toISOString(),
          };
        }
        return item;
      });
      return next;
    });
  };

  const handleAddItem = (itemData: Omit<InventoryItem, "id" | "lastCountedAt">) => {
    const newItem: InventoryItem = {
      ...itemData,
      id: "item-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      lastCountedAt: new Date().toISOString(),
    };
    setItems((prev) => [newItem, ...prev]);
    logMovement(
      newItem.id,
      newItem.name,
      "add_stock",
      newItem.quantity,
      newItem.quantity,
      "New item created"
    );

    if (activeBusinessId) {
      saveItemToBusinessFirestore(activeBusinessId, newItem).catch(() => {});
      recordAuditLog({
        businessId: activeBusinessId,
        userId: fbUser?.uid || "user",
        userEmail: fbUser?.email || "user",
        action: "ITEM_CREATED",
        entityType: "item",
        entityId: newItem.id,
        newData: newItem,
      }).catch(() => {});
    }

    showToast(`Added "${newItem.name}" to inventory!`);
  };

  const handleUpdateItem = (updatedItem: InventoryItem) => {
    setItems((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
    if (activeBusinessId) {
      saveItemToBusinessFirestore(activeBusinessId, updatedItem).catch(() => {});
      recordAuditLog({
        businessId: activeBusinessId,
        userId: fbUser?.uid || "user",
        userEmail: fbUser?.email || "user",
        action: "ITEM_UPDATED",
        entityType: "item",
        entityId: updatedItem.id,
        newData: updatedItem,
      }).catch(() => {});
    }
    showToast(`Updated "${updatedItem.name}"`);
  };

  const handleDeleteItem = (id: string) => {
    const target = items.find((i) => i.id === id);
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (activeBusinessId) {
      deleteItemFromBusinessFirestore(activeBusinessId, id).catch(() => {});
      recordAuditLog({
        businessId: activeBusinessId,
        userId: fbUser?.uid || "user",
        userEmail: fbUser?.email || "user",
        action: "ITEM_DELETED",
        entityType: "item",
        entityId: id,
        previousData: target,
      }).catch(() => {});
    }
    if (target) showToast(`Deleted "${target.name}"`);
  };

  const handleDeleteBatchItems = (ids: string[]) => {
    const count = ids.length;
    setItems((prev) => prev.filter((item) => !ids.includes(item.id)));
    if (activeBusinessId) {
      ids.forEach((id) => {
        deleteItemFromBusinessFirestore(activeBusinessId, id).catch(() => {});
      });
      recordAuditLog({
        businessId: activeBusinessId,
        userId: fbUser?.uid || "user",
        userEmail: fbUser?.email || "user",
        action: "BATCH_ITEMS_DELETED",
        entityType: "item",
        entityId: ids.join(","),
        newData: { deletedCount: count, ids },
      }).catch(() => {});
    }
    showToast(`Deleted ${count} items from inventory in batch!`);
  };

  const handleUpdateBatchItems = (updates: Array<{ id: string; changes: Partial<InventoryItem> }>) => {
    const count = updates.length;
    setItems((prev) =>
      prev.map((item) => {
        const up = updates.find((u) => u.id === item.id);
        if (!up) return item;
        return {
          ...item,
          ...up.changes,
          lastCountedAt: new Date().toISOString(),
        };
      })
    );
    if (activeBusinessId) {
      updates.forEach((u) => {
        const existing = items.find((i) => i.id === u.id);
        if (existing) {
          saveItemToBusinessFirestore(activeBusinessId, {
            ...existing,
            ...u.changes,
            lastCountedAt: new Date().toISOString(),
          }).catch(() => {});
        }
      });
      recordAuditLog({
        businessId: activeBusinessId,
        userId: fbUser?.uid || "user",
        userEmail: fbUser?.email || "user",
        action: "BATCH_ITEMS_UPDATED",
        entityType: "item",
        entityId: updates.map((u) => u.id).join(","),
        newData: { updatedCount: count },
      }).catch(() => {});
    }
    showToast(`Successfully updated ${count} items in bulk!`);
  };

  const handleAssignBarcode = (itemId: string, barcode: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, barcode } : item))
    );
    showToast(`Assigned barcode "${barcode}"!`);
  };

  const handleApplyParsedActions = (actions: ParsedAIAction[]) => {
    let updatedCount = 0;
    actions.forEach((act) => {
      const match = items.find((i) =>
        i.name.toLowerCase().includes(act.itemName.toLowerCase())
      );
      if (match) {
        if (act.actionType === "add_stock") {
          handleUpdateQuantity(match.id, act.quantity, "AI Voice/Note Restock");
        } else if (act.actionType === "remove_stock") {
          handleUpdateQuantity(match.id, -act.quantity, "AI Voice/Note Sale");
        } else if (act.actionType === "count") {
          handleSetExactQuantity(match.id, act.quantity, "AI Voice/Note Count");
        }
        updatedCount++;
      } else if (act.actionType === "new_item" || act.actionType === "count") {
        handleAddItem({
          name: act.itemName,
          category: act.category || "Beverages",
          quantity: act.quantity,
          costPrice: 10,
          sellingPrice: 15,
          reorderPoint: 5,
          unit: act.unit || "pcs",
          barcode: "",
          sku: "SKU-" + Math.floor(1000 + Math.random() * 9000),
          location: "Front Shelf",
        });
        updatedCount++;
      }
    });
    showToast(`AI updated ${updatedCount} items automatically!`);
  };

  const handleImportPhotoItems = (photoItems: DetectedAIPhotoItem[]) => {
    let imported = 0;
    photoItems.forEach((p) => {
      const existing = items.find((i) => i.name.toLowerCase() === p.name.toLowerCase());
      if (existing) {
        handleSetExactQuantity(existing.id, p.estimatedQuantity, "AI Camera Count");
      } else {
        handleAddItem({
          name: p.name,
          category: p.category || "Groceries",
          quantity: p.estimatedQuantity,
          costPrice: p.estimatedCostPrice || 10,
          sellingPrice: p.estimatedSellingPrice || 15,
          reorderPoint: 5,
          unit: p.unit || "pcs",
          barcode: p.barcode || "",
          sku: "SKU-" + Math.floor(1000 + Math.random() * 9000),
          location: "Shelf Area",
        });
      }
      imported++;
    });
    showToast(`Imported & updated ${imported} items from photo count!`);
  };

  const handleApplyAudit = (
    countsOrAudited: Record<string, number> | Array<{ id: string; name: string; countedQty: number; variance: number }>,
    auditTitle?: string
  ) => {
    let reconciledCount = 0;
    if (Array.isArray(countsOrAudited)) {
      countsOrAudited.forEach((audit) => {
        if (audit.variance !== 0) {
          handleSetExactQuantity(
            audit.id,
            audit.countedQty,
            `Audit Reconciliation: ${auditTitle || "Routine"} (Variance: ${audit.variance > 0 ? "+" : ""}${audit.variance})`
          );
          reconciledCount++;
        }
      });
    } else {
      Object.entries(countsOrAudited).forEach(([itemId, countedQty]) => {
        const item = items.find((i) => i.id === itemId);
        if (item && item.quantity !== countedQty) {
          const variance = countedQty - item.quantity;
          handleSetExactQuantity(
            itemId,
            countedQty,
            `Audit: ${auditTitle || "Physical Stock Count"} (Variance: ${variance > 0 ? "+" : ""}${variance})`
          );
          reconciledCount++;
        }
      });
    }
    showToast(`Audit complete! Reconciled ${reconciledCount} items.`);
  };

  const handleCompleteSale = (
    cart: Array<{ item: InventoryItem; quantity: number }>,
    totalAmount: number,
    paymentDetails?: SalePaymentDetails
  ) => {
    cart.forEach(({ item, quantity }) => {
      handleUpdateQuantity(
        item.id,
        -quantity,
        `POS Sale to ${paymentDetails?.customerName || "Customer"}`
      );
    });

    const cashCollected = paymentDetails?.amountPaid ?? totalAmount;
    if (cashCollected > 0) {
      setCashAtHand((prev) => prev + cashCollected);
    }

    if (activeBusinessId) {
      const saleId = "sale-" + Date.now();
      const saleItems = cart.map((c) => ({
        itemId: c.item.id,
        itemName: c.item.name,
        quantity: c.quantity,
        unitPrice: c.item.sellingPrice,
        costPrice: c.item.costPrice,
        unit: c.item.unit,
      }));
      const totalUnits = cart.reduce((sum, c) => sum + c.quantity, 0);

      executeSaleTransactionAtomic(activeBusinessId, {
        saleId,
        items: saleItems,
        totalAmount,
        totalUnits,
        paymentMethod: paymentDetails?.paymentMethod || "Cash at Hand",
        amountPaid: paymentDetails?.amountPaid ?? totalAmount,
        paymentStatus: paymentDetails?.paymentStatus || "paid",
        customerName: paymentDetails?.customerName || "Walk-in",
        notes: paymentDetails?.notes,
      }).catch((err) => {
        console.warn("Atomic sale sync notice:", err);
      });
    }

    if (userPhoneOrEmail) {
      saveSaleToFirestore(userPhoneOrEmail, {
        id: "sale-" + Date.now(),
        items: cart.map((c) => ({
          id: c.item.id,
          name: c.item.name,
          qty: c.quantity,
          price: c.item.sellingPrice,
        })),
        totalAmount,
        cashCollected,
        customerName: paymentDetails?.customerName || "Walk-in",
      });
    }

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });

    const totalItemCount = cart.reduce((acc, curr) => acc + curr.quantity, 0);
    setSaleSuccessInfo({
      totalAmount,
      currencySymbol: settings.currencySymbol,
      itemCount: totalItemCount,
      customerName: paymentDetails?.customerName || "Walk-in Cash Customer",
      paymentStatus: paymentDetails?.paymentStatus || "paid",
      notes: paymentDetails?.notes,
    });

    showToast(
      `Sale completed: ${settings.currencySymbol}${totalAmount.toFixed(2)} recorded!`,
      "success"
    );
  };

  const handleQuickSellSingleItem = (item: InventoryItem) => {
    if (item.quantity <= 0) {
      showToast(`Cannot sell "${item.name}" - out of stock!`, "info");
      return;
    }
    handleCompleteSale([{ item, quantity: 1 }], item.sellingPrice, {
      paymentStatus: "paid",
      customerName: "Walk-in Cash Customer",
      amountPaid: item.sellingPrice,
      amountOutstanding: 0,
      notes: "1-Tap Quick Sale Button",
    });
  };

  const handleCompleteRestock = (
    deliveries: Array<{ item: InventoryItem; addQuantity?: number; quantity?: number; newCostPrice?: number; unitCost?: number }>
  ) => {
    let totalRestockCost = 0;
    deliveries.forEach(({ item, addQuantity, quantity, newCostPrice, unitCost }) => {
      const qty = addQuantity ?? quantity ?? 0;
      const cost = newCostPrice ?? unitCost ?? item.costPrice;
      if (qty > 0) {
        handleUpdateQuantity(item.id, qty, "Supplier Delivery Restock");
        if (cost !== item.costPrice) {
          handleUpdateItem({ ...item, costPrice: cost });
        }
        totalRestockCost += qty * cost;
      }
    });

    if (totalRestockCost > 0) {
      setCashAtHand((prev) => Math.max(0, prev - totalRestockCost));
    }

    showToast(
      `Restocked ${deliveries.length} items from supplier! Total: ${settings.currencySymbol}${totalRestockCost.toFixed(
        2
      )}`,
      "success"
    );
  };

  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Name",
      "Category",
      "Quantity",
      "Unit",
      "CostPrice",
      "SellingPrice",
      "ReorderPoint",
      "Barcode",
      "SKU",
      "Location",
      "LastCounted",
    ];

    const rows = items.map((i) => [
      i.id,
      `"${i.name.replace(/"/g, '""')}"`,
      `"${i.category}"`,
      i.quantity,
      i.unit,
      i.costPrice,
      i.sellingPrice,
      i.reorderPoint,
      i.barcode || "",
      i.sku || "",
      `"${i.location || ""}"`,
      i.lastCountedAt || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `inco_inventory_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV inventory exported successfully!");
  };

  const lowStockCount = items.filter((i) => i.quantity <= i.reorderPoint).length;

  return (
    <div
      className={`min-h-screen relative ${
        darkMode ? "dark bg-[#1E1E1E] text-slate-100" : "bg-[#F8F9FA] text-[#252525]"
      } font-sans antialiased flex flex-col selection:bg-[#E5F107] selection:text-[#252525] transition-colors duration-200`}
    >
      {/* Welcome Screen (Compact & High Contrast Black & Yellow Theme) */}
      {showSplash && (
        <SplashScreen
          onEnterApp={handleEnterApp}
          onOpenAuth={(initialTab) => {
            if (initialTab) {
              setAuthInitialTab(initialTab);
            }
            setShowSplash(false);
            setIsAuthOpen(true);
          }}
          userEmailOrPhone={userPhoneOrEmail}
        />
      )}

      {/* PWA Install Banner */}
      <InstallAppBanner />

      {/* Top Header: Dark Background with Minimal Headings & Menu Trigger */}
      <Header
        activeView={activeView}
        onSelectView={setActiveView}
        settings={settings}
        userPhoneOrEmail={userPhoneOrEmail}
        userProfile={userProfile}
        onOpenMenu={() => setIsMenuOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setActiveView("profile")}
        onOpenQuickSale={() => setActiveView("pos")}
        onEnterWelcome={() => setShowSplash(true)}
      />

      {/* Toast Notification Banner */}
      {toast && (
        <div
          role="status"
          className="fixed top-16 right-4 z-50 bg-[#252525] text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-xl border border-[#E5F107] animate-in fade-in slide-in-from-top-2 duration-200 flex items-center gap-2 max-w-md"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#E5F107] shrink-0 animate-ping" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Multi-Page Canvas Area */}
      <main className="flex-1 p-3 sm:p-5 lg:p-6 space-y-4 max-w-7xl w-full mx-auto pb-24 md:pb-8">
        {/* NEW WORLD-CLASS DASHBOARD VIEW */}
        {activeView === "dashboard" && (
          <DashboardView
            settings={settings}
            userProfile={userProfile}
            items={items}
            movements={movements}
            onNavigateTo={setActiveView}
            onOpenQuickSale={() => setActiveView("pos")}
            onOpenScanner={() => {
              setTargetItemForAssign(null);
              setIsScannerOpen(true);
            }}
            onOpenNotifications={() => setIsChatOpen(true)}
          />
        )}

        {/* NEW WORLD-CLASS SMART POS VIEW */}
        {activeView === "pos" && (
          <POSView
            items={items}
            settings={settings}
            onCompleteSale={(cart, total, paymentMethod) => {
              // Add to movements and complete sale
              cart.forEach(({ item, quantity }) => {
                handleUpdateQuantity(item.id, -quantity, `POS Sale: ${item.name}`);
              });
              setCashAtHand((prev) => prev + total);
              showToast(`Sale recorded successfully! Total: $${total.toFixed(2)}`, "success");
            }}
            onOpenScanner={() => {
              setTargetItemForAssign(null);
              setIsScannerOpen(true);
            }}
            onShowToast={showToast}
          />
        )}

        {/* NEW WORLD-CLASS PRODUCTS MANAGEMENT VIEW */}
        {activeView === "products" && (
          <ProductsView
            items={items}
            settings={settings}
            onAddItem={handleAddItem}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            onUpdateQuantity={handleUpdateQuantity}
          />
        )}

        {/* NEW WORLD-CLASS REPORTS VIEW */}
        {activeView === "reports" && (
          <ReportsView
            settings={settings}
            movements={movements}
            items={items}
          />
        )}

        {/* NEW WORLD-CLASS USER PROFILE VIEW */}
        {activeView === "profile" && (
          <ProfileView
            userProfile={userProfile}
            settings={settings}
            onUpdateProfile={handleUpdateProfile}
            onSaveSettings={(newSettings) => {
              setSettings(newSettings);
              safeStorage.setJSON("inco_store_settings", newSettings);
              if (newSettings.darkMode !== undefined) {
                setDarkMode(newSettings.darkMode);
              }
              showToast("Store settings saved!", "success");
            }}
            onOpenSubscription={() => setIsSubscriptionOpen(true)}
            onOpenVerification={() => setIsProfileOpen(true)}
            onOpenAdminPortal={() => setIsAdminPortalOpen(true)}
            onShowToast={showToast}
            onLogout={handleLogout}
          />
        )}

        {/* NEW WORLD-CLASS SALES VIEW */}
        {activeView === "sales" && (
          <SalesView
            settings={settings}
            movements={movements}
            onBack={() => setActiveView("dashboard")}
            onOpenScanner={() => {
              setTargetItemForAssign(null);
              setIsScannerOpen(true);
            }}
          />
        )}

        {/* PAGE 1: STOCK (LEGACY HOME) - Available via Menu */}
        {activeView === "stock" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Quick Sale Bar */}
            <InlineQuickSaleBar
              items={items}
              settings={settings}
              onCompleteSale={handleCompleteSale}
              onShowToast={showToast}
              onOpenFullPOSModal={() => setIsQuickSaleOpen(true)}
              onOpenScanner={() => {
                setTargetItemForAssign(null);
                setIsScannerOpen(true);
              }}
            />

            {/* Products Inventory Stock Table / Grid */}
            <QuickTallyView
              items={items}
              settings={settings}
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              onUpdateQuantity={handleUpdateQuantity}
              onSetExactQuantity={handleSetExactQuantity}
              onAddItem={handleAddItem}
              onUpdateItem={handleUpdateItem}
              onDeleteItem={handleDeleteItem}
              onDeleteBatchItems={handleDeleteBatchItems}
              onUpdateBatchItems={handleUpdateBatchItems}
              onScanItemBarcode={(item) => {
                setTargetItemForAssign(item);
                setIsScannerOpen(true);
              }}
              onOpenLowStockEmailAlert={() => setIsLowStockEmailOpen(true)}
              onQuickSellItem={handleQuickSellSingleItem}
            />
          </div>
        )}

        {/* PAGE 2: VALUATION - Stock Financials & Asset Metrics */}
        {activeView === "valuation" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <StockFinancialsBanner
              items={items}
              settings={settings}
              cashAtHand={cashAtHand}
              onOpenStockValuation={() => setIsStockValuationOpen(true)}
              onOpenQuickSale={() => setIsQuickSaleOpen(true)}
              onOpenSalesReport={() => setIsSalesReportOpen(true)}
            />

            {/* In-page Valuation Deep Breakdown */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white">
                    Stock Financials & Margins Breakdown
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Real-time valuation across all product categories
                  </p>
                </div>
                <button
                  onClick={() => setIsStockValuationOpen(true)}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  Open Full Valuation Modal
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Total Cost Investment
                  </div>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                    {settings.currencySymbol}
                    {items
                      .reduce((sum, item) => sum + item.costPrice * item.quantity, 0)
                      .toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Projected Retail Return
                  </div>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {settings.currencySymbol}
                    {items
                      .reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0)
                      .toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Unrealized Gross Margin
                  </div>
                  <div className="text-xl font-black text-amber-500 mt-1">
                    {(() => {
                      const cost = items.reduce(
                        (sum, item) => sum + item.costPrice * item.quantity,
                        0
                      );
                      const retail = items.reduce(
                        (sum, item) => sum + item.sellingPrice * item.quantity,
                        0
                      );
                      const margin = retail > 0 ? ((retail - cost) / retail) * 100 : 0;
                      return `${margin.toFixed(1)}%`;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PAGE 3: REPORTS - Sales Analytics, Chart & Recent Streams */}
        {activeView === "reports" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <DashboardAnalyticsSection
              items={items}
              movements={movements}
              settings={settings}
              onOpenReport={() => setIsSalesReportOpen(true)}
              onOpenHistory={() => setIsHistoryOpen(true)}
              onOpenQuickSale={() => setIsQuickSaleOpen(true)}
            />
          </div>
        )}

        {/* PAGE 4: SUPPLIERS - Urgent Restock & Supplier Orders */}
        {activeView === "suppliers" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <UrgentRestockWidget
              items={items}
              settings={settings}
              onQuickRestockItem={(itemId, addQty) => {
                handleUpdateQuantity(itemId, addQty, "Urgent Restock Action");
              }}
              onOpenFullRestockModal={() => setIsQuickRestockOpen(true)}
              onShowToast={showToast}
            />

            {/* Quick Supplier Restock Launcher */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center space-y-3 shadow-sm">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                Restock Orders & Supplier Deliveries
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                Create purchase receipts and update product counts in bulk when supplier delivery arrives.
              </p>
              <button
                onClick={() => setIsQuickRestockOpen(true)}
                className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer transition-colors"
              >
                Launch Multi-Item Restock Mode
              </button>
            </div>
          </div>
        )}

        {/* PAGE 5: TOOLS - All Tools, AI Scanner, Barcode, Audit, Logs, WhatsApp, Settings & Admin */}
        {activeView === "tools" && (
          <ToolsPageView
            userProfile={userProfile}
            settings={settings}
            items={items}
            onOpenScanner={() => {
              setTargetItemForAssign(null);
              setIsScannerOpen(true);
            }}
            onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
            onOpenAudit={() => setIsAuditOpen(true)}
            onOpenHistory={() => setIsHistoryOpen(true)}
            onOpenWhatsappOrder={() => setIsWhatsappOrderOpen(true)}
            onOpenLowStockEmail={() => setIsLowStockEmailOpen(true)}
            onOpenPrintSheet={() => setIsPrintSheetOpen(true)}
            onExportCSV={handleExportCSV}
            onOpenChat={() => setIsChatOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenSubscription={() => setIsSubscriptionOpen(true)}
            onOpenAdminPortal={() => setIsAdminPortalOpen(true)}
            onOpenQuickSale={() => setIsQuickSaleOpen(true)}
            onOpenQuickRestock={() => setIsQuickRestockOpen(true)}
            onOpenStockValuation={() => setIsStockValuationOpen(true)}
            onOpenSalesReport={() => setIsSalesReportOpen(true)}
          />
        )}
      </main>

      {/* Mobile Sticky Bottom Navigation Dock */}
      <MobileBottomNav
        activeTab={activeView}
        onSelectTab={setActiveView}
        lowStockCount={lowStockCount}
        darkMode={darkMode}
        userPhoneOrEmail={userPhoneOrEmail}
        userProfile={userProfile}
        onToggleDarkMode={handleToggleDarkMode}
        onOpenScan={() => {
          setTargetItemForAssign(null);
          setIsScannerOpen(true);
        }}
        onOpenQuickSale={() => setIsQuickSaleOpen(true)}
        onOpenStockValuation={() => setIsStockValuationOpen(true)}
        onOpenQuickRestock={() => setIsQuickRestockOpen(true)}
        onOpenSalesReport={() => setIsSalesReportOpen(true)}
        onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
        onOpenWhatsappOrder={() => setIsWhatsappOrderOpen(true)}
        onOpenAudit={() => setIsAuditOpen(true)}
        onOpenPrintSheet={() => setIsPrintSheetOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenProfile={() => setActiveView("profile")}
        onOpenAdminPortal={() => setIsAdminPortalOpen(true)}
        onOpenSubscription={() => setIsSubscriptionOpen(true)}
        onOpenMenu={() => setIsMenuOpen(true)}
      />

      {/* Global Comprehensive Menu Drawer Housing All Headings, Utilities & Administrative Tools */}
      <GlobalMenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        activeView={activeView}
        onSelectView={(view) => {
          setIsMenuOpen(false);
          setActiveView(view);
        }}
        userProfile={userProfile}
        settings={settings}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onOpenScanner={() => {
          setIsMenuOpen(false);
          setTargetItemForAssign(null);
          setIsScannerOpen(true);
        }}
        onOpenQuickSale={() => {
          setIsMenuOpen(false);
          setIsQuickSaleOpen(true);
        }}
        onOpenStockValuation={() => {
          setIsMenuOpen(false);
          setIsStockValuationOpen(true);
        }}
        onOpenQuickRestock={() => {
          setIsMenuOpen(false);
          setIsQuickRestockOpen(true);
        }}
        onOpenSalesReport={() => {
          setIsMenuOpen(false);
          setIsSalesReportOpen(true);
        }}
        onOpenAIAssistant={() => {
          setIsMenuOpen(false);
          setIsAIAssistantOpen(true);
        }}
        onOpenWhatsappOrder={() => {
          setIsMenuOpen(false);
          setIsWhatsappOrderOpen(true);
        }}
        onOpenAudit={() => {
          setIsMenuOpen(false);
          setIsAuditOpen(true);
        }}
        onOpenPrintSheet={() => {
          setIsMenuOpen(false);
          setIsPrintSheetOpen(true);
        }}
        onOpenHistory={() => {
          setIsMenuOpen(false);
          setIsHistoryOpen(true);
        }}
        onOpenSettings={() => {
          setIsMenuOpen(false);
          setIsSettingsOpen(true);
        }}
        onOpenAuth={() => {
          setIsMenuOpen(false);
          setIsAuthOpen(true);
        }}
        onOpenChat={() => {
          setIsMenuOpen(false);
          setIsChatOpen(true);
        }}
        onOpenProfile={() => {
          setIsMenuOpen(false);
          setActiveView("profile");
        }}
        onOpenAdminPortal={() => {
          setIsMenuOpen(false);
          setIsAdminPortalOpen(true);
        }}
        onOpenSubscription={() => {
          setIsMenuOpen(false);
          setIsSubscriptionOpen(true);
        }}
        onOpenLowStockEmail={() => {
          setIsMenuOpen(false);
          setIsLowStockEmailOpen(true);
        }}
        onLogout={handleLogout}
      />

      {/* Modals & Dialogs */}
      <ChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentUserProfile={userProfile}
        allMessages={chatMessages}
        onSendMessage={handleSendMessage}
        isAdmin={userProfile.role === "admin"}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userProfile={userProfile}
        onUpdateProfile={handleUpdateProfile}
        onSubmitVerification={handleSubmitVerification}
        onSubmitPaymentRequest={(payData) => {
          handleSubmitSubscriptionRequest({
            months: 1,
            amount: payData.amount,
            paymentMethod: payData.paymentMethod,
            transactionRef: payData.transactionRef,
            proofUrl: payData.proofUrl,
          });
        }}
        onOpenAdminPortal={() => {
          setIsProfileOpen(false);
          setIsAdminPortalOpen(true);
        }}
        onLogout={handleLogout}
        onDeleteAccount={handleDeleteAccount}
        onShowToast={showToast}
      />

      <SubscriptionModal
        isOpen={isSubscriptionOpen}
        onClose={() => setIsSubscriptionOpen(false)}
        userProfile={userProfile}
        onSubmitSubscriptionRequest={handleSubmitSubscriptionRequest}
        onShowToast={showToast}
      />

      <AdminPortalModal
        isOpen={isAdminPortalOpen}
        onClose={() => setIsAdminPortalOpen(false)}
        currentUserProfile={userProfile}
        paymentRequests={paymentRequests}
        verificationRequests={verificationRequests}
        allUsers={displayAllUsers}
        onRefreshUsers={refreshAdminUsers}
        onApprovePayment={handleApprovePayment}
        onRejectPayment={handleRejectPayment}
        onApproveVerification={handleApproveVerification}
        onRejectVerification={handleRejectVerification}
        onUpdateUserAccount={async (userId, updates) => {
          await updateUserInFirestore(userId, updates as any).catch((e) => console.warn(e));
          await updateUserOnBackend(userId, updates as any).catch(() => {});
          await refreshAdminUsers();
          const accounts = loadRegisteredAccounts();
          setRegisteredAccounts(accounts);
          if (currentAccount?.id === userId) {
            const fresh = accounts.find((a) => a.id === userId);
            if (fresh) {
              setCurrentAccount(fresh);
              setActiveSessionUser(fresh);
            }
          }
          showToast("User account profile updated in Firestore", "success");
        }}
        onDeleteUserAccount={async (userId) => {
          await deleteUserFromFirestore(userId).catch((e) => console.warn(e));
          await deleteUserOnBackend(userId).catch(() => {});
          await refreshAdminUsers();
          const accounts = loadRegisteredAccounts();
          setRegisteredAccounts(accounts);
          showToast("User account removed from Firestore", "info");
        }}
        onChangeAdminPassword={async (newPass) => {
          localStorage.setItem("inco_admin_master_password", newPass);
          const adminAcc = registeredAccounts.find(
            (a) => a.emailOrPhone.toLowerCase() === SUPER_ADMIN_EMAIL
          );
          if (adminAcc) {
            await updateUserOnBackend(adminAcc.id, { passwordHash: newPass });
          }
          const accounts = loadRegisteredAccounts();
          setRegisteredAccounts(accounts);
          showToast("Admin master password successfully changed!", "success");
        }}
        onShowToast={showToast}
      />

      <StockValuationModal
        isOpen={isStockValuationOpen}
        onClose={() => setIsStockValuationOpen(false)}
        items={items}
        settings={settings}
        onShowToast={showToast}
      />

      <WhatsAppOrderModal
        isOpen={isWhatsappOrderOpen}
        onClose={() => setIsWhatsappOrderOpen(false)}
        items={items}
        settings={settings}
        onShowToast={showToast}
      />

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => {
          setIsScannerOpen(false);
          setTargetItemForAssign(null);
        }}
        items={items}
        settings={settings}
        targetItemForAssign={targetItemForAssign}
        onUpdateQuantity={handleUpdateQuantity}
        onAssignBarcode={handleAssignBarcode}
      />

      <AuditModeModal
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        items={items}
        settings={settings}
        onApplyAudit={handleApplyAudit}
      />

      <QuickSaleModal
        isOpen={isQuickSaleOpen}
        onClose={() => setIsQuickSaleOpen(false)}
        items={items}
        settings={settings}
        onCompleteSale={handleCompleteSale}
      />

      <QuickRestockModal
        isOpen={isQuickRestockOpen}
        onClose={() => setIsQuickRestockOpen(false)}
        items={items}
        settings={settings}
        onCompleteRestock={handleCompleteRestock}
      />

      <SalesReportModal
        isOpen={isSalesReportOpen}
        onClose={() => setIsSalesReportOpen(false)}
        items={items}
        movements={movements}
        settings={settings}
        credits={credits}
        cashAtHand={cashAtHand}
      />

      <LowStockEmailModal
        isOpen={isLowStockEmailOpen}
        onClose={() => setIsLowStockEmailOpen(false)}
        items={items}
        settings={settings}
        userEmailOrPhone={userPhoneOrEmail}
        onSaveAlertEmail={(email) => {
          setSettings((prev) => ({ ...prev, alertEmail: email, autoEmailAlerts: true }));
          showToast(`Saved ${email} as default alert email address`);
        }}
        onShowToast={showToast}
      />

      <AIAssistantModal
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        items={items}
        settings={settings}
        onApplyParsedActions={handleApplyParsedActions}
        onImportPhotoItems={handleImportPhotoItems}
      />

      <StockHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        movements={movements}
        settings={settings}
        onClearHistory={() => setMovements([])}
      />

      <PrintableStockSheet
        isOpen={isPrintSheetOpen}
        onClose={() => setIsPrintSheetOpen(false)}
        items={items}
        settings={settings}
      />

      <InstallShortcutModal
        forceOpen={isInstallShortcutOpen}
        onClose={() => setIsInstallShortcutOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialTab={authInitialTab}
        currentUserAccount={currentAccount}
        onSuccessLogin={handleSuccessLogin}
        onLogout={handleLogout}
        onDeleteAccount={handleDeleteAccount}
        strictMode={!currentAccount}
      />

      <SalesSuccessOverlay
        isOpen={Boolean(saleSuccessInfo)}
        saleInfo={saleSuccessInfo}
        onClose={() => setSaleSuccessInfo(null)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        items={items}
        onSaveSettings={(newSettings) => {
          setSettings(newSettings);
          setDarkMode(Boolean(newSettings.darkMode));
          showToast("Settings saved!");
        }}
        onResetToSampleData={() => {
          setItems(INITIAL_INVENTORY);
          setMovements([]);
          showToast("Reset to starter multi-category inventory!");
        }}
        onExportCSV={handleExportCSV}
        onOpenLowStockEmailModal={() => setIsLowStockEmailOpen(true)}
      />
    </div>
  );
}

export default App;
