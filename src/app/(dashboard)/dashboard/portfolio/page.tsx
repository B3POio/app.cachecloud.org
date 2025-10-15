// src/app/(dashboard)/dashboard/portfolio/page.tsx
import { headers } from "next/headers";
import Link from "next/link";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export const dynamic = "force-dynamic";

type NullableNum = number | null | undefined;

/** Match BitcoinTopTile semantics for change props: prefer fractional change24h, else change24hPct/100 */
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
  btc: { usd: number };
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
  chain: "btc";
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
  chain: "btc";
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

/** ---------- Robust BTC/USD extraction (no header changes) ---------- */
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

/** Deep scan helper: finds a numeric value under keys that look like BTC & USD. */
function deepFindBtcUsd(obj: any): number {
  if (!obj || typeof obj !== "object") return 0;

  // 1) Common explicit shapes
  if (obj?.btc?.usd) return toNum(obj.btc.usd);
  if (obj?.data?.btc?.usd) return toNum(obj.data.btc.usd);
  if (obj?.markets?.BTC?.usd) return toNum(obj.markets.BTC.usd);
  if (obj?.BTC?.USD) return toNum(obj.BTC.USD);
  if (obj?.price?.BTC?.USD) return toNum(obj.price.BTC.USD);
  if (obj?.btcUsd) return toNum(obj.btcUsd);
  if (obj?.priceUsd) return toNum(obj.priceUsd);
  if (obj?.btc_price) return toNum(obj.btc_price);

  // 2) Heuristic search
  const isObj = (v: any) => v && typeof v === "object";

  // Try two-level BTC -> USD
  for (const [k, v] of Object.entries(obj)) {
    if (!isObj(v)) continue;
    const kLower = k.toLowerCase();
    const looksBtc = kLower === "btc" || kLower.includes("bitcoin") || kLower.includes("btc");
    if (looksBtc && isObj(v)) {
      const usdDirect = (v as any).usd ?? (v as any).USD;
      if (usdDirect != null) return toNum(usdDirect);

      if (isObj((v as any).price)) {
        const p = (v as any).price;
        if (p.usd != null) return toNum(p.usd);
        if (p.USD != null) return toNum(p.USD);
      }
    }
  }

  // Single-key combined forms like BTCUSD / btc_usd / btcPriceUsd
  for (const [k, v] of Object.entries(obj)) {
    const kLower = k.toLowerCase();
    const combined =
      (kLower.includes("btc") && kLower.includes("usd")) ||
      kLower === "btcusd" ||
      kLower === "btc_usd" ||
      kLower === "btcpriceusd";
    if (combined) {
      const val = toNum(v as any);
      if (val > 0) return val;
    }
  }

  // 3) Recurse
  for (const v of Object.values(obj)) {
    if (isObj(v)) {
      const found = deepFindBtcUsd(v);
      if (found > 0) return found;
    }
  }

  return 0;
}

function extractBtcUsd(payload: any): number {
  if (!payload) return 0;
  return deepFindBtcUsd(payload);
}

/** ---------- 24h BTC price change extractor (pct as decimal) ---------- */
function toPctLike(x: number): number {
  // If API returns 2.5 meaning 2.5%, convert to 0.025; if it's 0.025 already, keep.
  const ax = Math.abs(x);
  if (ax > 1.5 && ax <= 1000) return x / 100;
  return x;
}

