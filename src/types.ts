export type Category =
  | "Medicine & Healthcare"
  | "Shoes & Footwear"
  | "Clothing & Apparel"
  | "Electronics & Accessories"
  | "Groceries"
  | "Bags & Luggage"
  | "Beverages"
  | "Snacks & Confectionery"
  | "Grains & Staples"
  | "Household & Cleaning"
  | "Toiletries & Beauty"
  | "Dairy & Cold"
  | "Canned & Packaged"
  | "Kiosk & Airtime"
  | "Misc";

export type Unit =
  | "pcs"
  | "bottle"
  | "can"
  | "pack"
  | "carton"
  | "crate"
  | "bag"
  | "sachet"
  | "kg"
  | "box"
  | "loaf"
  | "roll"
  | "pair"
  | "strip"
  | "set";

export interface InventoryItem {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  unit: Unit;
  reorderPoint: number;
  costPrice: number;
  sellingPrice: number;
  barcode?: string;
  sku?: string;
  lastCountedAt: string; // ISO date string
  notes?: string;
  location?: string; // Shelf / Row location in store
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  type: "count_set" | "add_stock" | "remove_stock" | "sale" | "sale_paid" | "sale_credit" | "credit_repayment" | "restock" | "audit";
  delta: number; // e.g. +5 or -2
  newQuantity: number;
  timestamp: string; // ISO string
  note?: string;
}

export interface SaleItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  costPrice?: number;
  unit?: string;
}

export interface PaymentEntry {
  id: string;
  amount: number;
  date: string;
  note?: string;
  receivedBy?: string;
}

export type PaymentStatus = "paid" | "unpaid" | "partial";

export interface CreditRecord {
  id: string;
  customerName: string;
  customerPhone?: string;
  totalAmount: number;
  amountPaid: number;          // Cash received upfront at hand
  amountOutstanding: number;   // Cash out on credit (totalAmount - amountPaid)
  status: PaymentStatus;
  date: string;                // ISO date when credited
  createdAt?: string;
  dueDate?: string;            // ISO date or note when payment is expected
  items: SaleItem[];
  notes?: string;
  paymentHistory: PaymentEntry[];
}

export interface AuditRecord {
  itemId: string;
  expectedQuantity: number;
  countedQuantity: number;
  notes?: string;
}

export interface AuditSession {
  id: string;
  title: string;
  dateStarted: string;
  dateCompleted?: string;
  status: "in_progress" | "completed";
  records: Record<string, AuditRecord>; // key is itemId
}

export interface StoreSettings {
  storeName: string;
  currencySymbol: string;
  currencyCode: string;
  enableSound: boolean;
  lowStockAlerts: boolean;
  alertEmail?: string;
  autoEmailAlerts?: boolean;
  darkMode?: boolean;
}

export interface ParsedAIAction {
  actionType: "count" | "add_stock" | "remove_stock" | "new_item";
  itemName: string;
  quantity: number;
  category: Category;
  unit: Unit;
  confidence?: number;
  explanation?: string;
}

export interface DetectedAIPhotoItem {
  name: string;
  category: Category;
  estimatedQuantity: number;
  unit: Unit;
  estimatedCostPrice?: number;
  estimatedSellingPrice?: number;
  barcode?: string;
  notes?: string;
}

export type BusinessRole =
  | "owner"
  | "admin"
  | "manager"
  | "cashier"
  | "inventory_manager"
  | "accountant"
  | "staff"
  | "auditor"
  | "super_admin";

export type BusinessType =
  | "shop"
  | "pharmacy"
  | "boutique"
  | "kiosk"
  | "mini_mart"
  | "supermarket"
  | "electronics"
  | "other";

