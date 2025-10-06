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
      router.replace("/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Failed to sign up");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] " +
    "px-10 py-2.5 text-sm text-[var(--foreground)] shadow-sm outline-none " +
    "placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] " +
    "focus:ring-4 focus:ring-[color:var(--ring)]/30";

  const iconClass = "h-4 w-4 text-[var(--muted-foreground)]";

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
      <div className="w-full max-w-md rounded-2xl bg-[var(--card)] p-8 shadow-sm ring-1 ring-[var(--border)]">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Create your account</h1>
          <p className="mt-2 text-base text-[var(--muted-foreground)]">
            Get instant access to your admin dashboard and live crypto tiles.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          {/* First Name */}
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <User className={iconClass} />
            </span>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className={inputClass}
              placeholder="First name"
            />
          </div>

          {/* Last Name */}
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <User className={iconClass} />
            </span>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className={inputClass}
              placeholder="Last name"
            />
          </div>

          {/* Email */}
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <Mail className={iconClass} />
            </span>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
              placeholder="you@example.com"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <Lock className={iconClass} />
            </span>
            <input
              id="password"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className={inputClass}
              placeholder="At least 6 characters"
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              aria-label={showPw ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-3 inline-flex items-center text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error && (
            <p
              className="rounded-lg px-3 py-2 text-sm ring-1"
              style={{
                background: "color-mix(in srgb, var(--destructive) 10%, transparent)",
                color: "var(--destructive-foreground)",
                borderColor: "color-mix(in srgb, var(--destructive) 35%, var(--border))",
              }}
            >
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

        <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
          Already have an account?{" "}
          <Link href="/signin" className="font-medium underline hover:no-underline text-[var(--primary)]">
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
