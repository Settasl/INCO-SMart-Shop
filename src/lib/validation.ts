import { z } from "zod";

// Business Schema
export const BusinessSchema = z.object({
  businessId: z.string().min(1).max(128),
  businessName: z.string().min(1).max(128).trim(),
  businessType: z.enum([
    "shop",
    "pharmacy",
    "boutique",
    "kiosk",
    "mini_mart",
    "supermarket",
    "electronics",
    "other",
  ]).default("shop"),
  ownerId: z.string().min(1).max(128),
  country: z.string().max(64).default("Liberia"),
  currency: z.string().min(1).max(16).default("LRD"),
  timezone: z.string().max(64).optional(),
  address: z.string().max(256).optional(),
  phone: z.string().max(32).optional(),
  email: z.string().email().max(256).optional().or(z.literal("")),
  status: z.enum(["active", "suspended", "archived"]).default("active"),
});

// Product Schema
export const ProductSchema = z.object({
  productId: z.string().min(1).max(128),
  businessId: z.string().min(1).max(128),
  name: z.string().min(1).max(128).trim(),
  category: z.string().min(1).max(64),
  unit: z.string().min(1).max(32),
  costPrice: z.number().min(0).max(10_000_000),
  sellingPrice: z.number().min(0).max(10_000_000),
  barcode: z.string().max(64).optional(),
  sku: z.string().max(64).optional(),
  reorderPoint: z.number().min(0).max(1_000_000).optional(),
});

// Inventory Item Schema
export const InventoryItemSchema = z.object({
  id: z.string().min(1).max(128),
  businessId: z.string().min(1).max(128).optional(),
  name: z.string().min(1).max(128).trim(),
  category: z.string().min(1).max(64),
  quantity: z.number().min(0).max(10_000_000),
  unit: z.string().min(1).max(32),
  reorderPoint: z.number().min(0).max(1_000_000).default(5),
  costPrice: z.number().min(0).max(10_000_000).default(0),
  sellingPrice: z.number().min(0).max(10_000_000).default(0),
  barcode: z.string().max(64).optional(),
  sku: z.string().max(64).optional(),
  location: z.string().max(128).optional(),
  notes: z.string().max(512).optional(),
  lastCountedAt: z.string().max(64).optional(),
});

// Stock Adjustment Schema
export const StockMovementSchema = z.object({
  id: z.string().min(1).max(128),
  businessId: z.string().min(1).max(128).optional(),
  itemId: z.string().min(1).max(128),
  itemName: z.string().min(1).max(128),
  type: z.enum([
    "count_set",
    "add_stock",
    "remove_stock",
    "sale",
    "sale_paid",
    "sale_credit",
    "credit_repayment",
    "restock",
    "audit",
  ]),
  delta: z.number().max(1_000_000).min(-1_000_000),
  newQuantity: z.number().min(0).max(10_000_000),
  timestamp: z.string().max(64),
  note: z.string().max(256).optional(),
});

// Sale Transaction Schema
export const SaleItemSchema = z.object({
  itemId: z.string().min(1).max(128),
  itemName: z.string().min(1).max(128),
  quantity: z.number().positive().max(100_000),
  unitPrice: z.number().min(0).max(10_000_000),
  costPrice: z.number().min(0).max(10_000_000).optional(),
  unit: z.string().max(32).optional(),
});

export const SaleTransactionSchema = z.object({
  id: z.string().min(1).max(128),
  businessId: z.string().min(1).max(128).optional(),
  items: z.array(SaleItemSchema).min(1),
  totalAmount: z.number().min(0).max(100_000_000),
  totalUnits: z.number().positive().max(100_000),
  paymentMethod: z.string().max(64).default("cash"),
  paymentStatus: z.enum(["paid", "partial", "unpaid"]).default("paid"),
  customerId: z.string().max(128).optional(),
  customerName: z.string().max(128).optional(),
  timestamp: z.string().max(64),
});

// Store Settings Schema
export const StoreSettingsSchema = z.object({
  storeName: z.string().min(1).max(128).trim(),
  currencySymbol: z.string().min(1).max(8),
  currencyCode: z.string().min(1).max(8),
  enableSound: z.boolean().default(true),
  lowStockAlerts: z.boolean().default(true),
  alertEmail: z.string().email().optional().or(z.literal("")),
  autoEmailAlerts: z.boolean().default(false),
  darkMode: z.boolean().default(true),
});

export type ValidatedProduct = z.infer<typeof ProductSchema>;
export type ValidatedInventoryItem = z.infer<typeof InventoryItemSchema>;
export type ValidatedStockMovement = z.infer<typeof StockMovementSchema>;
export type ValidatedSaleTransaction = z.infer<typeof SaleTransactionSchema>;
export type ValidatedStoreSettings = z.infer<typeof StoreSettingsSchema>;
