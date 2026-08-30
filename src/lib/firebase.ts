import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, getDocs, onSnapshot, query, where, deleteDoc } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { InventoryItem, StockMovement, CreditRecord } from "../types";

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
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

// Sync items to Firestore
export async function syncItemsToFirestore(userId: string, items: InventoryItem[]) {
  if (!userId) return;
  try {
    for (const item of items) {
      const docRef = doc(db, "inventory", `${userId}_${item.id}`);
      await setDoc(docRef, { ...item, userId, updatedAt: new Date().toISOString() });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, "inventory");
  }
}

// Sync sales to Firestore
export async function saveSaleToFirestore(userId: string, saleRecord: any) {
  if (!userId) return;
  try {
    const docRef = doc(db, "sales", `${userId}_${saleRecord.id}`);
    await setDoc(docRef, { ...saleRecord, userId, createdAt: new Date().toISOString() });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, "sales");
  }
}

// Sync credit records to Firestore
export async function syncCreditsToFirestore(userId: string, credits: CreditRecord[]) {
  if (!userId) return;
  try {
    for (const credit of credits) {
      const docRef = doc(db, "credits", `${userId}_${credit.id}`);
      await setDoc(docRef, { ...credit, userId, updatedAt: new Date().toISOString() });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, "credits");
  }
}

// Save single credit to Firestore
export async function saveCreditToFirestore(userId: string, creditRecord: CreditRecord) {
  if (!userId) return;
  try {
    const docRef = doc(db, "credits", `${userId}_${creditRecord.id}`);
    await setDoc(docRef, { ...creditRecord, userId, updatedAt: new Date().toISOString() });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, "credits");
  }
}

export { onAuthStateChanged, signInWithPopup, fbSignOut };
