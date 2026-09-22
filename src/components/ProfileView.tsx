import React, { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Shield,
  CheckCircle2,
  Camera,
  Building,
  KeyRound,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { UserProfile, StoreSettings } from "../types";
import { sounds } from "../lib/sound";
import { useAuth } from "../context/AuthContext";

interface ProfileViewProps {
  userProfile?: UserProfile | null;
  settings: StoreSettings;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onShowToast: (msg: string, type?: "success" | "warning" | "info") => void;
  onLogout?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userProfile,
  settings,
  onUpdateProfile,
  onShowToast,
  onLogout,
}) => {
  const { changePassword, deleteAccount } = useAuth();

  const [fullName, setFullName] = useState(
    userProfile?.displayName || "Setta Holdings"
  );
  const [email, setEmail] = useState(
    userProfile?.identifier || "admin@settaholdings.com"
  );
  const [phone, setPhone] = useState("+266 1234 5678");
  const [role, setRole] = useState(
    (userProfile?.identifier || "").toLowerCase() === "settaholdings@gmail.com"
      ? "Super Admin"
      : "Store Administrator"
  );

  // Password Management State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Account Deletion State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmWord, setDeleteConfirmWord] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playSuccess();
    onUpdateProfile({
      displayName: fullName,
      identifier: email,
    });
    onShowToast("Profile details updated successfully!", "success");
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordStatus({ type: "error", message: "Password must be at least 6 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: "error", message: "New passwords do not match." });
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordStatus(null);
    try {
      await changePassword(newPassword.trim(), currentPassword.trim() || undefined);
      sounds.playSuccess();
      setPasswordStatus({ type: "success", message: "Password changed successfully in Firebase Auth!" });
      onShowToast("Account password updated successfully!", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordStatus({
        type: "error",
        message: err?.message || "Failed to update password. Please check your credentials.",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccountConfirm = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount(deletePassword.trim() || undefined);
      sounds.playSuccess();
      setShowDeleteModal(false);
      onShowToast("Account permanently deleted.", "info");
      if (onLogout) onLogout();
    } catch (err: any) {
      setDeleteError(err?.message || "Failed to delete account. Please verify password.");
    } finally {
      setIsDeleting(false);
    }
  };

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "SH";

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Profile</h1>
          <p className="text-xs text-slate-400">Account Credentials & Store Ownership</p>
        </div>
        <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-xl border border-amber-400/30">
          Verified Merchant
        </span>
      </div>

      {/* Main Profile Form Card matching design screenshot */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#121826] border border-[#1F293D] shadow-xl">
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left: Avatar Column */}
          <div className="md:col-span-4 flex flex-col items-center text-center space-y-3">
            <div className="relative group">
              <div className="w-28 h-28 rounded-full bg-[#182133] border-2 border-amber-400 text-amber-400 font-black text-3xl flex items-center justify-center shadow-lg shadow-amber-400/10">
                {initials}
              </div>
              <div className="absolute inset-0 rounded-full bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-white">{fullName}</h3>
              <p className="text-xs text-amber-400 font-semibold">{role}</p>
            </div>

            <div className="w-full pt-4 border-t border-[#1A2333] space-y-2 text-left text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Account Status:</span>
                <span className="text-emerald-400 font-bold">Active</span>
              </div>
              <div className="flex justify-between">
                <span>Store ID:</span>
                <span className="font-mono text-slate-300">INCO-SETTA-01</span>
              </div>
            </div>
          </div>

          {/* Right: Form Inputs Column */}
          <div className="md:col-span-8 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400">Full Name</label>
              <div className="relative mt-1">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Setta Holdings"
                  className="w-full p-3 bg-[#0B0F19] border border-[#1A2333] rounded-xl text-sm font-semibold text-white focus:outline-hidden focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400">Email</label>
              <div className="relative mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@settaholdings.com"
                  className="w-full p-3 bg-[#0B0F19] border border-[#1A2333] rounded-xl text-sm font-semibold text-white focus:outline-hidden focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400">Phone</label>
              <div className="relative mt-1">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+266 1234 5678"
                  className="w-full p-3 bg-[#0B0F19] border border-[#1A2333] rounded-xl text-sm font-semibold text-white focus:outline-hidden focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400">Role</label>
              <div className="relative mt-1">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-3 bg-[#0B0F19] border border-[#1A2333] rounded-xl text-sm font-semibold text-white focus:outline-hidden focus:border-amber-400 transition-colors cursor-pointer"
                >
                  <option value="Super Admin" className="bg-slate-900 text-white">Super Admin</option>
                  <option value="Store Administrator" className="bg-slate-900 text-white">Store Administrator</option>
                  <option value="Inventory Manager" className="bg-slate-900 text-white">Inventory Manager</option>
                  <option value="Cashier / POS Clerk" className="bg-slate-900 text-white">Cashier / POS Clerk</option>
                </select>
              </div>
            </div>

            {/* Bright Yellow Save Changes Button matching the image */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-400/20 transition-all cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Security & Password Management Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#121826] border border-[#1F293D] shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-[#1A2333] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Security & Password</h2>
              <p className="text-xs text-slate-400">Update your Firebase authentication credentials</p>
            </div>
          </div>
        </div>

        {passwordStatus && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              passwordStatus.type === "success"
                ? "bg-emerald-950/60 border border-emerald-800 text-emerald-300"
                : "bg-rose-950/60 border border-rose-800 text-rose-300"
            }`}
          >
            {passwordStatus.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{passwordStatus.message}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400">Current Password (verification)</label>
            <input
              type={showPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
              className="mt-1 w-full p-3 bg-[#0B0F19] border border-[#1A2333] rounded-xl text-sm text-white focus:outline-hidden focus:border-amber-400 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400">New Password (min 6 chars)</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full p-3 pr-10 bg-[#0B0F19] border border-[#1A2333] rounded-xl text-sm text-white focus:outline-hidden focus:border-amber-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400">Confirm New Password</label>
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                className="mt-1 w-full p-3 bg-[#0B0F19] border border-[#1A2333] rounded-xl text-sm text-white focus:outline-hidden focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="px-6 py-3 bg-[#182133] hover:bg-amber-400 hover:text-slate-950 text-amber-400 border border-amber-400/30 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              {isUpdatingPassword ? "Updating Password..." : "Update Password"}
            </button>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="pt-4 border-t border-rose-950/60 mt-6">
          <div className="p-4 bg-rose-950/20 border border-rose-900/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Delete Merchant Account</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Permanently remove store data, credentials, and tenant membership.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setShowDeleteModal(true);
              }}
              className="px-4 py-2 bg-rose-900/40 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-800 font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121826] border border-rose-600 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-950/80 border border-rose-700 flex items-center justify-center mx-auto text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-black text-white text-lg">Permanently Delete Account?</h3>
              <p className="text-xs text-slate-300 mt-1">
                This action is permanent. All products, sales history, and store permissions will be wiped.
              </p>
            </div>

            {deleteError && (
              <div className="p-2.5 bg-rose-950 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Type <strong className="text-rose-400">DELETE</strong> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmWord}
                  onChange={(e) => setDeleteConfirmWord(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full p-2.5 bg-[#0B0F19] border border-rose-800 rounded-xl text-center text-xs font-mono text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Account Password (verification):
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full p-2.5 bg-[#0B0F19] border border-[#1A2333] rounded-xl text-xs text-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmWord("");
                  setDeletePassword("");
                  setDeleteError(null);
                }}
                className="flex-1 py-2.5 bg-[#182133] hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmWord.trim().toUpperCase() !== "DELETE" || isDeleting}
                onClick={handleDeleteAccountConfirm}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
