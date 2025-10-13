// src/app/api/crypto/summary/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getApiUrl } from "@/lib/getApiUrl";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 60;
export const runtime = "nodejs"; // ensure Node runtime for server fetch

async function getAuthHeader(req: Request) {
  const hdr = req.headers.get("authorization");
  if (hdr?.startsWith("Bearer ")) return hdr;

  const store = await cookies(); // async in newer Next
  const token =
    store.get("__session")?.value ||
    store.get("idToken")?.value ||
    undefined;

  return token ? `Bearer ${token}` : undefined;
}

export async function GET(req: Request) {
  try {
    const API_BASE = getApiUrl();
    const auth = await getAuthHeader(req);
    if (!auth) {
      return NextResponse.json(
        {
          error: "Missing Authorization bearer token",
          hint:
            "Send Authorization: Bearer <ID_TOKEN> header, or set an HttpOnly __session/idToken cookie after sign-in.",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const symbols = searchParams.get("symbols") ?? "BTC,ETH";

    const [summaryRes, globalRes] = await Promise.all([
      fetch(`${API_BASE}/api/crypto/summary?symbols=${encodeURIComponent(symbols)}`, {
        headers: { Authorization: auth },
        // @ts-ignore next: revalidate option supported in app router
        next: { revalidate },
      }),
      fetch(`${API_BASE}/api/crypto/global`, {
        headers: { Authorization: auth },
        // @ts-ignore
        next: { revalidate },
      }),
    ]);

    if (!summaryRes.ok) {
      const txt = await summaryRes.text();
      return NextResponse.json(
        { error: "summary failed", detail: txt },
        { status: summaryRes.status }
      );
    }
    if (!globalRes.ok) {
      const txt = await globalRes.text();
      return NextResponse.json(
        { error: "global failed", detail: txt },
        { status: globalRes.status }
      );
    }

    const summary = await summaryRes.json(); // { symbols, data:[{symbol, priceUsd, ...}], updatedAt }
    const global = await globalRes.json();   // { marketCapUsd, ... }

    // Back-compat shape for your UI:
    // { bitcoin: { usd }, ethereum: { usd }, global_market_cap }
    const slugMap: Record<string, string> = { BTC: "bitcoin", ETH: "ethereum" };
    const out: Record<string, any> = {};

    for (const row of summary.data || []) {
      const sym = String(row.symbol || "").toUpperCase();
      const slug = slugMap[sym] ?? sym.toLowerCase(); // handle extras gracefully
      out[slug] = { usd: row.priceUsd ?? null };
    }
    out.global_market_cap = global?.marketCapUsd ?? null;

    return NextResponse.json(out, { status: 200 });
  } catch (err: any) {
    console.error("[/api/crypto/summary] proxy failed:", err?.message || err);
    return NextResponse.json({ error: "Failed", detail: err?.message }, { status: 500 });
  }
}
