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
  OAuthProvider,
  User,
  updatePassword,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { requestGoogleProfileGIS } from "./googleAuth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
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
  runTransaction,
  limit,
  orderBy,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import {
  Business,
  BusinessMember,
  InventoryItem,
  StockMovement,
  CreditRecord,
  SaleItem,
  Customer,
  Supplier,
  Expense,
  CashTransaction,
  SaleRecord,
} from "../types";

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch {
  firestoreInstance = getFirestore(app);
}

export const db = firestoreInstance;
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export const appleProvider = new OAuthProvider("apple.com");
appleProvider.addScope("email");
appleProvider.addScope("name");

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
  const errMsg = error instanceof Error ? error.message : String(error);
  const isOffline =
    errMsg.includes("client is offline") ||
    errMsg.includes("offline") ||
    (error as any)?.code === "unavailable";

  if (isOffline) {
    console.warn(`[Firebase] Offline mode active during ${operationType} on ${path || "unknown"}: ${errMsg}`);
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
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
  displayName: string,
  storeName?: string
): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();
  const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
  if (displayName.trim()) {
    await updateProfile(cred.user, { displayName: displayName.trim() });
  }

  const isSuperAdmin = cleanEmail === "settaholdings@gmail.com";
  const now = new Date().toISOString();
  const businessId = `biz_${cred.user.uid.slice(0, 10)}_${Date.now()}`;
  const finalStoreName = storeName?.trim() || displayName.trim() || "My Store";

  // 1. Write user document to /users/{uid}
  const userDocRef = doc(db, "users", cred.user.uid);
  await setDoc(
    userDocRef,
    {
      uid: cred.user.uid,
      email: cleanEmail,
      displayName: displayName.trim() || cleanEmail.split("@")[0] || (isSuperAdmin ? "INCO Master Admin (Setta SL)" : "Merchant"),
      storeName: finalStoreName,
      role: isSuperAdmin ? "admin" : "merchant",
      accountStatus: "active",
      isVerified: true,
      verificationStatus: isSuperAdmin ? "approved" : "none",
      activeBusinessId: businessId,
      createdAt: now,
      updatedAt: now,
    },
    { merge: true }
  );

  // If super admin, guarantee admin entry exists in /admins/{uid}
  if (isSuperAdmin) {
    try {
      await setDoc(
        doc(db, "admins", cred.user.uid),
        {
          uid: cred.user.uid,
          email: cleanEmail,
          role: "admin",
          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      );
    } catch (adminErr) {
      console.warn("[Firebase] Admin doc create notice:", adminErr);
    }
  }

  // 2. Create initial business document in /businesses/{businessId} (safely wrapped)
  try {
    const bizDocRef = doc(db, "businesses", businessId);
    await setDoc(
      bizDocRef,
      {
        businessId,
        businessName: finalStoreName,
        businessType: "shop",
        ownerId: cred.user.uid,
        currency: "USD",
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    // 3. Add membership in /businesses/{businessId}/members/{uid} with role: 'owner'
    const memberDocRef = doc(db, "businesses", businessId, "members", cred.user.uid);
    await setDoc(
      memberDocRef,
      {
        uid: cred.user.uid,
        businessId,
        role: "owner",
        status: "active",
        email: cleanEmail,
        displayName: displayName.trim() || cleanEmail.split("@")[0] || "Merchant",
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );
  } catch (bizErr) {
    console.warn("[Firebase] Initial business/member setup notice (non-fatal):", bizErr);
  }

  return cred.user;
}

export async function signInWithEmail(email: string, pass: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), pass);
  return cred.user;
}

/**
 * Ensures the Firebase Auth session is authenticated as the Super Admin (settaholdings@gmail.com).
 * If the user isn't signed in, it signs them in or creates the account with the provided master key.
 * This guarantees that Firestore rules recognize the session as super-admin with full read permissions!
 */
export async function ensureSuperAdminSession(password?: string): Promise<User> {
  const adminEmail = "settaholdings@gmail.com";
  const passToUse = (password && password.trim().length >= 6) ? password.trim() : "INCO-ADMIN-2025";

  // Check if currently authenticated as super admin
  if (auth.currentUser && auth.currentUser.email?.toLowerCase() === adminEmail) {
    try {
      await setDoc(
        doc(db, "admins", auth.currentUser.uid),
        {
          uid: auth.currentUser.uid,
          email: adminEmail,
          role: "admin",
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {}
    return auth.currentUser;
  }

  // Attempt login with provided password
  try {
    const cred = await signInWithEmailAndPassword(auth, adminEmail, passToUse);
    try {
      await setDoc(
        doc(db, "admins", cred.user.uid),
        {
          uid: cred.user.uid,
          email: adminEmail,
          role: "admin",
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {}
    return cred.user;
  } catch (signErr: any) {
    // If account doesn't exist yet, create it on Firebase Auth!
    if (signErr?.code === "auth/user-not-found" || signErr?.code === "auth/invalid-credential") {
      try {
        const cred = await createUserWithEmailAndPassword(auth, adminEmail, passToUse);
        await updateProfile(cred.user, { displayName: "INCO Master Admin (Setta SL)" });
        const now = new Date().toISOString();
        await setDoc(
          doc(db, "users", cred.user.uid),
          {
            uid: cred.user.uid,
            email: adminEmail,
            displayName: "INCO Master Admin (Setta SL)",
            storeName: "INCO Headquarters",
            role: "admin",
            accountStatus: "active",
            isVerified: true,
            verificationStatus: "approved",
            createdAt: now,
            updatedAt: now,
          },
          { merge: true }
        );
        await setDoc(
          doc(db, "admins", cred.user.uid),
          {
            uid: cred.user.uid,
            email: adminEmail,
            role: "admin",
            createdAt: now,
          },
          { merge: true }
        );
        return cred.user;
      } catch (createErr: any) {
        if (createErr?.code === "auth/email-already-in-use") {
          // Retry login if racing with another tab
          const cred = await signInWithEmailAndPassword(auth, adminEmail, passToUse);
          return cred.user;
        }
        throw createErr;
      }
    }
    throw signErr;
  }
}

export async function syncUserFirestoreRecord(
  user: User,
  email: string,
  displayName?: string,
  photoURL?: string,
  storeName?: string
): Promise<void> {
  try {
    const isSuperAdmin = email.toLowerCase() === "settaholdings@gmail.com";
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(
      userDocRef,
      {
        uid: user.uid,
        email: user.email || email,
        displayName: displayName || user.displayName || (isSuperAdmin ? "INCO Master Admin (Setta SL)" : email.split("@")[0]),
        photoURL: photoURL || user.photoURL || (isSuperAdmin ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=140&auto=format&fit=crop&q=80" : null),
        storeName: storeName || (isSuperAdmin ? "INCO Headquarters" : "My Store"),
        role: isSuperAdmin ? "admin" : "merchant",
        accountStatus: "active",
        isVerified: true,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    if (isSuperAdmin) {
      await setDoc(
        doc(db, "admins", user.uid),
        {
          uid: user.uid,
          email: user.email || email,
          role: "admin",
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }
  } catch (firestoreErr) {
    console.warn("[Firebase] user sync Firestore note (offline or permission):", firestoreErr);
  }
}

/**
 * Retrieves all registered users from Firestore (accessible by platform super-admin)
 */
export async function fetchAllUsersFromFirestore(): Promise<any[]> {
  try {
    const colRef = collection(db, "users");
    const snapshot = await getDocs(colRef);
    const users: any[] = [];
    snapshot.forEach((docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        users.push({
          id: d.uid || docSnap.id,
          uid: d.uid || docSnap.id,
          identifier: d.email || docSnap.id,
          displayName: d.displayName || d.email?.split("@")[0] || "Merchant",
          storeName: d.storeName || "My Store",
          role: d.role || "merchant",
          isVerified: !!d.isVerified,
          verificationStatus: d.verificationStatus || "none",
          accountStatus: d.accountStatus || "active",
          avatarUrl: d.photoURL || d.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=140&auto=format&fit=crop&q=80",
          activeBusinessId: d.activeBusinessId,
          createdAt: d.createdAt || new Date().toISOString(),
          updatedAt: d.updatedAt,
        });
      }
    });
    return users;
  } catch (err) {
    console.warn("[Firebase] fetchAllUsersFromFirestore error:", err);
    return [];
  }
}

/**
 * Real-time subscription to all registered users in Firestore.
 * Automatically triggers callback whenever any user registers or updates!
 */
export function subscribeToAllUsersFromFirestore(
  onUsersUpdated: (users: any[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const colRef = collection(db, "users");
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const users: any[] = [];
        snapshot.forEach((docSnap) => {
          if (docSnap.exists()) {
            const d = docSnap.data();
            users.push({
              id: d.uid || docSnap.id,
              uid: d.uid || docSnap.id,
              identifier: d.email || docSnap.id,
              displayName: d.displayName || d.email?.split("@")[0] || "Merchant",
              storeName: d.storeName || "My Store",
              role: d.role || "merchant",
              isVerified: !!d.isVerified,
              verificationStatus: d.verificationStatus || "none",
              accountStatus: d.accountStatus || "active",
              avatarUrl: d.photoURL || d.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=140&auto=format&fit=crop&q=80",
              activeBusinessId: d.activeBusinessId,
              createdAt: d.createdAt || new Date().toISOString(),
              updatedAt: d.updatedAt,
            });
          }
        });
        onUsersUpdated(users);
      },
      (err) => {
        console.warn("[Firebase] Live users listener note:", err);
        if (onError) onError(err);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn("[Firebase] Could not attach users subscription:", err);
    return () => {};
  }
}

/**
 * Updates a user profile directly in Firestore (Platform Super-Admin action)
 */
export async function updateUserInFirestore(
  userId: string,
  updates: Record<string, any>
): Promise<void> {
  const userDocRef = doc(db, "users", userId);
  await setDoc(
    userDocRef,
    {
      ...updates,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

/**
 * Removes a user document in Firestore (Platform Super-Admin action)
 */
export async function deleteUserFromFirestore(userId: string): Promise<void> {
  const userDocRef = doc(db, "users", userId);
  await deleteDoc(userDocRef);
}

/**
 * Genuine Google Authentication via Google Identity Services (GIS) or Firebase Provider Popup
 */
export async function signInWithGoogle(hintEmail?: string): Promise<User> {
  // Method 1: Google Identity Services (GIS) OAuth popup (Works directly in sandboxed environments)
  try {
    const googleProfile = await requestGoogleProfileGIS(hintEmail);
    if (googleProfile?.accessToken) {
      try {
        const credential = GoogleAuthProvider.credential(googleProfile.idToken || null, googleProfile.accessToken);
        const cred = await signInWithCredential(auth, credential);
        await syncUserFirestoreRecord(cred.user, cred.user.email || googleProfile.email, googleProfile.name, googleProfile.photoURL);
        return cred.user;
      } catch (credErr: any) {
        if (credErr?.code === "auth/account-exists-with-different-credential") {
          throw new Error("This email was registered with an email and password. Please sign in with your password or use 'Forgot password'.");
        }
        throw credErr;
      }
    }
  } catch (gisErr: unknown) {
    const gError = gisErr as { message?: string };
    const gisMsg = gError?.message || "";
    if (gisMsg.includes("closed") || gisMsg.includes("cancelled") || gisMsg.includes("dismissed")) {
      throw new Error("Google sign-in was cancelled.");
    }
    console.warn("[Firebase] GIS prompt notice:", gisMsg);
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
    const errCode = error?.code || "";
    const errMsg = error?.message || "";

    if (errCode === "auth/popup-closed-by-user" || errMsg.includes("closed-by-user") || errMsg.includes("cancelled")) {
      throw new Error("Google sign-in popup was closed before completing.");
    }
    if (errCode === "auth/popup-blocked") {
      throw new Error("The Google sign-in popup was blocked by your browser. Please allow popups or use email and password.");
    }
    if (errCode === "auth/unauthorized-domain") {
      throw new Error("This domain is not yet authorized in Firebase Console Authentication settings. Please log in using email and password.");
    }
    throw new Error(errMsg || "Google sign-in failed. Please use email and password.");
  }
}

/**
 * Genuine Apple Authentication via Firebase OAuth Provider Popup
 */
export async function signInWithApple(): Promise<User> {
  try {
    const cred = await signInWithPopup(auth, appleProvider);
    await syncUserFirestoreRecord(
      cred.user,
      cred.user.email || "",
      cred.user.displayName || "Apple User",
      cred.user.photoURL || undefined
    );
    return cred.user;
  } catch (appleErr: any) {
    const errCode = appleErr?.code || "";
    const errMsg = appleErr?.message || "";

    if (errCode === "auth/popup-closed-by-user" || errMsg.includes("closed-by-user") || errMsg.includes("cancelled")) {
      throw new Error("Apple sign-in popup was closed before completing.");
    }
    if (errCode === "auth/popup-blocked") {
      throw new Error("The Apple sign-in popup was blocked by your browser. Please allow popups or use email and password.");
    }
    if (errCode === "auth/unauthorized-domain") {
      throw new Error("This domain is not yet authorized in Firebase Console Authentication settings. Please log in using email and password.");
    }
    throw new Error(errMsg || "Apple sign-in failed. Please use email and password.");
  }
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function signOutUser(): Promise<void> {
  await fbSignOut(auth);
}

export async function updateUserPassword(newPassword: string, currentPassword?: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("No active authenticated session found. Please sign in.");

  if (currentPassword && currentUser.email) {
    const cred = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, cred);
  }

  try {
    await updatePassword(currentUser, newPassword);
  } catch (err: any) {
    if (err?.code === "auth/requires-recent-login") {
      throw new Error("Security check: please provide your current password to confirm changing your password.");
    }
    throw err;
  }
}

export async function deleteCurrentUserAccount(currentPassword?: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("No active authenticated session found.");

  if (currentPassword && currentUser.email) {
    const cred = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, cred);
  }

  try {
    await deleteDoc(doc(db, "users", currentUser.uid));
  } catch (e) {
    console.warn("[Firebase] Could not delete user doc before auth deletion:", e);
  }

  try {
    await deleteUser(currentUser);
  } catch (err: any) {
    if (err?.code === "auth/requires-recent-login") {
      throw new Error("Security verification required: please re-enter your current password to delete your account permanently.");
    }
    throw err;
  }
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
    const businessDoc = await getDoc(doc(db, "businesses", businessId));
    if (businessDoc.exists()) {
      const businessData = businessDoc.data() as Business;
      let memberData: BusinessMember | null = null;
      try {
        const memberDoc = await getDoc(doc(db, "businesses", businessId, "members", uid));
        if (memberDoc.exists()) {
          memberData = memberDoc.data() as BusinessMember;
        }
      } catch (memErr) {
        console.warn("[Firebase] Member doc lookup deferred:", memErr);
      }

      if (!memberData && businessData.ownerId === uid) {
        memberData = {
          uid,
          businessId,
          role: "owner",
          status: "active",
          email: auth.currentUser?.email || undefined,
          displayName: auth.currentUser?.displayName || "Store Owner",
          permissions: ["all"],
          createdAt: businessData.createdAt,
          updatedAt: businessData.updatedAt,
        };
      }

      if (memberData) {
        return {
          business: businessData,
          member: memberData,
        };
      }
    }
    return { business: null, member: null };
  } catch (error: any) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const isOffline =
      errMsg.includes("client is offline") ||
      errMsg.includes("offline") ||
      error?.code === "unavailable";

    if (isOffline) {
      console.warn(`[Firebase] getTenantBusiness operating in offline cache mode for businesses/${businessId}`);
    } else {
      handleFirestoreError(error, OperationType.GET, `businesses/${businessId}`);
    }
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

// ============================================================================
// ATOMIC POINT-OF-SALE TRANSACTION EXECUTION (PREVENTS RACE CONDITIONS & NEGATIVES)
// ============================================================================

export interface PosSalePayload {
  saleId: string;
  items: SaleItem[];
  totalAmount: number;
  totalUnits: number;
  paymentMethod: "Cash at Hand" | "Mobile Money (M-Pesa/MTN)" | "Credit / Pay Later" | "Card" | string;
  amountPaid: number;
  paymentStatus: "paid" | "partial" | "unpaid";
  customerId?: string;
  customerName?: string;
  notes?: string;
  allowNegativeStock?: boolean;
}

export async function executeSaleTransactionAtomic(
  businessId: string,
  payload: PosSalePayload
): Promise<{ success: boolean; saleId: string; movements: StockMovement[] }> {
  if (!businessId) throw new Error("A valid businessId is required for checkout.");
  if (!payload.items || payload.items.length === 0) throw new Error("Cannot checkout an empty sale.");

  const cashierUid = auth.currentUser?.uid || "unassigned";
  const now = new Date().toISOString();
  const createdMovements: StockMovement[] = [];

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Pre-read all inventory items to verify quantities
      const inventoryDocs: { docRef: any; currentData: InventoryItem; item: SaleItem }[] = [];

      for (const saleItem of payload.items) {
        const itemDocRef = doc(db, "businesses", businessId, "inventory", saleItem.itemId);
        const itemSnap = await transaction.get(itemDocRef);

        if (!itemSnap.exists()) {
          throw new Error(`Product "${saleItem.itemName}" could not be found in active inventory.`);
        }

        const currentData = itemSnap.data() as InventoryItem;
        const currentQty = Number(currentData.quantity) || 0;

        if (!payload.allowNegativeStock && currentQty < saleItem.quantity) {
          throw new Error(
            `Insufficient stock for "${saleItem.itemName}". Available: ${currentQty}, Requested: ${saleItem.quantity}.`
          );
        }

        inventoryDocs.push({ docRef: itemDocRef, currentData, item: saleItem });
      }

      // 2. Perform all stock adjustments
      for (const { docRef, currentData, item } of inventoryDocs) {
        const prevQty = Number(currentData.quantity) || 0;
        const nextQty = Math.max(0, prevQty - item.quantity);

        transaction.update(docRef, {
          quantity: nextQty,
          lastCountedAt: now,
          updatedAt: now,
        });

        const movementId = `mov_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const movementRef = doc(db, "businesses", businessId, "stockMovements", movementId);
        const movementData: StockMovement = {
          id: movementId,
          itemId: item.itemId,
          itemName: item.itemName,
          type: payload.paymentStatus === "unpaid" ? "sale_credit" : "sale",
          delta: -item.quantity,
          newQuantity: nextQty,
          timestamp: now,
          note: `POS Sale #${payload.saleId.slice(0, 8)} (${payload.paymentMethod})`,
        };

        transaction.set(movementRef, {
          ...movementData,
          businessId,
          actorUid: cashierUid,
          createdAt: serverTimestamp(),
        });

        createdMovements.push(movementData);
      }

      // 3. Write immutable completed sale record
      const saleRef = doc(db, "businesses", businessId, "sales", payload.saleId);
      const saleRecord: SaleRecord = {
        id: payload.saleId,
        businessId,
        cashierUid,
        totalAmount: payload.totalAmount,
        totalUnits: payload.totalUnits,
        items: payload.items,
        paymentMethod: payload.paymentMethod,
        paymentStatus: payload.paymentStatus,
        customerId: payload.customerId,
        customerName: payload.customerName,
        timestamp: now,
        notes: payload.notes,
      };

      transaction.set(saleRef, {
        ...saleRecord,
        createdAt: serverTimestamp(),
      });

      // 4. If partial or credit, update customer credit account
      if (payload.paymentStatus !== "paid" && payload.customerName) {
        const customerId = payload.customerId || `cust_${Date.now()}`;
        const custRef = doc(db, "businesses", businessId, "customers", customerId);
        const outstanding = payload.totalAmount - (payload.amountPaid || 0);

        transaction.set(
          custRef,
          {
            id: customerId,
            businessId,
            customerName: payload.customerName,
            amountOutstanding: outstanding,
            updatedAt: now,
          },
          { merge: true }
        );
      }

      // 5. Append immutable audit entry
      const auditId = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const auditRef = doc(db, "businesses", businessId, "auditLogs", auditId);
      transaction.set(auditRef, {
        id: auditId,
        businessId,
        actorUid: cashierUid,
        action: "POS_SALE_COMPLETED",
        entityType: "sales",
        entityId: payload.saleId,
        details: `Sale of ${payload.totalUnits} items totaling ${payload.totalAmount} completed via ${payload.paymentMethod}.`,
        timestamp: now,
      });
    });

    return { success: true, saleId: payload.saleId, movements: createdMovements };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `businesses/${businessId}/sales/${payload.saleId}`);
    throw error;
  }
}

// ============================================================================
// TENANT SUBCOLLECTION REAL-TIME SUBSCRIPTIONS & MUTATIONS
// ============================================================================

export function subscribeToTenantSales(
  businessId: string,
  onSales: (sales: SaleRecord[]) => void
): () => void {
  if (!businessId) return () => {};
  const path = `businesses/${businessId}/sales`;
  try {
    const colRef = collection(db, path);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const sales: SaleRecord[] = [];
        snapshot.forEach((docSnap) => sales.push(docSnap.data() as SaleRecord));
        sales.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        onSales(sales);
      },
      (error) => handleFirestoreError(error, OperationType.GET, path)
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return () => {};
  }
}

export function subscribeToTenantStockMovements(
  businessId: string,
  onMovements: (movements: StockMovement[]) => void
): () => void {
  if (!businessId) return () => {};
  const path = `businesses/${businessId}/stockMovements`;
  try {
    const colRef = collection(db, path);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const movements: StockMovement[] = [];
        snapshot.forEach((docSnap) => movements.push(docSnap.data() as StockMovement));
        movements.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        onMovements(movements);
      },
      (error) => handleFirestoreError(error, OperationType.GET, path)
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return () => {};
  }
}

export function subscribeToTenantCustomers(
  businessId: string,
  onCustomers: (customers: Customer[]) => void
): () => void {
  if (!businessId) return () => {};
  const path = `businesses/${businessId}/customers`;
  try {
    const colRef = collection(db, path);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const customers: Customer[] = [];
        snapshot.forEach((docSnap) => customers.push(docSnap.data() as Customer));
        onCustomers(customers);
      },
      (error) => handleFirestoreError(error, OperationType.GET, path)
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return () => {};
  }
}

export function subscribeToTenantExpenses(
  businessId: string,
  onExpenses: (expenses: Expense[]) => void
): () => void {
  if (!businessId) return () => {};
  const path = `businesses/${businessId}/expenses`;
  try {
    const colRef = collection(db, path);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const expenses: Expense[] = [];
        snapshot.forEach((docSnap) => expenses.push(docSnap.data() as Expense));
        expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        onExpenses(expenses);
      },
      (error) => handleFirestoreError(error, OperationType.GET, path)
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return () => {};
  }
}

export function subscribeToTenantSuppliers(
  businessId: string,
  onSuppliers: (suppliers: Supplier[]) => void
): () => void {
  if (!businessId) return () => {};
  const path = `businesses/${businessId}/suppliers`;
  try {
    const colRef = collection(db, path);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const suppliers: Supplier[] = [];
        snapshot.forEach((docSnap) => suppliers.push(docSnap.data() as Supplier));
        onSuppliers(suppliers);
      },
      (error) => handleFirestoreError(error, OperationType.GET, path)
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return () => {};
  }
}

export function subscribeToTenantCashTransactions(
  businessId: string,
  onTransactions: (transactions: CashTransaction[]) => void
): () => void {
  if (!businessId) return () => {};
  const path = `businesses/${businessId}/cashTransactions`;
  try {
    const colRef = collection(db, path);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const txs: CashTransaction[] = [];
        snapshot.forEach((docSnap) => txs.push(docSnap.data() as CashTransaction));
        txs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        onTransactions(txs);
      },
      (error) => handleFirestoreError(error, OperationType.GET, path)
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return () => {};
  }
}

export async function saveExpenseToBusinessFirestore(businessId: string, expense: Expense): Promise<void> {
  if (!businessId || !expense?.id) return;
  const path = `businesses/${businessId}/expenses`;
  try {
    await setDoc(doc(db, path, expense.id), { ...expense, businessId, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${expense.id}`);
  }
}

export async function deleteExpenseFromBusinessFirestore(businessId: string, expenseId: string): Promise<void> {
  if (!businessId || !expenseId) return;
  const path = `businesses/${businessId}/expenses`;
  try {
    await deleteDoc(doc(db, path, expenseId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${path}/${expenseId}`);
  }
}

export async function saveSupplierToBusinessFirestore(businessId: string, supplier: Supplier): Promise<void> {
  if (!businessId || !supplier?.id) return;
  const path = `businesses/${businessId}/suppliers`;
  try {
    await setDoc(doc(db, path, supplier.id), { ...supplier, businessId, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${supplier.id}`);
  }
}

export async function deleteSupplierFromBusinessFirestore(businessId: string, supplierId: string): Promise<void> {
  if (!businessId || !supplierId) return;
  const path = `businesses/${businessId}/suppliers`;
  try {
    await deleteDoc(doc(db, path, supplierId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${path}/${supplierId}`);
  }
}

export async function saveCustomerToBusinessFirestore(businessId: string, customer: Customer): Promise<void> {
  if (!businessId || !customer?.id) return;
  const path = `businesses/${businessId}/customers`;
  try {
    await setDoc(doc(db, path, customer.id), { ...customer, businessId, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${customer.id}`);
  }
}

export async function deleteCustomerFromBusinessFirestore(businessId: string, customerId: string): Promise<void> {
  if (!businessId || !customerId) return;
  const path = `businesses/${businessId}/customers`;
  try {
    await deleteDoc(doc(db, path, customerId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${path}/${customerId}`);
  }
}

export async function saveCashTransactionToBusinessFirestore(businessId: string, tx: CashTransaction): Promise<void> {
  if (!businessId || !tx?.id) return;
  const path = `businesses/${businessId}/cashTransactions`;
  try {
    await setDoc(doc(db, path, tx.id), { ...tx, businessId, createdAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${tx.id}`);
  }
}

export { onAuthStateChanged, signInWithPopup, fbSignOut };
export type { User };
