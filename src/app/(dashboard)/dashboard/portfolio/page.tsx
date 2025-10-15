import Link from "next/link";
import { headers } from "next/headers";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export const dynamic = "force-dynamic";

// ======================= Types (string-friendly) =======================
type Integerish = string | number; // backend may send bigint-as-string

type CoinStats = {
  priceUsd?: number | null;
  change24h?: number | null;     // fraction (e.g., 0.034)
  change24hPct?: number | null;  // percent (e.g., 3.4)
};

type WalletStat = {
  address: string;
  totalReceived: Integerish; // sats or wei
  totalSent: Integerish;
  balance: Integerish;
  pendingDelta: Integerish;
  txCount: number;
};

type SummaryResponse = {
  totals: {
    balance: Integerish;
    totalReceived: Integerish;
    totalSent: Integerish;
    pendingDelta: Integerish;
  };
  wallets: WalletStat[];
};

type ChartPoint = { t: number | string; flow: Integerish; cum: Integerish };
type ChartResponse = { range: string; points: ChartPoint[]; note?: string };

// ======================= Helpers =======================
function toNum(n: unknown): number {
  const x = typeof n === "string" ? Number(n) : (n as number);
  return Number.isFinite(x) ? x : 0;
}
function toNumNull(n: unknown): number | null {
  const x = typeof n === "string" ? Number(n) : typeof n === "number" ? n : NaN;
  return Number.isFinite(x) ? x : null;
}
function formatPercent(fraction: number | null | undefined) {
  return fraction == null ? "—" : `${(fraction * 100).toFixed(2)}%`;
}
function formatIntegerish(x: Integerish): string {
  // Coerce to integer string and group
  let s = typeof x === "string" ? x : Math.trunc(Number(x)).toString();
  s = s.replace(/[^\d-]/g, ""); // strip anything weird
  const neg = s.startsWith("-");
  const abs = neg ? s.slice(1) : s;
  const grouped = abs.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return neg ? `-${grouped}` : grouped;
}
function sats(n: Integerish) { return `${formatIntegerish(n)} sats`; }

