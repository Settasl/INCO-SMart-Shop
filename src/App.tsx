import React, { useState, useEffect, useMemo, useRef } from "react";
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
import { MobileBottomNav } from "./components/MobileBottomNav";
import { ChatModal } from "./components/ChatModal";
import { ProfileModal } from "./components/ProfileModal";
import { AdminPortalModal } from "./components/AdminPortalModal";
import { SubscriptionModal } from "./components/SubscriptionModal";
import { ToolsPageView } from "./components/ToolsPageView";
import { SalesSuccessOverlay, SaleSuccessInfo } from "./components/SalesSuccessOverlay";
import { SalePaymentDetails } from "./components/QuickSaleModal";
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
} from "./lib/firebase";
import { useAuth } from "./context/AuthContext";
import { useBusiness } from "./context/BusinessContext";
import { recordAuditLog } from "./lib/auditService";

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "INCO Smart Shop",
  currencySymbol: "L$",
  currencyCode: "LRD",
  enableSound: true,
  lowStockAlerts: true,
  autoEmailAlerts: true,
  darkMode: true,
};

const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: "chat-1",
    channelId: "support",
    senderId: "inco-support-desk",
    senderName: "INCO Support Headphone Desk",
    senderAvatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    senderRole: "admin",
    isVerified: true,
    content:
      "Welcome to INCO Smart Shop Customer Service! 🎧 Our live support team and assistant are ready 24/7. How can we assist your store counter today?",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    status: "delivered",
  },
  {
    id: "chat-2",
    channelId: "support",
    senderId: "merchant-sarah",
    senderName: "Sarah's Mini Mart",
    senderAvatar:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
    senderRole: "user",
    isVerified: true,
    content:
      "Hey store owners! Just got my KYC approved by INCO admin. Fast barcode scanning has sped up our morning restocks immensely! 🚀",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    status: "delivered",
  },
];

