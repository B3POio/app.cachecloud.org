// app/portfolio/page.tsx
import { cookies } from "next/headers";
import { headers } from "next/headers";
import ClientPortfolio from "./ClientPortfolio";

type Chain = "btc" | "eth";
type WalletItem = { id: string; chain: Chain; address: string; createdAt: number };

async function fetchWalletsOnServer(): Promise<WalletItem[]> {
  // ✅ Await headers() so you can safely call .get()
  const h = await headers();

  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const origin = `${proto}://${host}`;

  const res = await fetch(`${origin}/api/crypto/portfolio`, {
    headers: { cookie: cookies().toString() },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const data = await res.json();
  const btc = Array.isArray((data as any).bitcoin) ? (data as any).bitcoin : [];
  const eth = Array.isArray((data as any).ethereum) ? (data as any).ethereum : [];

  const normalized: WalletItem[] = [
    ...btc.map((w: any) => ({
      id: `btc-${w.createdAtMs ?? Date.now()}-${w.address}`,
      chain: "btc" as const,
      address: w.address,
      createdAt: Number(w.createdAtMs ?? Date.now()),
    })),
    ...eth.map((w: any) => ({
      id: `eth-${w.createdAtMs ?? Date.now()}-${w.address}`,
      chain: "eth" as const,
      address: w.address,
      createdAt: Number(w.createdAtMs ?? Date.now()),
    })),
  ].sort((a, b) => b.createdAt - a.createdAt);

  return normalized;
}


export default async function PortfolioPage() {
  // This await will trigger app/portfolio/loading.tsx automatically
  const initialWallets = await fetchWalletsOnServer();
  return <ClientPortfolio initialWallets={initialWallets} />;
}
