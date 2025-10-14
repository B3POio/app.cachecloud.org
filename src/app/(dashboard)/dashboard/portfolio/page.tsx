// src/app/(dashboard)/dashboard/portfolio/page.tsx
import { headers } from "next/headers";
import Link from "next/link";

export const dynamic = "force-dynamic";

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

  const [summary, chart] = await Promise.all([
    fetchJSON<SummaryResponse>("/api/crypto/portfolio?view=summary"),
    fetchJSON<ChartResponse>("/api/crypto/portfolio?view=chart&range=30d"),
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

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-8">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold">Bitcoin Portfolio</h1>
        <p className="text-sm text-gray-500">Range: {range}</p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border p-4">
          <div className="text-sm text-gray-500">Balance</div>
          <div className="text-xl font-semibold">{sats(totals.balance)}</div>
        </div>
        <div className="rounded-2xl border p-4">
          <div className="text-sm text-gray-500">Total Received</div>
          <div className="text-xl font-semibold">{sats(totals.totalReceived)}</div>
        </div>
        <div className="rounded-2xl border p-4">
          <div className="text-sm text-gray-500">Total Sent</div>
          <div className="text-xl font-semibold">{sats(totals.totalSent)}</div>
        </div>
        <div className="rounded-2xl border p-4">
          <div className="text-sm text-gray-500">Pending Δ</div>
          <div className="text-xl font-semibold">{sats(totals.pendingDelta)}</div>
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
