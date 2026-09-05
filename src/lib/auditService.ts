import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./firebase";
import { AuditLogEntry } from "../types";

export interface AuditActionParams {
  businessId: string;
  actorUid: string;
  action: string;
  entityType: "auth" | "business" | "member" | "product" | "inventory" | "sale" | "customer" | "setting";
  entityId?: string;
  details: string;
  metadata?: Record<string, unknown>;
}

/**
 * Creates an immutable audit log record in Firestore for a business tenant
 */
export async function logAuditEvent(params: AuditActionParams): Promise<string | null> {
  const { businessId, actorUid, action, entityType, entityId, details, metadata } = params;
  if (!businessId || !actorUid) {
    console.warn("[Audit] Missing businessId or actorUid; skipping cloud audit log");
    return null;
  }

  const path = `businesses/${businessId}/auditLogs`;
  try {
    const docRef = await addDoc(collection(db, path), {
      businessId,
      actorUid,
      action,
      entityType,
      entityId: entityId || null,
      details,
      metadata: metadata || null,
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return null;
  }
}

/**
 * Universal helper to record structured audit logs across business actions
 */
export async function recordAuditLog(params: {
  businessId: string;
  userId: string;
  userEmail?: string;
  action: string;
  entityType: "auth" | "business" | "member" | "product" | "inventory" | "sale" | "customer" | "setting" | string;
  entityId?: string;
  previousData?: unknown;
  newData?: unknown;
  details?: string;
}): Promise<string | null> {
  const validTypes = ["auth", "business", "member", "product", "inventory", "sale", "customer", "setting"];
  const safeEntityType = (validTypes.includes(params.entityType)
    ? params.entityType
    : "inventory") as AuditActionParams["entityType"];

  return logAuditEvent({
    businessId: params.businessId,
    actorUid: params.userId,
    action: params.action,
    entityType: safeEntityType,
    entityId: params.entityId,
    details: params.details || `${params.action} on ${params.entityType} ${params.entityId || ""}`.trim(),
    metadata: {
      userEmail: params.userEmail,
      previousData: params.previousData,
      newData: params.newData,
    },
  });
}
