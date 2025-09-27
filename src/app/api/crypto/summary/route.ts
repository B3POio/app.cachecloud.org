// src/app/api/crypto/summary/route.ts
import { NextResponse } from "next/server";

export const revalidate = 60; // cache 60s

export async function GET() {
  try {
    const [pricesRes, globalRes] = await Promise.all([
      fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd", { next: { revalidate } }),
      fetch("https://api.coingecko.com/api/v3/global", { next: { revalidate } }),
    ]);
    const prices = await pricesRes.json();
    const global = await globalRes.json();
    const globalCap: number | null = global?.data?.total_market_cap?.usd ?? null;
    return NextResponse.json({ ...prices, global_market_cap: globalCap });
  } catch (err) {
    console.error("[/api/crypto/summary] fetch failed:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
