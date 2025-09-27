// src/components/TopTiles.tsx
"use client";
import useSWR from "swr";
import Image from "next/image";
import React from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Brand colors
const coinColors: Record<"bitcoin" | "ethereum", string> = {
  bitcoin: "#F7931A",
  ethereum: "#627EEA",
};

function Tile({
  label,
  value,
  sub,
  color,
}: {
  label: React.ReactNode;          // <-- allow JSX
  value?: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="rounded-2xl bg-card text-card-foreground p-4 shadow-sm ring-1 ring-border">
      <div className="text-sm text-muted-foreground">{label}</div>
      <p
        className="mt-2 text-2xl font-semibold"
        style={{ color: color ?? "var(--foreground)" }}
      >
        {value ?? "—"}
      </p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function TopTiles() {
  const { data, error } = useSWR("/api/crypto/summary", fetcher, {
    refreshInterval: 60_000,
  });

  const price = (n?: number) =>
    typeof n === "number"
      ? n.toLocaleString(undefined, { style: "currency", currency: "USD" })
      : undefined;

  const cap = (n?: number) =>
    typeof n === "number" ? `$${Math.round(n).toLocaleString()}` : undefined;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Tile
        label={
          <span className="flex items-center gap-2">
            <Image src="/bitcoin.svg" alt="Bitcoin (BTC)" width={20} height={20} />
            Bitcoin (BTC)
          </span>
        }
        value={price(data?.bitcoin?.usd)}
        sub={error ? "Error loading" : "Updated live"}
        color={coinColors.bitcoin}
      />

      <Tile
        label={
          <span className="flex items-center gap-2">
            <Image src="/ethereum.png" alt="Ethereum (ETH)" width={20} height={20} />
            Ethereum (ETH)
          </span>
        }
        value={price(data?.ethereum?.usd)}
        sub={error ? "Error loading" : "Updated live"}
        color={coinColors.ethereum}
      />

      <Tile
        label="Global Crypto Market Cap"
        value={cap(data?.global_market_cap)}
        sub={error ? "Error loading" : "From CoinGecko"}
      />
    </div>
  );
}
