// src/components/LogoutButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { signOutAll } from "@/lib/authApi";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    try {
      await signOutAll();
      router.replace("/signin"); // redirect to signin
    } catch (err) {
      console.error("Logout failed", err);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm bg-transparent hover:bg-[var(--surface-dark)] text-foreground"
      aria-label="Log out"
      title="Log out"
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:inline">Log out</span>
    </button>
  );
}