// ---- ETH formatting (wei -> ETH) with BigInt-safe rounding ----
function toBigIntClean(x: Integerish): { neg: boolean; abs: bigint } {
  let s = typeof x === "string" ? x : Math.trunc(Number(x)).toString();
  s = s.trim();
  let neg = false;
  if (s.startsWith("-")) {
    neg = true;
    s = s.slice(1);
  }
  s = s.replace(/[^\d]/g, "");
  if (s.length === 0) s = "0";
  return { neg, abs: BigInt(s) };
}
function groupThousands(s: string): string {
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
/**
 * Format wei as ETH string like "1,234.56789 ETH".
 * - BigInt-precise conversion.
 * - Rounds to `places` decimals (default 6).
 * - Trims trailing zeros.
 */
function eth(x: Integerish, places = 6): string {
  const { neg, abs } = toBigIntClean(x);
  const WEI_PER_ETH = 10n ** 18n;

  let intPart = abs / WEI_PER_ETH;
  let frac = abs % WEI_PER_ETH; // 0..(1e18-1)

  // fractional 18-digit, zero-padded
  let frac18 = frac.toString().padStart(18, "0");

  // rounding to `places` decimals
  if (places > 0) {
    const keep = frac18.slice(0, places);
    const next = frac18.slice(places, places + 1); // digit for rounding
    let rounded = keep;
    if (next && next >= "5") {
      // add 1 to the kept string as integer with carry
      let carry = 1;
      const arr = keep.split("");
      for (let i = arr.length - 1; i >= 0; i--) {
        const d = arr[i].charCodeAt(0) - 48 + carry;
        if (d >= 10) {
          arr[i] = "0";
          carry = 1;
        } else {
          arr[i] = String(d);
          carry = 0;
          break;
        }
      }
      if (carry === 1) {
        // 9.999 -> carry to integer part
        intPart = intPart + 1n;
        rounded = "0".repeat(places);
      } else {
        rounded = arr.join("");
      }
    }
    // trim trailing zeros
    rounded = rounded.replace(/0+$/, "");
    const intStr = groupThousands(intPart.toString());
    const sign = neg ? "-" : "";
    return rounded ? `${sign}${intStr}.${rounded} ETH` : `${sign}${intStr} ETH`;
  } else {
    // no decimals
    if (frac >= 5n * (10n ** 17n)) {
      intPart = intPart + 1n; // round half-up
    }
    const sign = neg ? "-" : "";
    return `${sign}${groupThousands(intPart.toString())} ETH`;
  }
}

// Accepts either unix seconds or "YYYY-MM-DD"
function fmtDate(t: number | string): string {
  if (typeof t === "number" && Number.isFinite(t)) {
    return new Date(t * 1000).toISOString().slice(0, 10);
  }
  if (typeof t === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
    const n = Number(t);
    if (Number.isFinite(n)) return new Date(n * 1000).toISOString().slice(0, 10);
    const d = new Date(t);
    if (!Number.isNaN(+d)) return d.toISOString().slice(0, 10);
    return t;
  }
  return "—";
}

function Delta({ changeFraction }: { changeFraction: number | null | undefined }) {
  if (changeFraction == null) return <span className="text-muted-foreground">—</span>;
  const positive = changeFraction >= 0;
  return (
    <span className={`flex items-center gap-1 ${positive ? "text-green-600" : "text-red-600"}`}>
      {positive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
      {formatPercent(changeFraction)}
    </span>
  );
}

async function makeBaseAndHeaders() {
  const h = await headers();
  const proto =
    h.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");
  const host =
    h.get("x-forwarded-host") ??
    h.get("host") ??
    process.env.VERCEL_URL ??
    "localhost:3000";
  const base = host.startsWith("http") ? host : `${proto}://${host}`;

  const forwardHeaders: Record<string, string> = { accept: "application/json" };
  const cookie = h.get("cookie");
  const authorization = h.get("authorization");
  if (cookie) forwardHeaders.cookie = cookie;
  if (authorization) forwardHeaders.authorization = authorization;

  return { base, forwardHeaders };
}

async function fetchJSON<T>(base: string, path: string, headers: Record<string,string>) {
  const res = await fetch(`${base}${path}`, { cache: "no-store", headers });
  let data: T | undefined;
  try { data = (await res.json()) as T; } catch {}
  return { ok: res.ok, status: res.status, data };
}

// ======================= BTC & ETH Views =======================
async function BitcoinView() {
  const { base, forwardHeaders } = await makeBaseAndHeaders();
  const [summary, chart, stats] = await Promise.all([
    fetchJSON<SummaryResponse>(base, "/api/crypto/portfolio/bitcoin?view=summary", forwardHeaders),
    fetchJSON<ChartResponse>(base, "/api/crypto/portfolio/bitcoin?view=chart&range=30d", forwardHeaders),
    fetchJSON<CoinStats>(base, "/api/crypto/bitcoin", forwardHeaders),
  ]);

  if (summary.status === 401 || chart.status === 401) {
    return (
      <main className="mx-auto max-w-3xl p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Bitcoin Portfolio</h1>
        <div className="rounded-2xl border p-6 bg-amber-50">
          <p className="font-medium">Please sign in to view your portfolio.</p>
          <p className="text-sm text-gray-600 mt-1">Your session couldn’t be validated. Log in and refresh.</p>
        </div>
      </main>
    );
  }

  const totals = summary.data?.totals ?? { balance: 0, totalReceived: 0, totalSent: 0, pendingDelta: 0 };
  const wallets = summary.data?.wallets ?? [];
  const points = chart.data?.points ?? [];
  const range = chart.data?.range ?? "30d";

  const btcUsd = toNumNull(stats.data?.priceUsd) ?? 0;
  const changeFraction =
    typeof stats.data?.change24h === "number"
      ? stats.data?.change24h
      : typeof stats.data?.change24hPct === "number"
      ? (toNum(stats.data?.change24hPct) / 100)
      : null;

  // sats -> BTC -> USD
  const portfolioUsd = btcUsd > 0 ? (toNum(totals.balance) / 1e8) * btcUsd : 0;
  const totalTxs = wallets.reduce((sum, w) => sum + (typeof w.txCount === "number" ? w.txCount : 0), 0);

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-8">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold">Bitcoin Portfolio</h1>
        {btcUsd > 0 && (
          <p className="text-sm text-gray-500">
            BTC: {new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(btcUsd)}
          </p>
        )}
        <p className="text-sm text-gray-500">Range: {range}</p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Portfolio Value" value={btcUsd > 0 ? new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(portfolioUsd) : "—"} wide />
        <Tile label="Balance" value={sats(totals.balance)} />
        <Tile label="Total Received" value={sats(totals.totalReceived)} />
        <Tile label="Total Sent" value={sats(totals.totalSent)} />
        <Tile label="Pending Δ" value={sats(totals.pendingDelta)} />
        <Tile label="Total Transactions" value={totalTxs.toLocaleString()} />
        <div className="rounded-2xl border p-4">
          <div className="text-sm text-gray-500">Daily Change</div>
          <div className="mt-1 text-xl font-semibold"><Delta changeFraction={changeFraction} /></div>
        </div>
        <Tile label="BTC Dominance" value="100%" />
      </section>

      <WalletsTable wallets={wallets} unitFmt={sats} unitLabel="sats" />
      <FlowTable points={points} unitFmt={sats} unitLabel="sats" />
    </main>
  );
}

async function EthereumView() {
  const { base, forwardHeaders } = await makeBaseAndHeaders();
  const [summary, chart, stats] = await Promise.all([
    fetchJSON<SummaryResponse>(base, "/api/crypto/portfolio/ethereum?view=summary", forwardHeaders),
    fetchJSON<ChartResponse>(base, "/api/crypto/portfolio/ethereum?view=chart&range=30d", forwardHeaders),
    fetchJSON<CoinStats>(base, "/api/crypto/ethereum", forwardHeaders),
  ]);

  if (summary.status === 401 || chart.status === 401) {
    return (
      <main className="mx-auto max-w-3xl p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Ethereum Portfolio</h1>
        <div className="rounded-2xl border p-6 bg-amber-50">
          <p className="font-medium">Please sign in to view your portfolio.</p>
          <p className="text-sm text-gray-600 mt-1">Your session couldn’t be validated. Log in and refresh.</p>
        </div>
      </main>
    );
  }

  const totals = summary.data?.totals ?? { balance: "0", totalReceived: "0", totalSent: "0", pendingDelta: "0" };
  const wallets = summary.data?.wallets ?? [];
  const points = chart.data?.points ?? [];
  const range = chart.data?.range ?? "30d";

  const ethUsd = toNumNull(stats.data?.priceUsd) ?? 0;
  const changeFraction =
    typeof stats.data?.change24h === "number"
      ? stats.data?.change24h
      : typeof stats.data?.change24hPct === "number"
      ? (toNum(stats.data?.change24hPct) / 100)
      : null;

  // wei -> ETH -> USD (USD calc is coarse with Number, OK for UI)
  const portfolioUsd = ethUsd > 0 ? (toNum(totals.balance) / 1e18) * ethUsd : 0;
  const totalTxs = wallets.reduce((sum, w) => sum + (typeof w.txCount === "number" ? w.txCount : 0), 0);

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-8">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold">Ethereum Portfolio</h1>
        {ethUsd > 0 && (
          <p className="text-sm text-gray-500">
            ETH: {new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(ethUsd)}
          </p>
        )}
        <p className="text-sm text-gray-500">Range: {range}</p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Portfolio Value" value={ethUsd > 0 ? new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(portfolioUsd) : "—"} wide />
        <Tile label="Balance" value={eth(totals.balance)} />
        <Tile label="Total Received" value={eth(totals.totalReceived)} />
        <Tile label="Total Sent" value={eth(totals.totalSent)} />
        <Tile label="Pending Δ" value={eth(totals.pendingDelta)} />
        <Tile label="Total Transactions" value={totalTxs.toLocaleString()} />
        <div className="rounded-2xl border p-4">
          <div className="text-sm text-gray-500">Daily Change</div>
          <div className="mt-1 text-xl font-semibold"><Delta changeFraction={changeFraction} /></div>
        </div>
        <Tile label="ETH Dominance" value="100%" />
      </section>

      <WalletsTable wallets={wallets} unitFmt={(n) => eth(n)} unitLabel="ETH" />
      <FlowTable points={points} unitFmt={(n) => eth(n)} unitLabel="ETH" />
    </main>
  );
}

