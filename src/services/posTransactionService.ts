import {
  doc,
  runTransaction,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import {
  InventoryItem,
  SaleItem,
  SaleRecord,
  StockMovement,
  PaymentStatus,
  CashTransaction,
} from "../types";

export interface PosCheckoutItemInput {
  itemId: string;
  quantity: number;
  // Optional client hint; price will be authoritatively checked against Firestore product document
  unitPriceHint?: number;
}

export interface PosCheckoutRequest {
  saleId: string; // Idempotency key
  businessId: string;
  items: PosCheckoutItemInput[];
  paymentMethod: "Cash at Hand" | "Mobile Money (M-Pesa/MTN)" | "Credit / Pay Later" | "Card" | string;
  amountPaid: number;
  paymentStatus: PaymentStatus;
  customerId?: string;
  customerName?: string;
  notes?: string;
  taxRate?: number; // e.g. 0.05 for 5% tax or store setting
  allowNegativeStock?: boolean;
}

export interface PosCheckoutResult {
  success: boolean;
  saleId: string;
  saleRecord: SaleRecord;
  movements: StockMovement[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  changeDue: number;
  cashCollected: number;
}

/**
 * Authoritative Point-of-Sale transaction engine.
 * Guarantees atomicity across:
 * - Product inventory verification & decrements
 * - Stock movement ledger entry
 * - Immutable sales record
 * - Cash ledger transaction
 * - Customer credit account update
 * - Business audit log
 */
export async function executePosSaleTransaction(
  request: PosCheckoutRequest
): Promise<PosCheckoutResult> {
  const { businessId, saleId, items, paymentMethod, paymentStatus } = request;

  if (!businessId) {
    throw new Error("A valid businessId is required for POS transaction.");
  }
  if (!saleId) {
    throw new Error("A unique saleId (idempotency key) is required.");
  }
  if (!items || items.length === 0) {
    throw new Error("Cannot checkout an empty cart.");
  }

  const currentUser = auth.currentUser;
  const cashierUid = currentUser?.uid || "unassigned_cashier";
  const cashierEmail = currentUser?.email || "cashier@inco.app";
  const now = new Date().toISOString();
  const taxRate = typeof request.taxRate === "number" ? Math.max(0, request.taxRate) : 0;

  // Execute atomic multi-document transaction
  const result = await runTransaction(db, async (transaction) => {
    // 1. Idempotency Check: verify if sale already exists
    const saleRef = doc(db, "businesses", businessId, "sales", saleId);
    const existingSaleSnap = await transaction.get(saleRef);
    if (existingSaleSnap.exists()) {
      const data = existingSaleSnap.data() as SaleRecord;
      return {
        alreadyExecuted: true,
        saleRecord: data,
        subtotal: data.totalAmount / (1 + taxRate),
        taxAmount: data.totalAmount - data.totalAmount / (1 + taxRate),
        totalAmount: data.totalAmount,
        movements: [],
      };
    }

    // 2. Pre-read and validate every product document authoritatively from Firestore
    interface ValidatedItem {
      docRef: any;
      itemData: InventoryItem;
      requestedQty: number;
      authoritativePrice: number;
      lineSubtotal: number;
    }

    const validatedItems: ValidatedItem[] = [];
    let calculatedSubtotal = 0;
    let totalUnits = 0;

    for (const reqItem of items) {
      if (reqItem.quantity <= 0) {
        throw new Error(`Invalid quantity ${reqItem.quantity} for item ${reqItem.itemId}`);
      }

      const itemRef = doc(db, "businesses", businessId, "inventory", reqItem.itemId);
      const itemSnap = await transaction.get(itemRef);

      if (!itemSnap.exists()) {
        throw new Error(`Product with ID "${reqItem.itemId}" was not found in store inventory.`);
      }

      const itemData = itemSnap.data() as InventoryItem;
      const currentQty = Number(itemData.quantity) || 0;

      // Authoritative selling price from database, strictly preventing client manipulation
      const authoritativePrice = Number(itemData.sellingPrice) || 0;
      if (authoritativePrice < 0) {
        throw new Error(`Item "${itemData.name}" has an invalid negative price.`);
      }

      // Concurrency & negative stock check
      if (!request.allowNegativeStock && currentQty < reqItem.quantity) {
        throw new Error(
          `Insufficient stock for "${itemData.name}". Available: ${currentQty}, Requested: ${reqItem.quantity}.`
        );
      }

      const lineSubtotal = authoritativePrice * reqItem.quantity;
      calculatedSubtotal += lineSubtotal;
      totalUnits += reqItem.quantity;

      validatedItems.push({
        docRef: itemRef,
        itemData,
        requestedQty: reqItem.quantity,
        authoritativePrice,
        lineSubtotal,
      });
    }

    // Compute authoritative tax and total
    const calculatedTax = calculatedSubtotal * taxRate;
    const authoritativeTotal = Math.round((calculatedSubtotal + calculatedTax) * 100) / 100;
    const amountPaid = Math.max(0, Number(request.amountPaid) || 0);
    const changeDue = Math.max(0, amountPaid - authoritativeTotal);
    const cashCollected = paymentMethod === "Credit / Pay Later" ? 0 : Math.min(amountPaid, authoritativeTotal);

    const createdMovements: StockMovement[] = [];
    const authoritativeSaleItems: SaleItem[] = [];

    // 3. Atomically decrement inventory and write stock movement ledgers
    for (const { docRef, itemData, requestedQty, authoritativePrice } of validatedItems) {
      const prevQty = Number(itemData.quantity) || 0;
      const nextQty = Math.max(0, prevQty - requestedQty);

      transaction.update(docRef, {
        quantity: nextQty,
        lastCountedAt: now,
        updatedAt: now,
      });

      const movementId = `mov_${saleId}_${itemData.id}`;
      const movementRef = doc(db, "businesses", businessId, "stockMovements", movementId);
      const movementData: StockMovement = {
        id: movementId,
        itemId: itemData.id,
        itemName: itemData.name,
        type: paymentStatus === "unpaid" ? "sale_credit" : "sale",
        delta: -requestedQty,
        newQuantity: nextQty,
        timestamp: now,
        note: `POS Sale #${saleId.slice(0, 8)} (${paymentMethod}) to ${request.customerName || "Walk-in"}`,
      };

      transaction.set(movementRef, {
        ...movementData,
        businessId,
        actorUid: cashierUid,
        createdAt: serverTimestamp(),
      });

      createdMovements.push(movementData);

      authoritativeSaleItems.push({
        itemId: itemData.id,
        itemName: itemData.name,
        quantity: requestedQty,
        unitPrice: authoritativePrice,
        costPrice: itemData.costPrice || 0,
        unit: itemData.unit,
      });
    }

    // 4. Create authoritative SaleRecord
    const saleRecord: SaleRecord = {
      id: saleId,
      businessId,
      cashierUid,
      totalAmount: authoritativeTotal,
      totalUnits,
      items: authoritativeSaleItems,
      paymentMethod,
      paymentStatus,
      customerId: request.customerId,
      customerName: request.customerName || "Walk-in Cash Customer",
      timestamp: now,
      notes: request.notes,
    };

    transaction.set(saleRef, {
      ...saleRecord,
      subtotal: calculatedSubtotal,
      taxAmount: calculatedTax,
      amountPaid,
      changeDue,
      createdAt: serverTimestamp(),
    });

    // 5. If cash was collected, write cash ledger transaction
    if (cashCollected > 0 && paymentMethod.toLowerCase().includes("cash")) {
      const cashTxId = `cash_${saleId}`;
      const cashTxRef = doc(db, "businesses", businessId, "cashTransactions", cashTxId);
      const cashTx: CashTransaction = {
        id: cashTxId,
        businessId,
        type: "cash_in",
        amount: cashCollected,
        reason: `POS Sale #${saleId.slice(0, 8)} - ${request.customerName || "Walk-in"}`,
        timestamp: now,
        recordedBy: cashierUid,
      };
      transaction.set(cashTxRef, {
        ...cashTx,
        saleId,
        createdAt: serverTimestamp(),
      });
    }

    // 6. If credit or partial sale, update/create customer credit account
    if (paymentStatus !== "paid" && request.customerName) {
      const customerId = request.customerId || `cust_${Date.now()}`;
      const custRef = doc(db, "businesses", businessId, "customers", customerId);
      const outstanding = Math.max(0, authoritativeTotal - amountPaid);

      transaction.set(
        custRef,
        {
          id: customerId,
          businessId,
          customerName: request.customerName,
          amountOutstanding: outstanding,
          updatedAt: now,
        },
        { merge: true }
      );
    }

    // 7. Write immutable audit log
    const auditLogId = `audit_${saleId}`;
    const auditRef = doc(db, "businesses", businessId, "auditLogs", auditLogId);
    transaction.set(auditRef, {
      id: auditLogId,
      businessId,
      actorUid: cashierUid,
      actorEmail: cashierEmail,
      action: "POS_SALE_COMPLETED",
      entityType: "sale",
      entityId: saleId,
      metadata: {
        totalAmount: authoritativeTotal,
        totalUnits,
        itemCount: validatedItems.length,
        paymentMethod,
        paymentStatus,
      },
      timestamp: serverTimestamp(),
    });

    return {
      alreadyExecuted: false,
      saleRecord,
      subtotal: calculatedSubtotal,
      taxAmount: calculatedTax,
      totalAmount: authoritativeTotal,
      movements: createdMovements,
      amountPaid,
      changeDue,
      cashCollected,
    };
  });

  return {
    success: true,
    saleId: result.saleRecord.id,
    saleRecord: result.saleRecord,
    movements: result.movements,
    subtotal: result.subtotal,
    taxAmount: result.taxAmount,
    totalAmount: result.totalAmount,
    amountPaid: result.amountPaid ?? request.amountPaid,
    changeDue: result.changeDue ?? 0,
    cashCollected: result.cashCollected ?? 0,
  };
}