function deepFindBtcChange24hPct(obj: any): number | null {
  if (!obj || typeof obj !== "object") return null;

  // Prefer explicit fractional or percent-like fields.
  const tryList = [
    obj?.btc?.change24h,
    obj?.btc?.change_24h,
    obj?.btc?.change24hPct,
    obj?.btc?.percent_change_24h,
    obj?.btc?.pct24h,
    obj?.btc?.price_change_percentage_24h,   // Coingecko style under btc
    obj?.btc?.usd_24h_change_pct,            // explicit pct
    obj?.data?.btc?.change24h,
    obj?.data?.btc?.percent_change_24h,
    obj?.data?.btc?.price_change_percentage_24h,
    obj?.markets?.BTC?.change24h,
    obj?.markets?.BTC?.percent_change_24h,
    obj?.markets?.BTC?.price_change_percentage_24h,
    obj?.BTC?.change24hPct,
    obj?.price?.BTC?.change24hPct,
    obj?.btcChange24hPct,
    obj?.btc_24h_pct,
    obj?.price_change_percentage_24h,        // top-level passthrough
  ];

  for (const v of tryList) {
    const n = toNumNull(v);
    if (n !== null) return toPctLike(n); // accept 0 as valid
  }

  // Heuristic: look for BTC-ish keys nesting 24h change
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === "object") {
      const kLower = k.toLowerCase();
      if (kLower.includes("btc") || kLower.includes("bitcoin")) {
        const nested = deepFindBtcChange24hPct(v);
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
      const nested = deepFindBtcChange24hPct(v);
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

  // Include /api/crypto/bitcoin to mirror BitcoinTopTile behavior
  const [summary, chart, crypto, btcStatsRes] = await Promise.all([
    fetchJSON<SummaryResponse>("/api/crypto/portfolio?view=summary"),
    fetchJSON<ChartResponse>("/api/crypto/portfolio?view=chart&range=30d"),
    fetchJSON<CryptoSummary>("/api/crypto/summary"),
    fetchJSON<CoinStats>("/api/crypto/bitcoin"),
  ]);

  if (summary.status === 401 || chart.status === 401) {
    return (
      <main className="mx-auto max-w-3xl p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Bitcoin Portfolio</h1>
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

  // BTC price from summary as fallback...
  const btcUsdFromSummary =
    extractBtcUsd(crypto.data) ||
    extractBtcUsd(crypto as unknown as Record<string, unknown>);

  // ...but prefer the bitcoin endpoint for parity with BitcoinTopTile
  const btcStats = btcStatsRes.data ?? null;
  const btcUsdFromStats = toNumNull(btcStats?.priceUsd) ?? null;

  const btcUsd =
    typeof btcUsdFromStats === "number" && btcUsdFromStats > 0
      ? btcUsdFromStats
      : btcUsdFromSummary;

  const portfolioUsd = btcUsd > 0 ? (totals.balance / 100_000_000) * btcUsd : 0;

  // ---- Daily Change (% + USD) — sourced from /api/crypto/bitcoin to mirror BitcoinTopTile ----
  const changeFractionFromStats =
    typeof btcStats?.change24h === "number"
      ? btcStats.change24h
      : typeof btcStats?.change24hPct === "number"
      ? (btcStats.change24hPct as number) / 100
      : null;

  // Fallback to heuristic extraction from /api/crypto/summary if stats missing
  const pct24hFallback =
    deepFindBtcChange24hPct(crypto.data) ??
    deepFindBtcChange24hPct(crypto as unknown as Record<string, unknown>);

  const changeFraction =
    changeFractionFromStats != null ? changeFractionFromStats : pct24hFallback;

  const btcDailyChangeUsd =
    changeFraction != null && btcUsd > 0 ? btcUsd * changeFraction : null;

  const dailyChangeUsd = btcDailyChangeUsd ?? null;

  // BTC dominance (single-asset for now = 100%)
  const btcDominancePct = 100;

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-8">
      {/* Header */}
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold">Bitcoin Portfolio</h1>

        {/* BTC price under H1 */}
        {btcUsd > 0 && (
          <p className="text-sm text-gray-500">
            BTC:&nbsp;
            {new Intl.NumberFormat(undefined, {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            }).format(btcUsd)}
          </p>
        )}

        <p className="text-sm text-gray-500">Range: {range}</p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Portfolio Value */}
        <div className="rounded-2xl border p-4 sm:col-span-2 lg:col-span-1">
          <div className="text-sm text-gray-500 font-medium">Portfolio Value</div>
          <div className="text-2xl font-semibold mt-1">
            {btcUsd > 0
              ? new Intl.NumberFormat(undefined, {
                  style: "currency",
                  currency: "USD",
                }).format(portfolioUsd)
              : "—"}
          </div>
          {btcUsd === 0 && (
            <div className="text-xs text-gray-500 mt-1">
              Price unavailable. Value shown when BTC price loads.
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

        {/* Daily Change (USD) — amount + percent delta w/ icon, sourced from /api/crypto/bitcoin */}
        <div className="rounded-2xl border p-4">
          <div className="text-sm text-gray-500">Daily Change</div>

          <div className="mt-1 text-xl font-semibold">
            <Delta changeFraction={changeFraction} />
          </div>
        </div>

        {/* BTC Dominance */}
        <div className="rounded-2xl border p-4">
          <div className="text-sm text-gray-500">BTC Dominance</div>
          <div className="text-xl font-semibold">{btcDominancePct}%</div>
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