// ======================= Reusable UI bits =======================
function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
function StatTile({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${wide ? "sm:col-span-2 lg:col-span-1" : ""}`}>
      <div className="text-sm text-gray-500 font-medium">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function WalletsTable({
  wallets,
  unitFmt,
  unitLabel,
}: {
  wallets: WalletStat[];
  unitFmt: (n: Integerish) => string;
  unitLabel: string;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Wallets</h2>
      <div className="overflow-x-auto rounded-2xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Address</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">Balance ({unitLabel})</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">Received ({unitLabel})</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">Sent ({unitLabel})</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">Pending Δ</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">Tx Count</th>
            </tr>
          </thead>
          <tbody>
            {wallets.map((w) => (
              <tr key={w.address} className="border-t">
                <td className="px-4 py-2 font-mono text-xs">{w.address}</td>
                <td className="px-4 py-2 text-right">{unitFmt(w.balance)}</td>
                <td className="px-4 py-2 text-right">{unitFmt(w.totalReceived)}</td>
                <td className="px-4 py-2 text-right">{unitFmt(w.totalSent)}</td>
                <td className="px-4 py-2 text-right">{unitFmt(w.pendingDelta)}</td>
                <td className="px-4 py-2 text-right">{w.txCount.toLocaleString()}</td>
              </tr>
            ))}
            {wallets.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  No wallets found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FlowTable({
  points,
  unitFmt,
  unitLabel,
}: {
  points: ChartPoint[];
  unitFmt: (n: Integerish) => string;
  unitLabel: string;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Daily Net Flow</h2>
      <div className="overflow-x-auto rounded-2xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Date (UTC)</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">Flow ({unitLabel})</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">Cumulative ({unitLabel})</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p, i) => (
              <tr key={`${p.t}-${i}`} className="border-t">
                <td className="px-4 py-2">{fmtDate(p.t)}</td>
                <td className="px-4 py-2 text-right">{unitFmt(p.flow)}</td>
                <td className="px-4 py-2 text-right">{unitFmt(p.cum)}</td>
              </tr>
            ))}
            {points.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                  No data for selected range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ======================= Main Switcher =======================
export default async function PortfolioSwitcherPage({
  searchParams,
}: {
  // Next 15 async dynamic APIs: this is a Promise
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const chainRaw = Array.isArray(sp.chain) ? sp.chain[0] : sp.chain;
  const chain = (chainRaw || "btc").toLowerCase();
  const isEth = chain === "eth";

  return (
    <div>
      {/* Tabs */}
      <div className="mx-auto max-w-4xl px-6 pt-6">
        <div className="inline-flex items-center gap-2 rounded-xl border p-1 bg-white">
          <Link
            href="?chain=btc"
            className={`px-3 py-1.5 rounded-lg text-sm ${!isEth ? "bg-black text-white" : "text-black"}`}
          >
            Bitcoin
          </Link>
          <Link
            href="?chain=eth"
            className={`px-3 py-1.5 rounded-lg text-sm ${isEth ? "bg-black text-white" : "text-black"}`}
          >
            Ethereum
          </Link>
        </div>
      </div>

      {isEth ? await EthereumView() : await BitcoinView()}
    </div>
  );
}
