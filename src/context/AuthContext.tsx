import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { User } from "firebase/auth";
import {
  auth,
  onAuthStateChanged,
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signInWithApple,
  sendPasswordReset,
  signOutUser,
  updateUserPassword,
  deleteCurrentUserAccount,
} from "../lib/firebase";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface SafeUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
}

export interface AuthContextValue {
  user: User | null;
  safeUser: SafeUser | null;
  status: AuthStatus;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, pass: string) => Promise<User>;
  signUp: (email: string, pass: string, displayName: string, storeName?: string) => Promise<User>;
  signInWithGoogleAuth: (hintEmail?: string) => Promise<User>;
  signInWithAppleAuth: () => Promise<User>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (newPassword: string, currentPassword?: string) => Promise<void>;
  deleteAccount: (currentPassword?: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setStatus(currentUser ? "authenticated" : "unauthenticated");
        setError(null);
      },
      (authErr) => {
        console.error("[Auth] State change listener error:", authErr);
        setUser(null);
        setStatus("unauthenticated");
        setError(authErr.message);
      }
    );

    return () => unsubscribe();
  }, []);

  const safeUser: SafeUser | null = useMemo(() => {
    if (!user) return null;
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      isAnonymous: user.isAnonymous,
    };
  }, [user]);

  const handleSignIn = async (email: string, pass: string): Promise<User> => {
    try {
      setError(null);
      return await signInWithEmail(email, pass);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign in";
      setError(msg);
      throw err;
    }
  };

  const handleSignUp = async (email: string, pass: string, displayName: string, storeName?: string): Promise<User> => {
    try {
      setError(null);
      return await signUpWithEmail(email, pass, displayName, storeName);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to register account";
      setError(msg);
      throw err;
    }
  };

  const handleGoogleSignIn = async (fallbackEmail?: string): Promise<User> => {
    try {
      setError(null);
      return await signInWithGoogle(fallbackEmail);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google sign in was cancelled or failed";
      setError(msg);
      throw err;
    }
  };

  const handleAppleSignIn = async (): Promise<User> => {
    try {
      setError(null);
      return await signInWithApple();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Apple sign in was cancelled or failed";
      setError(msg);
      throw err;
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      setError(null);
      await sendPasswordReset(email);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send password reset email";
      setError(msg);
      throw err;
    }
  };

  const handleChangePassword = async (newPassword: string, currentPassword?: string) => {
    try {
      setError(null);
      await updateUserPassword(newPassword, currentPassword);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to change password";
      setError(msg);
      throw err;
    }
  };

  const handleDeleteAccount = async (currentPassword?: string) => {
    try {
      setError(null);
      await deleteCurrentUserAccount(currentPassword);
      setUser(null);
      setStatus("unauthenticated");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete account";
      setError(msg);
      throw err;
    }
  };

  const handleSignOut = async () => {
    try {
      setError(null);
      await signOutUser();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign out";
      setError(msg);
      throw err;
    }
  };

  const clearError = () => setError(null);

  const value: AuthContextValue = {
    user,
    safeUser,
    status,
    isLoading: status === "loading",
    error,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signInWithGoogleAuth: handleGoogleSignIn,
    signInWithAppleAuth: handleAppleSignIn,
    resetPassword: handleResetPassword,
    changePassword: handleChangePassword,
    deleteAccount: handleDeleteAccount,
    signOut: handleSignOut,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
