import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
// If you need Node (to read process.env reliably on edge-hosted providers), uncomment:
// export const runtime = "nodejs";

type CGSimplePrice = {
  bitcoin?: {
    usd?: number;
    usd_market_cap?: number;
    usd_24h_vol?: number;
    usd_24h_change?: number;
  };
};

type CGGlobal = {
  data?: {
    total_market_cap?: { [k: string]: number };
    market_cap_percentage?: { btc?: number };
  };
};

function num(n: unknown): number | null {
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

export async function GET() {
  try {
    // Optional key support (if you have one). CoinGecko allows unauthenticated, but this helps with rate limits.
    const headers: Record<string, string> = {
      "User-Agent": "CLM-Dashboard/1.0 (Next.js App Route)",
      // "x-cg-pro-api-key": process.env.COINGECKO_API_KEY ?? "",
      // Some accounts use "x-cg-demo-api-key"; add it if you have one:
      // "x-cg-demo-api-key": process.env.COINGECKO_DEMO_KEY ?? "",
    };
    // Remove empty headers
    Object.keys(headers).forEach((k) => !headers[k] && delete headers[k]);

    // 1) Price, market cap, volume, 24h change
    const priceUrl =
      "https://api.coingecko.com/api/v3/simple/price" +
      "?ids=bitcoin&vs_currencies=usd" +
      "&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true";

    // 2) Global data for BTC dominance (CoinGecko returns %)
    const globalUrl = "https://api.coingecko.com/api/v3/global";

    const [priceRes, globalRes] = await Promise.all([
      fetch(priceUrl, { headers, cache: "no-store" }),
      fetch(globalUrl, { headers, cache: "no-store" }),
    ]);

    if (!priceRes.ok) {
      return NextResponse.json(
        { error: "CoinGecko price request failed" },
        { status: priceRes.status }
      );
    }
    if (!globalRes.ok) {
      return NextResponse.json(
        { error: "CoinGecko global request failed" },
        { status: globalRes.status }
      );
    }

    const priceJson = (await priceRes.json()) as CGSimplePrice;
    const globalJson = (await globalRes.json()) as CGGlobal;

    const priceUsd = num(priceJson?.bitcoin?.usd);
    const marketCapUsd = num(priceJson?.bitcoin?.usd_market_cap);
    const volume24hUsd = num(priceJson?.bitcoin?.usd_24h_vol);

    // 24h change from CoinGecko is in percent (e.g. -3.42). Convert to fraction for tile (e.g. -0.0342).
    const change24hPct =
      priceJson?.bitcoin?.usd_24h_change != null
        ? Number(priceJson.bitcoin.usd_24h_change) / 100
        : null;

    // Dominance percentage from /global is already % (e.g. 51.2). Convert to fraction.
    const dominancePct =
      globalJson?.data?.market_cap_percentage?.btc != null
        ? Number(globalJson.data.market_cap_percentage.btc) / 100
        : marketCapUsd && num(globalJson?.data?.total_market_cap?.usd)
        ? marketCapUsd / Number(globalJson!.data!.total_market_cap!.usd)
        : null;

    return NextResponse.json({
      priceUsd,
      marketCapUsd,
      volume24hUsd,
      change24hPct, // fraction (±0.0342 = ±3.42%)
      dominancePct, // fraction (0.512 = 51.2%)
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Unexpected error fetching bitcoin data" },
      { status: 500 }
    );
  }
}
