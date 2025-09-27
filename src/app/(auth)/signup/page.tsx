"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { signupViaBackend } from "@/lib/authApi";

export default function SignUpPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [loading,   setLoading]   = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();
      await signupViaBackend({ email, password, displayName });
      // signupViaBackend exchanges the customToken and sets client auth state
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create your account</h1>
          <p className="mt-2 text-base text-gray-900 dark:text-gray-200">
            Get instant access to your admin dashboard and live crypto tiles.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          {/* First Name */}
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <User className="h-4 w-4 text-gray-700 dark:text-gray-300" />
            </span>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-300 bg-white px-10 py-2.5 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-700 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-300 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
              placeholder="First name"
            />
          </div>

          {/* Last Name */}
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <User className="h-4 w-4 text-gray-700 dark:text-gray-300" />
            </span>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-300 bg-white px-10 py-2.5 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-700 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-300 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
              placeholder="Last name"
            />
          </div>

          {/* Email */}
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <Mail className="h-4 w-4 text-gray-700 dark:text-gray-300" />
            </span>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-300 bg-white px-10 py-2.5 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-700 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-300 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
              placeholder="you@example.com"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <Lock className="h-4 w-4 text-gray-700 dark:text-gray-300" />
            </span>
            <input
              id="password"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl border border-gray-300 bg-white px-10 py-2.5 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-700 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-300 dark:focus:border-blue-400 dark:focus:ring-blue-900/40"
              placeholder="At least 6 characters"
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              aria-label={showPw ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-3 inline-flex items-center text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-200 dark:bg-red-900/30 dark:text-red-200 dark:ring-red-900">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full rounded-xl py-2.5 text-sm"
            disabled={loading || !firstName || !lastName || !email || !password}
          >
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-900 dark:text-gray-400">
          Already have an account?{" "}
          <Link href="/signin" className="font-medium text-blue-700 underline hover:no-underline dark:text-blue-400">
            Sign in
          </Link>
        </p>

        <div className="mt-4 flex justify-center">
          <ThemeToggle />
        </div>
      </div>
    </main>
  );
}