export interface Business {
  businessId: string;
  businessName: string;
  name?: string; // Convenient alias for businessName
  businessType: BusinessType;
  ownerId: string;
  country?: string;
  currency: string;
  timezone?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  status: "active" | "suspended" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface BusinessMember {
  uid: string;
  businessId: string;
  role: BusinessRole;
  status: "active" | "invited" | "suspended" | "revoked";
  email?: string;
  displayName?: string;
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  productId: string;
  businessId: string;
  name: string;
  category: Category;
  unit: Unit;
  costPrice: number;
  sellingPrice: number;
  barcode?: string;
  sku?: string;
  reorderPoint?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string; // Firebase Auth UID
  uid?: string; // Explicit alias for Firebase UID
  identifier: string; // phone or email
  displayName: string;
  avatarUrl: string;
  activeBusinessId?: string;
  role: "admin" | "owner" | "manager" | "cashier" | "user" | BusinessRole;
  isVerified: boolean;
  verificationStatus: "none" | "pending" | "approved" | "rejected";
  accountStatus?: "active" | "pending_approval" | "suspended" | "blocked" | "rejected";
  suspensionReason?: string;
  suspensionDate?: string;
  userAppealReason?: string;
  appealSubmittedAt?: string;
  lastProfileUpdatedAt?: string;
  storeName?: string;
  location?: string;
  encryptedHealthVault?: {
    ciphertext: string;
    salt: string;
    iv: string;
    lastUpdated: string;
    isConfigured: boolean;
  };
  verificationDocs?: {
    legalName?: string;
    idType?: "National ID" | "Passport" | "Driver's License" | "Voter Card";
    idNumber?: string;
    passportPhotoUrl?: string;
    idDocUrl?: string;
    submittedAt?: string;
    reviewedAt?: string;
    adminNotes?: string;
  };
  subscription: {
    plan: "Free Starter" | "INCO Pro Smartshop" | "INCO Pro AI" | "Enterprise Cloud" | "Lifetime Kiosk";
    status: "free" | "pending_approval" | "active" | "expired";
    paymentMethod?: string;
    transactionRef?: string;
    amount?: number;
    currency?: string;
    submittedAt?: string;
    approvedAt?: string;
    validUntil?: string;
  };
  createdAt: string;
}

export interface LoginApprovalRequest {
  id: string;
  userId: string;
  userName: string;
  userEmailOrPhone: string;
  requestedRole: "owner" | "manager" | "cashier" | "user";
  storeName: string;
  deviceInfo?: string;
  ipAddress?: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export type LoginRequest = LoginApprovalRequest;

export interface PaymentRequest {
  id: string;
  userId: string;
  userName: string;
  userEmailOrPhone: string;
  userAvatar?: string;
  planName: "INCO Pro Smartshop" | "INCO Pro AI" | "Enterprise Cloud" | "Lifetime Kiosk" | string;
  amount: number;
  currency: string;
  paymentMethod: "Mobile Money (M-Pesa/MTN)" | "Credit/Debit Card" | "Bank Transfer" | "Crypto (USDT/BTC)" | "Cash at Counter";
  transactionRef: string;
  proofUrl?: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminNotes?: string;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  userName: string;
  userEmailOrPhone: string;
  legalName: string;
  idType: "National ID" | "Passport" | "Driver's License" | "Voter Card";
  idNumber: string;
  passportPhotoUrl: string;
  idDocUrl: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminNotes?: string;
}

export interface SystemAnnouncement {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "maintenance";
  createdAt: string;
  createdBy: string;
  active: boolean;
  priority: "normal" | "urgent";
}

export interface AdminAuditLog {
  id: string;
  action: string;
  adminId: string;
  adminName: string;
  targetId?: string;
  targetName?: string;
  details: string;
  timestamp: string;
  category: "auth" | "kyc" | "payment" | "users" | "settings" | "announcement";
}

export type AuditLogEntry = AdminAuditLog;

export interface ChatMessage {
  id: string;
  channelId: string; // "general" | "support" | "admin" | "announcements"
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole: "admin" | "user" | "owner" | "support";
  isVerified?: boolean;
  content: string;
  imageUrl?: string;
  audioUrl?: string;
  timestamp: string; // ISO string
  status: "sent" | "delivered" | "read";
}
