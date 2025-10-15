// src/app/(dashboard)/dashboard/portfolio/page.tsx
import { headers } from "next/headers";
import Link from "next/link";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export const dynamic = "force-dynamic";

type NullableNum = number | null | undefined;

/** Match ethereumTopTile semantics for change props: prefer fractional change24h, else change24hPct/100 */
type CoinStats = {
  priceUsd?: NullableNum;
  change24h?: NullableNum;     // fractional daily change (e.g., 0.034 for +3.4%)
  change24hPct?: NullableNum;  // percent value from older routes (e.g., 3.4 for +3.4%)
  marketCapUsd?: NullableNum;
  volume24hUsd?: NullableNum;
  dominancePct?: NullableNum;
};

function Delta({ changeFraction }: { changeFraction: NullableNum }) {
  if (changeFraction == null) {
    return <span className="text-muted-foreground">—</span>;
  }
  const positive = changeFraction >= 0;
  return (
    <span className={`flex items-center gap-1 ${positive ? "text-green-600" : "text-red-600"}`}>
      {positive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
      {formatPercent(changeFraction)}
    </span>
  );
}

type CryptoSummary = {
  eth: { usd: number };
};

type WalletStat = {
  address: string;
  totalReceived: number;
  totalSent: number;
  balance: number;
  pendingDelta: number;
  txCount: number;
};

type SummaryResponse = {
  chain: "eth";
  totals: {
    balance: number;
    totalReceived: number;
    totalSent: number;
    pendingDelta: number;
  };
  wallets: WalletStat[];
};

type ChartPoint = { t: number; flow: number; cum: number };
type ChartResponse = {
  chain: "eth";
  range: string;
  points: ChartPoint[];
  note?: string;
};

function sats(n: number) {
  return new Intl.NumberFormat(undefined).format(n) + " sats";
}
function fmtDate(unixUtcMidnight: number) {
  return new Date(unixUtcMidnight * 1000).toISOString().slice(0, 10);
}

/** ---------- Robust ETH/USD extraction (no header changes) ---------- */
function toNum(n: unknown) {
  const x = typeof n === "string" ? Number(n) : (n as number);
  return Number.isFinite(x) ? x : 0;
}

function toNumNull(n: unknown): number | null {
  const x =
    typeof n === "string" ? Number(n) : typeof n === "number" ? n : NaN;
  return Number.isFinite(x) ? x : null;
}

function formatPercent(fraction: number | null | undefined) {
  return fraction == null ? "—" : `${(fraction * 100).toFixed(2)}%`;
}

/** Deep scan helper: finds a numeric value under keys that look like Eth & USD. */
function deepFindEthUsd(obj: any): number {
  if (!obj || typeof obj !== "object") return 0;

  // 1) Common explicit shapes
  if (obj?.eth?.usd) return toNum(obj.eth.usd);
  if (obj?.data?.eth?.usd) return toNum(obj.data.eth.usd);
  if (obj?.markets?.ETH?.usd) return toNum(obj.markets.ETH.usd);
  if (obj?.ETH?.USD) return toNum(obj.ETH.USD);
  if (obj?.price?.ETH?.USD) return toNum(obj.price.ETH.USD);
  if (obj?.ethUsd) return toNum(obj.ethUsd);
  if (obj?.priceUsd) return toNum(obj.priceUsd);
  if (obj?.eth_price) return toNum(obj.eth_price);

  // 2) Heuristic search
  const isObj = (v: any) => v && typeof v === "object";

  // Try two-level ETH -> USD
  for (const [k, v] of Object.entries(obj)) {
    if (!isObj(v)) continue;
    const kLower = k.toLowerCase();
    const looksEth = kLower === "eth" || kLower.includes("ethereum") || kLower.includes("eth");
    if (looksEth && isObj(v)) {
      const usdDirect = (v as any).usd ?? (v as any).USD;
      if (usdDirect != null) return toNum(usdDirect);

      if (isObj((v as any).price)) {
        const p = (v as any).price;
        if (p.usd != null) return toNum(p.usd);
        if (p.USD != null) return toNum(p.USD);
      }
    }
  }

  // Single-key combined forms like ETHUSD / eth_usd / ethPriceUsd
  for (const [k, v] of Object.entries(obj)) {
    const kLower = k.toLowerCase();
    const combined =
      (kLower.includes("eth") && kLower.includes("usd")) ||
      kLower === "ethusd" ||
      kLower === "eth_usd" ||
      kLower === "ethpriceusd";
    if (combined) {
      const val = toNum(v as any);
      if (val > 0) return val;
    }
  }

  // 3) Recurse
  for (const v of Object.values(obj)) {
    if (isObj(v)) {
      const found = deepFindEthUsd(v);
      if (found > 0) return found;
    }
  }

  return 0;
}

function extractEthUsd(payload: any): number {
  if (!payload) return 0;
  return deepFindEthUsd(payload);
}

/** ---------- 24h ETH price change extractor (pct as decimal) ---------- */
function toPctLike(x: number): number {
  // If API returns 2.5 meaning 2.5%, convert to 0.025; if it's 0.025 already, keep.
  const ax = Math.abs(x);
  if (ax > 1.5 && ax <= 1000) return x / 100;
  return x;
}

function deepFindEthChange24hPct(obj: any): number | null {
  if (!obj || typeof obj !== "object") return null;

  // Prefer explicit fractional or percent-like fields.
  const tryList = [
    obj?.eth?.change24h,
    obj?.eth?.change_24h,
    obj?.eth?.change24hPct,
    obj?.eth?.percent_change_24h,
    obj?.eth?.pct24h,
    obj?.eth?.price_change_percentage_24h,   // Coingecko style under eth
    obj?.eth?.usd_24h_change_pct,            // explicit pct
    obj?.data?.eth?.change24h,
    obj?.data?.eth?.percent_change_24h,
    obj?.data?.eth?.price_change_percentage_24h,
    obj?.markets?.ETH?.change24h,
    obj?.markets?.ETH?.percent_change_24h,
    obj?.markets?.ETH?.price_change_percentage_24h,
    obj?.ETH?.change24hPct,
    obj?.price?.ETH?.change24hPct,
    obj?.ethChange24hPct,
    obj?.eth_24h_pct,
    obj?.price_change_percentage_24h,        // top-level passthrough
  ];

  for (const v of tryList) {
    const n = toNumNull(v);
    if (n !== null) return toPctLike(n); // accept 0 as valid
  }

  // Heuristic: look for ETH-ish keys nesting 24h change
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === "object") {
      const kLower = k.toLowerCase();
      if (kLower.includes("eth") || kLower.includes("ethereum")) {
        const nested = deepFindEthChange24hPct(v);
        if (nested !== null) return nested;
      }
    }
  }

  // Heuristic: any key with '24h' + ('change' | 'pct' | 'percentage')
  for (const [k, v] of Object.entries(obj)) {
    const kLower = k.toLowerCase();
    if (
      kLower.includes("24h") &&
      (kLower.includes("change") || kLower.includes("pct") || kLower.includes("percentage"))
    ) {
      const n = toNumNull(v);
      if (n !== null) return toPctLike(n); // accept 0 as valid
    }
    if (v && typeof v === "object") {
      const nested = deepFindEthChange24hPct(v);
      if (nested !== null) return nested;
    }
  }

  return null;
}

