import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CGSimplePrice = {
  ethereum?: {
    usd?: number;
    usd_market_cap?: number;
    usd_24h_vol?: number;
    usd_24h_change?: number; // percent, e.g. -3.42
  };
};

type CGGlobal = {
  data?: {
    total_market_cap?: Record<string, number>;
    market_cap_percentage?: { eth?: number };
  };
};

function num(n: unknown): number | null {
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

export async function GET() {
  try {
    const headers: Record<string, string> = {
      "User-Agent": "CLM-Dashboard/1.0 (Next.js App Route)",
      // Optional if you have a CoinGecko key:
      // "x-cg-pro-api-key": process.env.COINGECKO_API_KEY ?? "",
      // "x-cg-demo-api-key": process.env.COINGECKO_DEMO_KEY ?? "",
    };
    Object.keys(headers).forEach((k) => !headers[k] && delete headers[k]);

    const priceUrl =
      "https://api.coingecko.com/api/v3/simple/price" +
      "?ids=ethereum&vs_currencies=usd" +
      "&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true";

    const globalUrl = "https://api.coingecko.com/api/v3/global";

    const [priceRes, globalRes] = await Promise.all([
      fetch(priceUrl, { headers, cache: "no-store" }),
      fetch(globalUrl, { headers, cache: "no-store" }),
    ]);

    if (!priceRes.ok) {
      return NextResponse.json({ error: "CoinGecko price request failed" }, { status: priceRes.status });
    }
    if (!globalRes.ok) {
      return NextResponse.json({ error: "CoinGecko global request failed" }, { status: globalRes.status });
    }

    const priceJson = (await priceRes.json()) as CGSimplePrice;
    const globalJson = (await globalRes.json()) as CGGlobal;

    const priceUsd = num(priceJson?.ethereum?.usd);
    const marketCapUsd = num(priceJson?.ethereum?.usd_market_cap);
    const volume24hUsd = num(priceJson?.ethereum?.usd_24h_vol);

    const change24hPct =
      priceJson?.ethereum?.usd_24h_change != null
        ? Number(priceJson.ethereum.usd_24h_change) / 100
        : null;

    const dominancePct =
      globalJson?.data?.market_cap_percentage?.eth != null
        ? Number(globalJson.data.market_cap_percentage.eth) / 100
        : marketCapUsd && num(globalJson?.data?.total_market_cap?.usd)
        ? marketCapUsd / Number(globalJson.data!.total_market_cap!.usd)
        : null;

    return NextResponse.json({
      priceUsd,
      marketCapUsd,
      volume24hUsd,
      change24hPct,
      dominancePct,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Unexpected error fetching ethereum data" }, { status: 500 });
  }
}
