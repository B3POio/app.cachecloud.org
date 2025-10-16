"use client";
import React from "react";
import useSWR from "swr";
import Image from "next/image";
import {
  ComposedChart,   // 👈 use ComposedChart
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type ChartPoint = { t: number; price: number };

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const COIN_META: Record<
  "bitcoin" | "ethereum",
  { name: string; color: string; logo: string; symbol: "BTC" | "ETH" }
> = {
  bitcoin: {
    name: "Bitcoin (BTC)",
    color: "#F7931A",
    logo: "/bitcoin.svg",
    symbol: "BTC",
  },
  ethereum: {
    name: "Ethereum (ETH)",
    color: "#627EEA",
    logo: "/ethereum.png",
    symbol: "ETH",
  },
};

// Chart ranges
const RANGES = [
  { label: "1D", value: "1d", days: 1 },
  { label: "2D", value: "2d", days: 2 },
  { label: "3D", value: "3d", days: 3 },
  { label: "1W", value: "7d", days: 7 },
  { label: "2W", value: "14d", days: 14 },
  { label: "30D", value: "30d", days: 30 },
];

function toChartData(payload: any): ChartPoint[] {
  if (Array.isArray(payload?.prices)) {
    return payload.prices.map((p: [number, number]) => ({
      t: p[0],
      price: p[1],
    }));
  }

  const c = payload?.candles;
  if (Array.isArray(c) && c.length > 0) {
    if (typeof c[0] === "object" && !Array.isArray(c[0])) {
      return c.map((k: any) => ({
        t: Number(k.time ?? k.t ?? k.timestamp ?? k[0]),
        price: Number(k.close ?? k.c ?? k[4] ?? k.price ?? k.o ?? 0),
      }));
    }
    return c.map((k: any[]) => ({
      t: Number(k[0]),
      price: Number(k[4] ?? k[1] ?? 0),
    }));
  }
  return [];
}

function formatXAxis(ts: number, totalDays: number) {
  const d = new Date(ts);
  if (totalDays <= 3) {
    return d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (totalDays <= 14) {
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

// Compact price: $950, $10k, $10.5k, $110k
function formatPrice(n: number) {
  const v = Number(n);
  if (Number.isNaN(v)) return "";
  if (v >= 1000) {
    // 1 decimal for [1k, 100k); none for >= 100k
    const use0dp = v >= 100_000;
    const k = v / 1000;
    const s = use0dp ? k.toFixed(0) : k.toFixed(1).replace(/\.0$/, "");
    return `$${s}k`;
  }
  return `$${Math.round(v).toLocaleString()}`;
}

export default function PriceChart({
  coin,
  className = "",
}: {
  coin: "bitcoin" | "ethereum";
  className?: string;
}) {
  const meta = COIN_META[coin];
  const [range, setRange] = React.useState<string>("30d");
  const selected = RANGES.find((r) => r.value === range) ?? RANGES[0];

  const url = `/api/crypto/chart?symbol=${meta.symbol}&range=${encodeURIComponent(
    range
  )}&interval=auto&coin=${coin}&days=${selected.days}`;

  const { data, isLoading } = useSWR<any>(url, fetcher, { refreshInterval: 60_000 });
  const rawPoints: ChartPoint[] = toChartData(data);
  const chartData = rawPoints.map((p: ChartPoint) => ({
    t: p.t,
    label: formatXAxis(p.t, selected.days),
    price: p.price,
  }));

  return (
    <div
      className={`rounded-2xl bg-card text-card-foreground p-4 shadow-sm ring-1 ring-border ${className}`}
    >
      {/* Title */}
      <div className="flex items-center gap-2 mb-2">
        <Image src={meta.logo} alt={meta.name} width={20} height={20} />
        <h3 className="text-lg font-semibold text-muted-foreground">
          {meta.name}
        </h3>
      </div>

      {/* Range buttons */}
      <div className="w-full mb-3">
        <div className="overflow-x-auto no-scrollbar w-full overscroll-x-contain">
          <div
            role="tablist"
            aria-label="Select chart range"
            className="inline-flex gap-0.5 p-1 rounded-lg border border-border 
                      bg-muted/60 shadow-sm backdrop-blur 
                      supports-[backdrop-filter]:bg-muted/50"
          >
            {RANGES.map((r) => {
              const active = r.value === range;
              return (
                <button
                  key={r.value}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setRange(r.value)}
                  className={[
                    "h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm font-medium rounded-md",
                    "transition-colors duration-150 select-none",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    active
                      ? // ✅ Active: white background, black text in dark mode
                        "bg-white text-foreground shadow-sm border border-border dark:text-black"
                      : // Inactive: muted background with hover
                        "bg-transparent text-muted-foreground hover:bg-muted/70"
                  ].join(" ")}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>




      {/* Chart */}
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />

            <XAxis
              dataKey="label"
              minTickGap={24}
              tick={{ fill: "var(--muted-foreground)" }}
            />

            {/* Right-side Y-axis with compact formatting */}
            <YAxis
              domain={["auto", "auto"]}
              tickFormatter={(v) => formatPrice(Number(v))}
              orientation="right"
              width={64}
              tick={{ fill: "var(--muted-foreground)" }}
            />

            <Tooltip
              formatter={(v: number) => formatPrice(v)}
              labelFormatter={(label: any, payloadArg: unknown) => {
                const payload = payloadArg as ReadonlyArray<any>;
                const ts = payload?.[0]?.payload?.t as number | undefined;
                if (!ts) return String(label);
                const d = new Date(ts);
                return selected.days <= 3
                  ? d.toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : d.toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                    });
              }}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                color: "var(--popover-foreground)",
                borderRadius: "0.75rem",
              }}
              labelStyle={{ color: "var(--popover-foreground)" }}
            />

            {/* Gradient for underfill */}
            <defs>
              <linearGradient id={`colorGradient-${coin}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={meta.color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={meta.color} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            {/* Area under the line */}
            <Area
              type="monotone"
              dataKey="price"
              stroke="none"
              fillOpacity={1}
              fill={`url(#colorGradient-${coin})`}
              isAnimationActive={!isLoading}
            />

            {/* Line on top */}
            <Line
              type="monotone"
              dataKey="price"
              dot={false}
              activeDot={{ r: 4 }}
              stroke={meta.color}
              strokeWidth={2}
              isAnimationActive={!isLoading}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