function signedCurrency(n: number) {
  const f = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(
    Math.abs(n)
  );
  return (n >= 0 ? "+" : "−") + f.replace(/^\D+/, "");
}

export default async function PortfolioPage() {
  // MUST await headers() in Next 15
  const h = await headers();

  const proto =
    h.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");

  const host =
    h.get("x-forwarded-host") ??
    h.get("host") ??
    process.env.VERCEL_URL ??
    "localhost:3000";

  const base =
    host.startsWith("http://") || host.startsWith("https://")
      ? host
      : `${proto}://${host}`;

  // Forward session to our own API route (which then forwards to Node/Express)
  const forwardHeaders: Record<string, string> = { accept: "application/json" };
  const cookie = h.get("cookie");
  const authorization = h.get("authorization");
  if (cookie) forwardHeaders.cookie = cookie;
  if (authorization) forwardHeaders.authorization = authorization;

  // Small helper to fetch JSON safely
  async function fetchJSON<T>(path: string) {
    const res = await fetch(`${base}${path}`, {
      cache: "no-store",
      headers: forwardHeaders,
    });
    let data: T | undefined;
    try {
      data = (await res.json()) as T;
    } catch {
      // ignore parse error; handled below
    }
    return { ok: res.ok, status: res.status, data };
  }

  // Include /api/crypto/ethereum to mirror ethereumTopTile behavior
  const [summary, chart, crypto, ethStatsRes] = await Promise.all([
    fetchJSON<SummaryResponse>("/api/crypto/portfolio/ethereum?view=summary"),
    fetchJSON<ChartResponse>("/api/crypto/portfolio/ethereum?view=chart&range=30d"),
    fetchJSON<CryptoSummary>("/api/crypto/summary"),
    fetchJSON<CoinStats>("/api/crypto/ethereum"),
  ]);

  if (summary.status === 401 || chart.status === 401) {
    return (
      <main className="mx-auto max-w-3xl p-6 space-y-6">
        <h1 className="text-2xl font-semibold">ethereum Portfolio</h1>
        <div className="rounded-2xl border p-6 bg-amber-50">
          <p className="font-medium">Please sign in to view your portfolio.</p>
          <p className="text-sm text-gray-600 mt-1">
            Your session couldn’t be validated. Log in and refresh.
          </p>
        </div>
      </main>
    );
  }

  const totals = summary.data?.totals ?? {
    balance: 0,
    totalReceived: 0,
    totalSent: 0,
    pendingDelta: 0,
  };
  const wallets = summary.data?.wallets ?? [];
  const points = chart.data?.points ?? [];
  const note = chart.data?.note ?? "";
  const range = chart.data?.range ?? "30d";

  // Total transactions across all wallets
  const totalTxs = wallets.reduce((sum, w) => {
    const n = typeof w.txCount === "number" ? w.txCount : 0;
    return sum + n;
  }, 0);

  // ETH price from summary as fallback...
  const ethUsdFromSummary =
    extractEthUsd(crypto.data) ||
    extractEthUsd(crypto as unknown as Record<string, unknown>);

  // ...but prefer the ethereum endpoint for parity with ethereumTopTile
  const ethStats = ethStatsRes.data ?? null;
  const ethUsdFromStats = toNumNull(ethStats?.priceUsd) ?? null;

  const ethUsd =
    typeof ethUsdFromStats === "number" && ethUsdFromStats > 0
      ? ethUsdFromStats
      : ethUsdFromSummary;

  const portfolioUsd = ethUsd > 0 ? (totals.balance / 100_000_000) * ethUsd : 0;

  // ---- Daily Change (% + USD) — sourced from /api/crypto/ethereum to mirror ethereumTopTile ----
  const changeFractionFromStats =
    typeof ethStats?.change24h === "number"
      ? ethStats.change24h
      : typeof ethStats?.change24hPct === "number"
      ? (ethStats.change24hPct as number) / 100
      : null;

  // Fallback to heuristic extraction from /api/crypto/summary if stats missing
  const pct24hFallback =
    deepFindEthChange24hPct(crypto.data) ??
    deepFindEthChange24hPct(crypto as unknown as Record<string, unknown>);

  const changeFraction =
    changeFractionFromStats != null ? changeFractionFromStats : pct24hFallback;

  const ethDailyChangeUsd =
    changeFraction != null && ethUsd > 0 ? ethUsd * changeFraction : null;

  const dailyChangeUsd = ethDailyChangeUsd ?? null;

  // ETH dominance (single-asset for now = 100%)
  const ethDominancePct = 100;

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-8">
      {/* Header */}
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold">ethereum Portfolio</h1>

        {/* ETH price under H1 */}
        {ethUsd > 0 && (
          <p className="text-sm text-gray-500">
            ETH:&nbsp;
            {new Intl.NumberFormat(undefined, {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            }).format(ethUsd)}
          </p>
        )}

        <p className="text-sm text-gray-500">Range: {range}</p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Portfolio Value */}
        <div className="rounded-2xl border p-4 sm:col-span-2 lg:col-span-1">
          <div className="text-sm text-gray-500 font-medium">Portfolio Value</div>
          <div className="text-2xl font-semibold mt-1">
            {ethUsd > 0
              ? new Intl.NumberFormat(undefined, {
                  style: "currency",
                  currency: "USD",
                }).format(portfolioUsd)
              : "—"}
          </div>
          {ethUsd === 0 && (
            <div className="text-xs text-gray-500 mt-1">
              Price unavailable. Value shown when ETH price loads.
            </div>
          )}
        </div>

        {/* Balance */}
        <div className="rounded-2xl border p-4">
          <div className="text-sm text-gray-500">Balance</div>
          <div className="text-xl font-semibold">{sats(totals.balance)}</div>
        </div>

        {/* Total Received */}
        <div className="rounded-2xl border p-4">
          <div className="text-sm text-gray-500">Total Received</div>
          <div className="text-xl font-semibold">{sats(totals.totalReceived)}</div>
        </div>

        {/* Total Sent */}
        <div className="rounded-2xl border p-4">
          <div className="text-sm text-gray-500">Total Sent</div>
          <div className="text-xl font-semibold">{sats(totals.totalSent)}</div>
        </div>

        {/* Pending Δ */}
        <div className="rounded-2xl border p-4">
          <div className="text-sm text-gray-500">Pending Δ</div>
          <div className="text-xl font-semibold">{sats(totals.pendingDelta)}</div>
        </div>

        {/* Total Transactions */}
        <div className="rounded-2xl border p-4">
          <div className="text-sm text-gray-500">Total Transactions</div>
          <div className="text-xl font-semibold">{totalTxs.toLocaleString()}</div>
        </div>

        {/* Daily Change (USD) — amount + percent delta w/ icon, sourced from /api/crypto/ethereum */}
        <div className="rounded-2xl border p-4">
          <div className="text-sm text-gray-500">Daily Change</div>

          <div className="mt-1 text-xl font-semibold">
            <Delta changeFraction={changeFraction} />
          </div>
        </div>

        {/* ETH Dominance */}
        <div className="rounded-2xl border p-4">
          <div className="text-sm text-gray-500">ETH Dominance</div>
          <div className="text-xl font-semibold">{ethDominancePct}%</div>
        </div>
      </section>

      {/* --- Wallets --- */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Wallets</h2>

        {wallets.length === 0 ? (
          <div className="rounded-2xl border p-6 bg-white">
            <p className="font-medium text-black">No wallets for account, add wallets</p>
            <p className="text-sm text-black mt-1">
              Connect at least one wallet address to see portfolio stats.
            </p>
            <div className="mt-4">
              <Link
                href="/dashboard/wallets"
                className="inline-flex items-center rounded-xl border border-black px-4 py-2 text-sm font-medium text-black hover:bg-gray-100"
              >
                Go to Wallets
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-white text-black">
                  <th className="text-left p-3">Address</th>
                  <th className="text-right p-3">Balance</th>
                  <th className="text-right p-3">Received</th>
                  <th className="text-right p-3">Sent</th>
                  <th className="text-right p-3">Tx Count</th>
                </tr>
              </thead>
              <tbody>
                {wallets.map((w) => (
                  <tr key={w.address} className="border-t">
                    <td className="p-3 font-mono text-xs">{w.address}</td>
                    <td className="p-3 text-right">{sats(w.balance)}</td>
                    <td className="p-3 text-right">{sats(w.totalReceived)}</td>
                    <td className="p-3 text-right">{sats(w.totalSent)}</td>
                    <td className="p-3 text-right">{w.txCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Daily Net Flow (sample)</h2>
        <p className="text-sm text-gray-500">
          Showing the most recent 14 days from the selected range. {note ? `Note: ${note}` : ""}
        </p>
        <div className="overflow-x-auto rounded-2xl border">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-white text-black">
                <th className="text-left p-3">Date (UTC)</th>
                <th className="text-right p-3">Flow</th>
                <th className="text-right p-3">Cumulative</th>
              </tr>
            </thead>
            <tbody>
              {points.slice(-14).map((p) => (
                <tr key={p.t} className="border-t">
                  <td className="p-3">{fmtDate(p.t)}</td>
                  <td className="p-3 text-right">{sats(p.flow)}</td>
                  <td className="p-3 text-right">{sats(p.cum)}</td>
                </tr>
              ))}
              {points.length === 0 && (
                <tr>
                  <td className="p-3 text-gray-500" colSpan={3}>
                    No data for this range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
