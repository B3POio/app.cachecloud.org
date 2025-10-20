// src/components/SideBar.tsx
"use client";

import Link from "next/link";
import { useEffect } from "react";

type SidebarProps = {
  /** Mobile drawer open */
  isOpen?: boolean;
  /** Desktop collapse state */
  isCollapsed?: boolean;
  /** Close mobile drawer */
  onClose?: () => void;
  /** Toggle desktop collapse */
  onToggleCollapse?: () => void;
};

export default function Sidebar({
  isOpen = false,
  isCollapsed = false,
  onClose,
  onToggleCollapse,
}: SidebarProps) {
  // Close drawer with ESC
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Common nav content
  const Nav = () => (
    <nav className="space-y-1">
      {[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/dashboard/portfolio", label: "Portfolio" },
        { href: "/dashboard/bitcoin", label: "Bitcoin" },
        { href: "/dashboard/ethereum", label: "Ethereum" },
        { href: "/dashboard/gold", label: "Gold" },
        { href: "/dashboard/wallets", label: "Wallets" },
        { href: "/dashboard/settings", label: "Settings" },
      ].map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="block rounded-lg px-3 py-2 hover:bg-[var(--surface-dark)] text-foreground"
        >
          <span className={"truncate " + (isCollapsed ? "sr-only" : "inline")}>
            {item.label}
          </span>
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop rail */}
      <aside
        className={[
          "hidden md:flex md:flex-col md:shrink-0 border-r border-border bg-[var(--sidebar-bg)] text-foreground min-h-screen transition-[width] duration-200 ease-in-out",
          isCollapsed ? "w-12" : "w-44",
        ].join(" ")}
      >
        <div
          className={[
            "flex items-center justify-between py-4",
            isCollapsed ? "px-1 pr-2" : "px-3",
          ].join(" ")}
        >
          <div className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            {isCollapsed ? <span className="sr-only">Cache Cloud</span> : "Cache Cloud"}
          </div>
          <button
            type="button"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden md:inline-flex items-center justify-center rounded-md border border-border px-2 py-1 hover:bg-[var(--surface-dark)] text-foreground"
            onClick={onToggleCollapse}
          >
            {/* Chevron icon rotates when collapsed */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className={["h-4 w-4 transition-transform", !isCollapsed ? "rotate-180" : ""].join(" ")}
            >
              <path
                fillRule="evenodd"
                d="M15.78 11.47a.75.75 0 0 1 0 1.06l-5 5a.75.75 0 1 1-1.06-1.06L13.94 12 9.72 7.78a.75.75 0 1 1 1.06-1.06l5 5Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        <div className="px-2 pb-6">
          <Nav />
        </div>
      </aside>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="md:hidden fixed inset-x-0 top-14 bottom-0 z-50">
          {/* Backdrop */}
          <button
            aria-label="Close navigation menu"
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />

          {/* Drawer panel */}
          <div
            className="absolute inset-y-0 left-0 bg-[var(--sidebar-bg)] text-foreground border-r border-border shadow-xl p-4 flex flex-col"
            style={{ width: "min(60vw, 12rem)" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                Cache Cloud
              </div>
              <button
                type="button"
                aria-label="Close navigation menu"
                className="inline-flex items-center justify-center rounded-md border border-border px-2 py-1 hover:bg-[var(--surface-dark)] text-foreground"
                onClick={onClose}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <nav className="space-y-1">
                <Link
                  href="/dashboard"
                  className="block rounded-lg px-3 py-2 hover:bg-[var(--surface-dark)] text-foreground"
                  onClick={onClose}
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/portfolio"
                  className="block rounded-lg px-3 py-2 hover:bg-[var(--surface-dark)] text-foreground"
                  onClick={onClose}
                >
                  Portfolio
                </Link>
                <Link
                  href="/dashboard/bitcoin"
                  className="block rounded-lg px-3 py-2 hover:bg-[var(--surface-dark)] text-foreground"
                  onClick={onClose}
                >
                  Bitcoin
                </Link>
                <Link
                  href="/dashboard/ethereum"
                  className="block rounded-lg px-3 py-2 hover:bg-[var(--surface-dark)] text-foreground"
                  onClick={onClose}
                >
                  Ethereum
                </Link>
                <Link
                  href="/dashboard/gold"
                  className="block rounded-lg px-3 py-2 hover:bg-[var(--surface-dark)] text-foreground"
                  onClick={onClose}
                >
                  Gold
                </Link>
                <Link
                  href="/dashboard/wallets"
                  className="block rounded-lg px-3 py-2 hover:bg-[var(--surface-dark)] text-foreground"
                  onClick={onClose}
                >
                  Wallets
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="block rounded-lg px-3 py-2 hover:bg-[var(--surface-dark)] text-foreground"
                  onClick={onClose}
                >
                  Settings
                </Link>
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
