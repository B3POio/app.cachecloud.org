// src/components/TopTiles.tsx
"use client";
import useSWR from "swr";
import Image from "next/image";
import React, { useMemo } from "react";
import { useCurrency } from "../Currency"; 

const fetcher = (url: string) => fetch(url, { cache: "no-store", credentials: "include" }).then((r) => r.json());

// Brand colors
const coinColors: Record<"bitcoin" | "ethereum" | "gold", string> = {
  bitcoin: "#F7931A",
  ethereum: "#627EEA",
  gold: "#D4AF37",
};

function Tile({
  label,
  value,
  sub,
  color,
}: {
  label: React.ReactNode;     
  value?: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="rounded-2xl bg-card text-card-foreground p-4 shadow-sm ring-1 ring-border min-w-0">
      <div className="text-sm text-muted-foreground">{label}</div>
      <p
        className="mt-2 text-2xl font-semibold truncate"
        style={{ color: color ?? "var(--foreground)" }}
      >
        {value ?? "—"}
      </p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function TopTiles() {
  const { currency } = useCurrency();
  // Existing crypto summary
  const cryptoUrl = useMemo(
    () => `/api/crypto/summary?currency=usd`,
    [currency]
  );
  const { data, error } = useSWR(cryptoUrl, fetcher, { refreshInterval: 60_000 });

  // NEW: gold summary (mirrors your GoldTopTile source/shape)
  const goldUrl = useMemo(
    () => `/api/metals/summary?base=gold&currency=${currency}`,
    [currency]
  );
  const { data: goldData, error: goldError } = useSWR(goldUrl, fetcher, { refreshInterval: 60_000 });


  // Helper to pull the XAU/USD price out of your metals response
  function getGoldPrice(d: any): number | undefined {
    if (!d) return undefined;
    // Handle `{ items: [...] }` form
    if (Array.isArray(d.items)) {
      const it = d.items.find(
        (x: any) =>
          String(x?.symbol || "").startsWith("XAU/") ||
          String(x?.name || "").toLowerCase() === "gold"
      );
      const p = it?.price;
      return typeof p === "number" ? p : p != null ? Number(p) : undefined;
    }
    // Handle direct `{ price: number }` form
    if (typeof d === "object" && d !== null && "price" in d) {
      const p = (d as any).price;
      return typeof p === "number" ? p : p != null ? Number(p) : undefined;
    }
    return undefined;
  }

  const price = (n?: number) =>
    typeof n === "number"
      ? n.toLocaleString(undefined, { style: "currency", currency: "USD" })
      : undefined;

  const fmt = (n?: number) =>
    typeof n === "number"
      ? new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n)
      : undefined;

  const cap = (n?: number) =>
    typeof n === "number"
      ? new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(n)
      : undefined;

  const goldPrice = getGoldPrice(goldData);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Tile
        label={
          <span className="flex items-center gap-2">
            <Image src="/bitcoin.svg" alt="Bitcoin (BTC)" width={20} height={20} />
            Bitcoin (BTC)
          </span>
        }
        value={fmt(data?.bitcoin?.usd)}
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
        value={fmt(data?.ethereum?.usd)}
        sub={error ? "Error loading" : "Updated live"}
        color={coinColors.ethereum}
      />

      {/* NEW: Gold price tile (after Ethereum) */}
      <Tile
        label="Gold (XAU)"
        value={fmt(goldPrice)}
        sub={goldError ? "Error loading" : "Updated live"}
        color={coinColors.gold}
      />

      <Tile
        label="Global Crypto Market Cap"
        value={cap(data?.global_market_cap)}
        sub={error ? "Error loading" : "From CoinGecko"}
      />
    </div>
  );
}
