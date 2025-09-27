"use client";

import { useRouter } from "next/navigation";
import { signOutAll } from "@/lib/authApi";

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
      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      <span className="hidden sm:inline"> Log out</span>
    </button>
  );
}
