"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { CoinStats as BaseStats } from "./BitcoinTopTile";

type NullableNum = number | null | undefined;

export type EthStats = BaseStats & {
  // keep optional if you add it later:
  stakedUsd?: NullableNum;
};

type Fetcher = () => Promise<EthStats>;

type TileProps = {
  stats?: EthStats;     // optional SSR data
  fetcher?: Fetcher;    // optional custom fetcher
  className?: string;
};

const formatCurrency = (n: NullableNum) =>
  n == null
    ? "—"
    : new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(n);

const formatPercent = (n: NullableNum) =>
  n == null ? "—" : `${(n * 100).toFixed(2)}%`;

function Delta({ change24hPct }: { change24hPct: NullableNum }) {
  if (change24hPct == null) return <span className="text-muted-foreground">—</span>;
  const positive = change24hPct >= 0;
  return (
    <span className={`flex items-center gap-1 ${positive ? "text-green-600" : "text-red-600"}`}>
      {positive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
      {formatPercent(change24hPct)}
    </span>
  );
}

export default function EthereumTopTile({ stats, fetcher, className = "" }: TileProps) {
  const [data, setData] = useState<EthStats | null>(stats ?? null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    if (stats) {
      setData(stats);
      return () => { mounted = false; };
    }

    const effectiveFetcher = fetcher ?? fetchEthereumStats;

    effectiveFetcher()
      .then((d) => mounted && setData(d))
      .catch((e) => {
        console.error(e);
        if (mounted) setError("Failed to load ETH data");
      });

    return () => {
      mounted = false;
    };
  }, [stats, fetcher]);

  const tile =
    "rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm transition-colors";

  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${className}`}>
      <div className={tile}>
        <div className="text-sm text-muted-foreground">ETH Price</div>
        <div className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
          {error ? "—" : formatCurrency(data?.priceUsd)}
        </div>
        <div className="mt-1 text-xs">
          {error ? <span className="text-muted-foreground">—</span> : <Delta change24hPct={data?.change24hPct} />}
        </div>
      </div>

      <div className={tile}>
        <div className="text-sm text-muted-foreground">ETH Market Cap</div>
        <div className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
          {error ? "—" : formatCurrency(data?.marketCapUsd)}
        </div>
      </div>

      <div className={tile}>
        <div className="text-sm text-muted-foreground">ETH 24h Volume</div>
        <div className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
          {error ? "—" : formatCurrency(data?.volume24hUsd)}
        </div>
      </div>

      <div className={tile}>
        <div className="text-sm text-muted-foreground">ETH Dominance</div>
        <div className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
          {error ? "—" : (data?.dominancePct == null ? "—" : formatPercent(data.dominancePct))}
        </div>
      </div>
    </div>
  );
}

// Internal default fetcher – called when no fetcher prop is provided
export async function fetchEthereumStats(): Promise<EthStats> {
  const res = await fetch("/api/crypto/ethereum", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch ETH stats");
  return res.json();
}