const INITIAL_PAYMENT_REQUESTS: PaymentRequest[] = [
  {
    id: "pay-req-1",
    userId: "usr-david-01",
    userEmailOrPhone: "david.retail@inco.app",
    userName: "David Retail Kiosk",
    planName: "INCO Pro AI",
    amount: 4.99,
    currency: "USD",
    paymentMethod: "Mobile Money (M-Pesa/MTN)",
    transactionRef: "OM-883921",
    status: "pending",
    submittedAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "pay-req-2",
    userId: "usr-fatou-02",
    userEmailOrPhone: "+231778901234",
    userName: "Fatou Provisions",
    planName: "INCO Pro AI",
    amount: 4.99,
    currency: "USD",
    paymentMethod: "Mobile Money (M-Pesa/MTN)",
    transactionRef: "MOMO-449102",
    status: "pending",
    submittedAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

const INITIAL_VERIFICATION_REQUESTS: VerificationRequest[] = [
  {
    id: "ver-req-1",
    userId: "usr-david-01",
    userEmailOrPhone: "david.retail@inco.app",
    userName: "David Retail Kiosk",
    legalName: "David Retail Enterprises",
    idType: "National ID",
    idNumber: "BP-MONROVIA-2025-99",
    passportPhotoUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    idDocUrl:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=80",
    status: "pending",
    submittedAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

export function App() {
  const { user: fbUser, signOut: fbSignOut } = useAuth();
  const { activeBusinessId, activeBusiness, userRole, canEdit, canAdmin } = useBusiness();

  // Navigation & Page State ("stock" | "valuation" | "reports" | "suppliers" | "tools")
  const [activeView, setActiveView] = useState<string>("stock");
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    return !localStorage.getItem("inco_splash_dismissed");
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
      const email = fbUser.email || "merchant@inco.app";
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

  // Inventory & Store State
  const [items, setItems] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem("inco_inventory_items");
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });

  const [movements, setMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem("inco_stock_movements");
    return saved ? JSON.parse(saved) : [];
  });

  const [credits, setCredits] = useState<CreditRecord[]>(() => {
    const saved = localStorage.getItem("inco_credit_records");
    return saved ? JSON.parse(saved) : INITIAL_CREDIT_RECORDS;
  });

  const [cashAtHand, setCashAtHand] = useState<number>(() => {
    const saved = localStorage.getItem("inco_cash_at_hand");
    return saved ? parseFloat(saved) : 1450.0;
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem("inco_store_settings");
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("inco_dark_mode");
    if (saved !== null) return JSON.parse(saved);
    return true; // Default dark mode for vibrant yellow & black theme
  });

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

  // Community Chat & Back-office State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("inco_chat_messages");
    return saved ? JSON.parse(saved) : INITIAL_CHAT_MESSAGES;
  });

  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>(() => {
    const saved = localStorage.getItem("inco_payment_requests");
    return saved ? JSON.parse(saved) : INITIAL_PAYMENT_REQUESTS;
  });

  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>(() => {
    const saved = localStorage.getItem("inco_verification_requests");
    return saved ? JSON.parse(saved) : INITIAL_VERIFICATION_REQUESTS;
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
    localStorage.setItem("inco_inventory_items", JSON.stringify(items));
    if (activeBusinessId) {
      syncItemsToBusinessFirestore(activeBusinessId, items).catch(() => {});
    } else if (userPhoneOrEmail) {
      syncItemsToFirestore(userPhoneOrEmail, items);
    }
  }, [items, activeBusinessId, userPhoneOrEmail]);

  useEffect(() => {
    localStorage.setItem("inco_stock_movements", JSON.stringify(movements));
  }, [movements]);

  useEffect(() => {
    localStorage.setItem("inco_credit_records", JSON.stringify(credits));
  }, [credits]);

  useEffect(() => {
    localStorage.setItem("inco_cash_at_hand", cashAtHand.toString());
  }, [cashAtHand]);

  useEffect(() => {
    localStorage.setItem("inco_store_settings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem("inco_dark_mode", JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("inco_chat_messages", JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    localStorage.setItem("inco_payment_requests", JSON.stringify(paymentRequests));
  }, [paymentRequests]);

  useEffect(() => {
    localStorage.setItem("inco_verification_requests", JSON.stringify(verificationRequests));
  }, [verificationRequests]);

  // Initial and reactive sync of registered users with the backend database
  useEffect(() => {
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
      setRegisteredAccounts(loadRegisteredAccounts());
    };
    window.addEventListener("inco:users-updated", handleRemoteUsersUpdate);

    // 3. Sync whenever connectivity comes online
    const handleOnline = () => {
      syncUsersWithServer()
        .then((synced) => {
          if (Array.isArray(synced) && synced.length > 0) {
            setRegisteredAccounts(synced);
          }
        })
        .catch(() => {});
    };
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("inco:users-updated", handleRemoteUsersUpdate);
      window.removeEventListener("online", handleOnline);
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
    setIsAuthOpen(false);
    showToast(`Welcome back, ${account.displayName || account.emailOrPhone}!`, "success");
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
  const handleUpdateProfile = (updates: Partial<UserProfile>) => {
    if (!currentAccount) return;
    const updatedAccount: RegisteredAccount = {
      ...currentAccount,
      displayName: updates.displayName || currentAccount.displayName,
      storeName: updates.storeName || currentAccount.storeName,
      avatarUrl: updates.avatarUrl || currentAccount.avatarUrl,
    };

    const accounts = registeredAccounts.map((a) =>
      a.id === currentAccount.id ? updatedAccount : a
    );
    saveRegisteredAccounts(accounts);
    setRegisteredAccounts(accounts);
    setCurrentAccount(updatedAccount);
    setActiveSessionUser(updatedAccount);

    if (updates.storeName) {
      setSettings((prev) => ({ ...prev, storeName: updates.storeName! }));
    }
    showToast("Profile information updated successfully!", "success");
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
    showToast(`Deleted ${count} items from inventory in batch!`);
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
      recordAuditLog({
        businessId: activeBusinessId,
        userId: fbUser?.uid || "user",
        userEmail: fbUser?.email || "user",
        action: "SALE",
        entityType: "sale",
        entityId: "sale-" + Date.now(),
        newData: {
          totalAmount,
          cashCollected,
          customerName: paymentDetails?.customerName || "Walk-in",
          itemCount: cart.length,
        },
      }).catch(() => {});
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
        darkMode ? "dark bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-950"
      } font-sans antialiased flex flex-col selection:bg-amber-400 selection:text-slate-950 transition-colors duration-200`}
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

      {/* Top Header: Dark Background with Yellow & White Icons, Texts, Buttons & Navigation Links */}
      <Header
        activeView={activeView}
        onSelectView={setActiveView}
        settings={settings}
        userPhoneOrEmail={userPhoneOrEmail}
        userProfile={userProfile}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenScanner={() => {
          setTargetItemForAssign(null);
          setIsScannerOpen(true);
        }}
        onOpenNotifications={() => setIsChatOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenToolsDrawer={() => setActiveView("tools")}
        onToggleDarkMode={handleToggleDarkMode}
        darkMode={darkMode}
      />

      {/* Toast Notification Banner */}
      {toast && (
        <div
          role="status"
          className="fixed top-16 right-4 z-50 bg-slate-950 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-xl border border-amber-400 animate-in fade-in slide-in-from-top-2 duration-200 flex items-center gap-2 max-w-md"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0 animate-ping" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Multi-Page Canvas Area */}
      <main className="flex-1 p-3 sm:p-5 lg:p-6 space-y-4 max-w-7xl w-full mx-auto pb-24 md:pb-8">
        {/* PAGE 1: STOCK (HOME) - Per user requirement: Only Header, Quick Sales, and Products */}
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
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAdminPortal={() => setIsAdminPortalOpen(true)}
        onOpenSubscription={() => setIsSubscriptionOpen(true)}
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
        allUsers={registeredAccounts.map(convertAccountToUserProfile)}
        onRefreshUsers={async () => {
          const fresh = await syncUsersWithServer();
          if (Array.isArray(fresh) && fresh.length > 0) {
            setRegisteredAccounts(fresh);
          }
        }}
        onApprovePayment={handleApprovePayment}
        onRejectPayment={handleRejectPayment}
        onApproveVerification={handleApproveVerification}
        onRejectVerification={handleRejectVerification}
        onUpdateUserAccount={async (userId, updates) => {
          await updateUserOnBackend(userId, updates as any);
          const accounts = loadRegisteredAccounts();
          setRegisteredAccounts(accounts);
          if (currentAccount?.id === userId) {
            const fresh = accounts.find((a) => a.id === userId);
            if (fresh) {
              setCurrentAccount(fresh);
              setActiveSessionUser(fresh);
            }
          }
          showToast("User account profile updated by Admin", "success");
        }}
        onDeleteUserAccount={async (userId) => {
          await deleteUserOnBackend(userId);
          const accounts = loadRegisteredAccounts();
          setRegisteredAccounts(accounts);
          showToast("User account removed by Admin", "info");
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
