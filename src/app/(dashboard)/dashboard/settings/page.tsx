"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import {
  signOut,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
  User,
} from "firebase/auth";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showMsg = (type: "success" | "error", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4500);
  };

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  // ----- Update Email -----
  const [emailForm, setEmailForm] = useState({ newEmail: "", currentPassword: "" });
  useEffect(() => {
    if (user?.email) setEmailForm((f) => ({ ...f, newEmail: user.email! }));
  }, [user?.email]);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return showMsg("error", "You must be signed in.");
    if (!emailForm.newEmail) return showMsg("error", "Email cannot be empty.");
    if (!emailForm.currentPassword) return showMsg("error", "Please enter your current password.");
    setLoading(true);
    try {
      const cred = EmailAuthProvider.credential(user.email || "", emailForm.currentPassword);
      await reauthenticateWithCredential(user, cred);
      await updateEmail(user, emailForm.newEmail.trim());
      showMsg("success", "Email updated successfully.");
    } catch (err: any) {
      showMsg("error", mapFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  // ----- Change Password -----
  const [pwdForm, setPwdForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return showMsg("error", "You must be signed in.");
    if (!pwdForm.currentPassword) return showMsg("error", "Enter your current password.");
    if (!pwdForm.newPassword) return showMsg("error", "Enter a new password.");
    if (pwdForm.newPassword.length < 8) return showMsg("error", "New password must be at least 8 characters.");
    if (pwdForm.newPassword !== pwdForm.confirmPassword) return showMsg("error", "New passwords do not match.");
    setLoading(true);
    try {
      const cred = EmailAuthProvider.credential(user.email || "", pwdForm.currentPassword);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, pwdForm.newPassword);
      setPwdForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showMsg("success", "Password updated successfully.");
    } catch (err: any) {
      showMsg("error", mapFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      showMsg("success", "Signed out.");
    } catch (err: any) {
      showMsg("error", mapFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      {msg && (
        <div
          role="status"
          className={`rounded-lg border p-3 text-sm ${
            msg.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* GRID */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {/* Update Email (Card) */}
        <article className="flex h-full flex-col rounded-xl border border-gray-200 p-5">
          <header>
            <h2 className="text-lg font-medium">Update Email</h2>
            <p className="mt-1 text-sm text-gray-500">Confirm with your current password.</p>
          </header>

          <form onSubmit={handleUpdateEmail} className="mt-4 flex h-full flex-col gap-4">
            <div className="grid gap-1">
              <label htmlFor="newEmail" className="text-sm font-medium">
                New Email
              </label>
              <input
                id="newEmail"
                type="email"
                required
                value={emailForm.newEmail}
                onChange={(e) => setEmailForm((f) => ({ ...f, newEmail: e.target.value }))}
                className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-gray-400"
                placeholder="you@example.com"
              />
            </div>

            <div className="grid gap-1">
              <label htmlFor="emailCurrentPassword" className="text-sm font-medium">
                Current Password
              </label>
              <input
                id="emailCurrentPassword"
                type="password"
                required
                value={emailForm.currentPassword}
                onChange={(e) => setEmailForm((f) => ({ ...f, currentPassword: e.target.value }))}
                className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-gray-400"
                placeholder="••••••••"
              />
            </div>

            <div className="mt-auto flex items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-10 items-center justify-center rounded-md bg-black px-4 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Email"}
              </button>
            </div>
          </form>
        </article>

        {/* Change Password (Card) */}
        <article className="flex h-full flex-col rounded-xl border border-gray-200 p-5">
          <header>
            <h2 className="text-lg font-medium">Change Password</h2>
            <p className="mt-1 text-sm text-gray-500">Use a strong, unique password.</p>
          </header>

          <form onSubmit={handleChangePassword} className="mt-4 flex h-full flex-col gap-4">
            <div className="grid gap-1">
              <label htmlFor="currentPassword" className="text-sm font-medium">
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                required
                value={pwdForm.currentPassword}
                onChange={(e) => setPwdForm((f) => ({ ...f, currentPassword: e.target.value }))}
                className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-gray-400"
                placeholder="••••••••"
              />
            </div>

            <div className="grid gap-1">
              <label htmlFor="newPassword" className="text-sm font-medium">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                required
                value={pwdForm.newPassword}
                onChange={(e) => setPwdForm((f) => ({ ...f, newPassword: e.target.value }))}
                className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-gray-400"
                placeholder="At least 8 characters"
              />
            </div>

            <div className="grid gap-1">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={pwdForm.confirmPassword}
                onChange={(e) => setPwdForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-gray-400"
                placeholder="Repeat new password"
              />
            </div>

            <div className="mt-auto flex items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-10 items-center justify-center rounded-md bg-black px-4 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </article>

        {/* Session / Sign out (Card) */}
        <article className="flex h-full flex-col rounded-xl border border-red-200 bg-red-50 p-5">
          <header>
            <h2 className="text-lg font-medium text-red-700">Session</h2>
            <p className="mt-1 text-sm text-red-700/80">Sign out of this device.</p>
          </header>

          <div className="mt-auto">
            <button
              onClick={handleSignOut}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center rounded-md border border-red-300 bg-white px-4 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              {loading ? "…" : "Sign out"}
            </button>
          </div>
        </article>
      </div>
    </div>
  );
}

function mapFirebaseError(err: any): string {
  const code = (err?.code || "").toString();
  const msg = (err?.message || "Something went wrong").toString();
  if (code.includes("auth/requires-recent-login")) return "Please sign in again and retry this action (security requirement).";
  if (code.includes("auth/wrong-password")) return "The current password you entered is incorrect.";
  if (code.includes("auth/weak-password")) return "That password is too weak. Try at least 8–10 chars with a mix of types.";
  if (code.includes("auth/email-already-in-use")) return "That email is already in use.";
  if (code.includes("auth/invalid-email")) return "Please enter a valid email address.";
  return msg;
}
