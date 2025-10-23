"use client";

import useSWR from "swr";
import Link from "next/link";

type LivePrice = { buy: string | null; sell: string | null };
type Market = {
  eventSlug: string;
  marketSlug: string;
  question: string;
  outcomes: string[] | string | null;
  gammaOutcomePrices: number[] | string | number | null;
  clobTokenIds: string[] | unknown;
  livePrices?: Record<string, LivePrice> | null;
  volume24hr: number | string | null;
  liquidity: number | string | null;
  endDate: string | null;
  url: string;
};
type ApiResponse = { count: number; data: Market[] };

const fetcher = (url: string) =>
  fetch(url, { cache: "no-store" }).then((r) => {
    if (!r.ok) throw new Error(`Failed: ${r.status}`);
    return r.json();
  });

// ---------- helpers ----------
function parseJsonArray<T = unknown>(v: unknown): T[] | null {
  if (v == null) return null;
  if (Array.isArray(v)) return v as T[];
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? (parsed as T[]) : null;
    } catch {
      return null;
    }
  }
  return null;
}

function toNumberArray(v: unknown): number[] | null {
  if (v == null) return null;
  if (typeof v === "number") return [v];
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) {
        const arr = parsed
          .map((x: any) => Number(x))
          .filter((n: any) => Number.isFinite(n));
        return arr.length ? arr : null;
      }
    } catch {}
    const n = Number(v);
    return Number.isFinite(n) ? [n] : null;
  }
  if (Array.isArray(v)) {
    const arr = v
      .map((x: any) => Number(x))
      .filter((n: any) => Number.isFinite(n));
    return arr.length ? arr : null;
  }
  return null;
}

function toStringArray(v: unknown): string[] | null {
  if (v == null) return null;
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed.map(String) : [v];
    } catch {
      return [v];
    }
  }
  return null;
}

function normalizeClobTokenIds(v: unknown): string[] {
  if (Array.isArray(v) && v.every((x) => typeof x === "string" && !x.includes("[")))
    return v as string[];
  const jsonArr = parseJsonArray<string>(v);
  if (jsonArr) return jsonArr;

  if (Array.isArray(v) && v.length === 2 && typeof v[0] === "string" && typeof v[1] === "string") {
    const joined = String(v[0]) + String(v[1]);
    const candidates = [
      joined,
      joined.replace(/"\s*"/g, '","'),
      joined.replace(/\\{2,}/g, "\\"),
    ];
    for (const c of candidates) {
      try {
        const parsed = JSON.parse(c);
        if (Array.isArray(parsed)) return parsed.map(String);
      } catch {}
    }
  }

  return [];
}

// Format with two decimals
function formatNumberish(n: number | string | null | undefined): string {
  if (n == null) return "—";
  const num = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(num)) return String(n);
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ---------- Component ----------
export default function Polymarket({
  limit = 8,
  includeClosed = false,
  livePrices = true,
  className = "",
}: {
  limit?: number;
  includeClosed?: boolean;
  livePrices?: boolean;
  className?: string;
}) {
  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  if (includeClosed) qs.set("includeClosed", "1");
  if (livePrices) qs.set("livePrices", "1");

  const { data, error, isLoading, mutate } = useSWR<ApiResponse>(
    `/api/polymarket/bitcoin?${qs.toString()}`,
    fetcher,
    { refreshInterval: livePrices ? 15000 : 60000 }
  );

  if (isLoading) {
    return (
      <div className={`rounded-2xl border p-4 ${className}`}>
        <div className="animate-pulse text-sm opacity-60">Loading Polymarket…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-2xl border p-4 ${className}`}>
        <div className="text-sm text-red-600">Error loading Polymarket data.</div>
        <button
          onClick={() => mutate()}
          className="mt-2 rounded-xl border px-3 py-1 text-sm hover:bg-black/5 dark:hover:bg-white/10"
        >
          Retry
        </button>
      </div>
    );
  }

  const markets = data?.data ?? [];

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Polymarket · Bitcoin</h2>
        <button
          onClick={() => mutate()}
          className="rounded-xl border px-3 py-1 text-sm hover:bg-black/5 dark:hover:bg-white/10"
        >
          Refresh
        </button>
      </div>

      {markets.length === 0 ? (
        <div className="rounded-2xl border p-4 text-sm opacity-70">No markets found.</div>
      ) : (
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {markets.map((m) => {
            const outcomes = toStringArray(m.outcomes) ?? ["Yes", "No"];
            const prices = toNumberArray(m.gammaOutcomePrices);
            const yes = prices?.[0] ?? null;
            const no = prices?.[1] ?? null;
            const yesPct = yes != null ? yes * 100 : null;
            const noPct = no != null ? no * 100 : null;

            // Highlight colors based on which is higher
            const yesClass =
              yesPct != null && noPct != null
                ? yesPct > noPct
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
                : "";
            const noClass =
              yesPct != null && noPct != null
                ? noPct > yesPct
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
                : "";

            const clobs = normalizeClobTokenIds(m.clobTokenIds);
            const yesToken = clobs[0];
            const live =
              yesToken && m.livePrices && (m.livePrices as any)[yesToken]
                ? (m.livePrices as any)[yesToken]
                : null;

            return (
              <div key={m.marketSlug} className="rounded-2xl border p-4">
                <Link href={m.url} target="_blank" className="group inline-flex items-start gap-2">
                  <span className="line-clamp-3 text-sm font-medium group-hover:underline">
                    {m.question}
                  </span>
                </Link>

                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl border p-2">
                    <div className="opacity-60">Gamma {outcomes[0] ?? "Yes"}</div>
                    <div className={`text-base font-semibold ${yesClass}`}>
                      {yesPct != null ? `${yesPct.toFixed(1)}%` : "—"}
                    </div>
                  </div>
                  <div className="rounded-xl border p-2">
                    <div className="opacity-60">Gamma {outcomes[1] ?? "No"}</div>
                    <div className={`text-base font-semibold ${noClass}`}>
                      {noPct != null ? `${noPct.toFixed(1)}%` : "—"}
                    </div>
                  </div>
                </div>

                {live && (
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-xl border p-2">
                      <div className="opacity-60">Live Best Ask (BUY)</div>
                      <div className="text-base font-semibold">{live.buy ?? "—"}</div>
                    </div>
                    <div className="rounded-xl border p-2">
                      <div className="opacity-60">Live Best Bid (SELL)</div>
                      <div className="text-base font-semibold">{live.sell ?? "—"}</div>
                    </div>
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between text-xs opacity-60">
                  <span>Vol 24h: {formatNumberish(m.volume24hr)}</span>
                  <span>Liquidity: {formatNumberish(m.liquidity)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
