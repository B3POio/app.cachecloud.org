// src/components/PriceChart.tsx
"use client";
import React from "react";
import useSWR from "swr";
import Image from "next/image";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Centralize display meta for each coin
const COIN_META: Record<
  "bitcoin" | "ethereum",
  { name: string; color: string; logo: string }
> = {
  bitcoin: {
    name: "Bitcoin (BTC)",
    color: "#F7931A",
    logo: "/bitcoin.svg",
  },
  ethereum: {
    name: "Ethereum (ETH)",
    color: "#627EEA",
    logo: "/ethereum.png",
  },
};

export default function PriceChart({
  coin,
  className = "",
}: {
  coin: "bitcoin" | "ethereum";
  className?: string;
}) {
  const { data } = useSWR(`/api/crypto/chart?coin=${coin}&days=30`, fetcher, {
    refreshInterval: 60_000,
  });

  const chartData = Array.isArray(data?.prices)
    ? data.prices.map((p: [number, number]) => ({
        t: new Date(p[0]).toLocaleDateString(),
        price: p[1],
      }))
    : [];

  const meta = COIN_META[coin];

  return (
    <div className={`rounded-2xl bg-card text-card-foreground p-4 shadow-sm ring-1 ring-border ${className}`}>
      <div className="mb-4 flex items-center gap-2">
        <Image src={meta.logo} alt={meta.name} width={20} height={20} />
        <h3 className="text-lg font-semibold text-muted-foreground">
          {meta.name} • Last 30 days
        </h3>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="t" minTickGap={24} tick={{ fill: "var(--muted-foreground)" }} />
            <YAxis
              domain={["auto", "auto"]}
              tickFormatter={(v) => `$${Math.round(v).toLocaleString()}`}
              width={80}
              tick={{ fill: "var(--muted-foreground)" }}
            />
            <Tooltip
              formatter={(v: number) => `$${v.toLocaleString()}`}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                color: "var(--popover-foreground)",
                borderRadius: "0.75rem",
              }}
              labelStyle={{ color: "var(--popover-foreground)" }}
            />
            <Line
              type="monotone"
              dataKey="price"
              dot={false}
              activeDot={{ r: 4 }}
              stroke={meta.color}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
