"use client";

import Link from "next/link";

export default function Sidebar() {
  return (
    <aside
      className="
        bg-card text-card-foreground
        border-r border-border
        w-64 min-h-screen
        px-4 py-6
      "
    >
      {/* section header */}
      <div className="mb-6 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        Navigation
      </div>

      <nav className="space-y-1">
        <Link
          href="/dashboard"
          className="block rounded-lg px-3 py-2 hover:bg-accent hover:text-accent-foreground"
        >
          Dashboard
        </Link>

        <Link
          href="/dashboard/bitcoin"
          className="block rounded-lg px-3 py-2 hover:bg-accent hover:text-accent-foreground"
        >
          Bitcoin
        </Link>

        <Link
          href="/dashboard/ethereum"
          className="block rounded-lg px-3 py-2 hover:bg-accent hover:text-accent-foreground"
        >
          Ethereum
        </Link>

        <Link
          href="/dashboard/settings"
          className="block rounded-lg px-3 py-2 hover:bg-accent hover:text-accent-foreground"
        >
          Settings
        </Link>

        <Link
          href="/dashboard/charts"
          className="block rounded-lg px-3 py-2 hover:bg-accent hover:text-accent-foreground"
        >
          Charts
        </Link>
      </nav>
    </aside>
  );
}
