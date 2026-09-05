import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { doc, getDoc, collection, getDocs, setDoc, serverTimestamp } from "firebase/firestore";
import { db, createTenantBusiness, getTenantBusiness } from "../lib/firebase";
import { useAuth } from "./AuthContext";
import { Business, BusinessMember, BusinessRole } from "../types";

export interface BusinessContextValue {
  currentBusiness: Business | null;
  businessId: string | null;
  activeBusiness: Business | null;
  activeBusinessId: string | null;
  membership: BusinessMember | null;
  role: BusinessRole | null;
  userRole: BusinessRole | null;
  canEdit: boolean;
  canAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  createBusiness: (details: {
    businessName: string;
    businessType?: Business["businessType"];
    currency?: string;
    country?: string;
  }) => Promise<Business>;
  switchBusiness: (newBusinessId: string) => Promise<void>;
  refreshBusiness: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextValue | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, status } = useAuth();
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);
  const [membership, setMembership] = useState<BusinessMember | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const resolveUserBusiness = useCallback(async () => {
    if (!user) {
      setCurrentBusiness(null);
      setMembership(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Check user profile for activeBusinessId
      const userDoc = await getDoc(doc(db, "users", user.uid));
      let targetBusinessId: string | null = null;
      if (userDoc.exists() && userDoc.data().activeBusinessId) {
        targetBusinessId = userDoc.data().activeBusinessId;
      }

      // 2. If activeBusinessId exists, try to load it
      if (targetBusinessId) {
        const { business, member } = await getTenantBusiness(targetBusinessId, user.uid);
        if (business && member) {
          setCurrentBusiness(business);
          setMembership(member);
          setIsLoading(false);
          return;
        }
      }

      // 3. Fallback: check localStorage for last selected business
      const cachedBizId = localStorage.getItem("inco_active_business_id");
      if (cachedBizId) {
        const { business, member } = await getTenantBusiness(cachedBizId, user.uid);
        if (business && member) {
          setCurrentBusiness(business);
          setMembership(member);
          setIsLoading(false);
          return;
        }
      }

      // 4. Fallback: auto-provision a default business for the user if they don't have one yet
      // This ensures seamless onboarding without crashing the app
      const defaultName = `${user.displayName || "My"} Store`;
      const { business, member } = await createTenantBusiness(user.uid, {
        businessName: defaultName,
        currency: "LRD",
        country: "Liberia",
      });

      localStorage.setItem("inco_active_business_id", business.businessId);
      setCurrentBusiness(business);
      setMembership(member);
    } catch (err: unknown) {
      console.error("[BusinessContext] Error resolving business:", err);
      const msg = err instanceof Error ? err.message : "Failed to load business workspace";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (status === "authenticated") {
      resolveUserBusiness();
    } else if (status === "unauthenticated") {
      setCurrentBusiness(null);
      setMembership(null);
      setIsLoading(false);
    }
  }, [status, resolveUserBusiness]);

  const handleCreateBusiness = async (details: {
    businessName: string;
    businessType?: Business["businessType"];
    currency?: string;
    country?: string;
  }): Promise<Business> => {
    if (!user) throw new Error("Must be logged in to create a business");
    setIsLoading(true);
    try {
      const { business, member } = await createTenantBusiness(user.uid, details);
      setCurrentBusiness(business);
      setMembership(member);
      localStorage.setItem("inco_active_business_id", business.businessId);
      return business;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchBusiness = async (newBusinessId: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { business, member } = await getTenantBusiness(newBusinessId, user.uid);
      if (!business || !member) {
        throw new Error("You do not have access to this business");
      }
      setCurrentBusiness(business);
      setMembership(member);
      localStorage.setItem("inco_active_business_id", newBusinessId);
      // Persist in user document
      await setDoc(doc(db, "users", user.uid), { activeBusinessId: newBusinessId, updatedAt: new Date().toISOString() }, { merge: true });
    } finally {
      setIsLoading(false);
    }
  };

  const role = membership?.role || null;
  const canEdit = role === "owner" || role === "admin" || role === "manager";
  const canAdmin = role === "owner" || role === "admin";

  const value: BusinessContextValue = {
    currentBusiness,
    businessId: currentBusiness?.businessId || null,
    activeBusiness: currentBusiness,
    activeBusinessId: currentBusiness?.businessId || null,
    membership,
    role,
    userRole: role,
    canEdit,
    canAdmin,
    isLoading,
    error,
    createBusiness: handleCreateBusiness,
    switchBusiness: handleSwitchBusiness,
    refreshBusiness: resolveUserBusiness,
  };

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
};

export function useBusiness(): BusinessContextValue {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error("useBusiness must be used within a BusinessProvider");
  }
  return context;
}
