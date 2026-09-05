import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  signInWithCredential,
  User,
} from "firebase/auth";
import { requestGoogleProfileGIS } from "./googleAuth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  deleteDoc,
  serverTimestamp,
  getDocFromServer,
  writeBatch,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import {
  Business,
  BusinessMember,
  InventoryItem,
  StockMovement,
  CreditRecord,
  SaleItem,
} from "../types";

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Test connection on startup per Firebase architecture standards
async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("[Firebase] Offline client mode detected or Firestore waiting for initial connection.");
    }
  }
}
testFirestoreConnection();

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
}

// ============================================================================
// FIREBASE AUTHENTICATION API
// ============================================================================

export async function signUpWithEmail(
  email: string,
  pass: string,
  displayName: string
): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  if (displayName.trim()) {
    await updateProfile(cred.user, { displayName: displayName.trim() });
  }

  // Create base user record
  const userDocRef = doc(db, "users", cred.user.uid);
  await setDoc(
    userDocRef,
    {
      uid: cred.user.uid,
      email: cred.user.email,
      displayName: displayName.trim() || cred.user.email?.split("@")[0] || "Merchant",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  return cred.user;
}

export async function signInWithEmail(email: string, pass: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return cred.user;
}

export async function syncUserFirestoreRecord(
  user: User,
  email: string,
  displayName?: string,
  photoURL?: string
): Promise<void> {
  const isSuperAdmin = email.toLowerCase() === "settaholdings@gmail.com";
  const userDocRef = doc(db, "users", user.uid);
  await setDoc(
    userDocRef,
    {
      uid: user.uid,
      email: user.email || email,
      displayName: displayName || user.displayName || (isSuperAdmin ? "INCO Master Admin (Setta SL)" : email.split("@")[0]),
      photoURL: photoURL || user.photoURL || (isSuperAdmin ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=140&auto=format&fit=crop&q=80" : null),
      role: isSuperAdmin ? "admin" : "merchant",
      isVerified: true,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function signInWithGoogleEmail(googleEmail: string, displayName?: string): Promise<User> {
  const email = googleEmail.trim().toLowerCase();
  
  // First attempt: Try Google Identity Services OAuth
  try {
    return await signInWithGoogle(email);
  } catch (gisErr: any) {
    console.warn("[Firebase] Direct Google Auth fallback:", gisErr?.message);
    throw gisErr;
  }
}

export async function signInWithGoogle(hintEmail?: string): Promise<User> {
  // Method 1: Google Identity Services (GIS) OAuth popup (Works directly in sandboxed iframes)
  try {
    const googleProfile = await requestGoogleProfileGIS(hintEmail);
    if (googleProfile.accessToken) {
      try {
        const credential = GoogleAuthProvider.credential(googleProfile.idToken || null, googleProfile.accessToken);
        const cred = await signInWithCredential(auth, credential);
        await syncUserFirestoreRecord(cred.user, cred.user.email || googleProfile.email, googleProfile.name, googleProfile.photoURL);
        return cred.user;
      } catch (credErr: any) {
        console.warn("[Firebase] signInWithCredential status:", credErr?.code, credErr?.message);
        if (credErr?.code === "auth/account-exists-with-different-credential") {
          throw new Error("This email was registered with a password. Please enter your password to sign in, or click 'Forgot password' to reset it.");
        }
        throw credErr;
      }
    }
  } catch (gisErr: unknown) {
    const gError = gisErr as { message?: string };
    const gisMsg = gError?.message || "";
    if (gisMsg.includes("closed") || gisMsg.includes("cancelled") || gisMsg.includes("dismissed")) {
      throw new Error("Google sign in was cancelled.");
    }
    console.warn("[Firebase] GIS prompt note, trying standard popup:", gisMsg);
  }

  // Method 2: Standard Firebase popup
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    await syncUserFirestoreRecord(
      cred.user,
      cred.user.email || "",
      cred.user.displayName || undefined,
      cred.user.photoURL || undefined
    );
    return cred.user;
  } catch (popupErr: unknown) {
    const error = popupErr as { code?: string; message?: string };
    console.warn("[Firebase] Google popup notification:", error?.code, error?.message);
    
    const errCode = error?.code || "";
    if (errCode === "auth/unauthorized-domain") {
      throw new Error("Google Sign-In popup requires domain authorization. Please select your Google account from the Google prompt.");
    }
    if (errCode === "auth/popup-blocked") {
      throw new Error("Google sign in popup was blocked by browser. Please allow popups for this site.");
    }
    throw popupErr;
  }
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function signOutUser(): Promise<void> {
  await fbSignOut(auth);
}

// ============================================================================
// MULTI-TENANT BUSINESS SERVICES
// ============================================================================

/**
 * Creates a new business tenant and assigns the creator as the Owner
 */
export async function createTenantBusiness(
  ownerUid: string,
  details: {
    businessName: string;
    businessType?: Business["businessType"];
    currency?: string;
    country?: string;
    phone?: string;
    email?: string;
    address?: string;
  }
): Promise<{ business: Business; member: BusinessMember }> {
  const businessId = `biz_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  const business: Business = {
    businessId,
    businessName: details.businessName.trim() || "My Store",
    businessType: details.businessType || "shop",
    ownerId: ownerUid,
    currency: details.currency || "LRD",
    country: details.country || "Liberia",
    phone: details.phone || "",
    email: details.email || auth.currentUser?.email || "",
    address: details.address || "",
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  const member: BusinessMember = {
    uid: ownerUid,
    businessId,
    role: "owner",
    status: "active",
    email: auth.currentUser?.email || undefined,
    displayName: auth.currentUser?.displayName || "Store Owner",
    permissions: ["all"],
    createdAt: now,
    updatedAt: now,
  };

  try {
    const batch = writeBatch(db);
    // 1. Business document
    batch.set(doc(db, "businesses", businessId), business);
    // 2. Owner membership document
    batch.set(doc(db, "businesses", businessId, "members", ownerUid), member);
    // 3. Update user's active business
    batch.set(doc(db, "users", ownerUid), { activeBusinessId: businessId, updatedAt: now }, { merge: true });

    await batch.commit();
    return { business, member };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `businesses/${businessId}`);
    throw error;
  }
}

/**
 * Fetches a business and verifies that the current user is an authorized member
 */
export async function getTenantBusiness(
  businessId: string,
  uid: string
): Promise<{ business: Business | null; member: BusinessMember | null }> {
  try {
    const memberDoc = await getDoc(doc(db, "businesses", businessId, "members", uid));
    if (!memberDoc.exists()) {
      return { business: null, member: null };
    }
    const businessDoc = await getDoc(doc(db, "businesses", businessId));
    if (!businessDoc.exists()) {
      return { business: null, member: null };
    }
    return {
      business: businessDoc.data() as Business,
      member: memberDoc.data() as BusinessMember,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `businesses/${businessId}`);
    return { business: null, member: null };
  }
}

// ============================================================================
// TENANT DATA PERSISTENCE (SCOPED TO BUSINESS)
// ============================================================================

export async function syncItemsToBusinessFirestore(businessId: string, items: InventoryItem[]) {
  if (!businessId || !items.length) return;
  try {
    const batch = writeBatch(db);
    for (const item of items) {
      const docRef = doc(db, "businesses", businessId, "inventory", item.id);
      batch.set(docRef, { ...item, businessId, updatedAt: new Date().toISOString() }, { merge: true });
    }
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `businesses/${businessId}/inventory`);
  }
}

export async function saveSaleToBusinessFirestore(
  businessId: string,
  saleRecord: {
    id: string;
    totalAmount: number;
    totalUnits: number;
    items: SaleItem[];
    paymentMethod?: string;
    paymentStatus?: string;
    customerId?: string;
    timestamp: string;
  }
) {
  if (!businessId) return;
  const path = `businesses/${businessId}/sales`;
  try {
    const docRef = doc(db, path, saleRecord.id);
    await setDoc(docRef, {
      ...saleRecord,
      businessId,
      cashierUid: auth.currentUser?.uid || "unassigned",
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveItemToBusinessFirestore(businessId: string, item: InventoryItem): Promise<void> {
  if (!businessId || !item?.id) return;
  const path = `businesses/${businessId}/inventory`;
  try {
    const docRef = doc(db, path, item.id);
    await setDoc(docRef, { ...item, businessId, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${item.id}`);
  }
}

export async function deleteItemFromBusinessFirestore(businessId: string, itemId: string): Promise<void> {
  if (!businessId || !itemId) return;
  const path = `businesses/${businessId}/inventory`;
  try {
    const docRef = doc(db, path, itemId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${path}/${itemId}`);
  }
}

export function subscribeToTenantItems(
  businessId: string,
  onItems: (items: InventoryItem[]) => void
): () => void {
  if (!businessId) return () => {};
  const path = `businesses/${businessId}/inventory`;
  try {
    const colRef = collection(db, path);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: InventoryItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as InventoryItem);
        });
        onItems(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return () => {};
  }
}

// Backwards-compatible wrappers for legacy callers
export async function syncItemsToFirestore(userEmail: string, items: InventoryItem[]) {
  if (!userEmail || !items.length) return;
  const cleanId = userEmail.replace(/[^a-zA-Z0-9]/g, "_");
  try {
    const batch = writeBatch(db);
    for (const item of items) {
      const docRef = doc(db, "users", cleanId, "inventory", item.id);
      batch.set(docRef, { ...item, updatedAt: new Date().toISOString() }, { merge: true });
    }
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${cleanId}/inventory`);
  }
}

export async function saveSaleToFirestore(userEmail: string, saleData: any) {
  if (!userEmail || !saleData?.id) return;
  const cleanId = userEmail.replace(/[^a-zA-Z0-9]/g, "_");
  const path = `users/${cleanId}/sales`;
  try {
    const docRef = doc(db, path, saleData.id);
    await setDoc(docRef, { ...saleData, createdAt: serverTimestamp() });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${saleData.id}`);
  }
}

export async function syncCreditsToBusinessFirestore(businessId: string, credits: CreditRecord[]) {
  if (!businessId || !credits.length) return;
  try {
    const batch = writeBatch(db);
    for (const credit of credits) {
      const docRef = doc(db, "businesses", businessId, "customers", credit.id);
      batch.set(docRef, { ...credit, businessId, updatedAt: new Date().toISOString() }, { merge: true });
    }
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `businesses/${businessId}/customers`);
  }
}

export { onAuthStateChanged, signInWithPopup, fbSignOut };
export type { User };
