// app/(dashboard)/dashboard/wallets/page.tsx
import { cookies, headers } from "next/headers";
import ClientWallets from "./ClientWallets";

type Chain = "btc" | "eth";
type WalletItem = { id: string; chain: Chain; address: string; createdAt: number };

async function fetchWalletsOnServer(): Promise<WalletItem[]> {
  // ✅ Await dynamic APIs
  const h = await headers();
  const c = await cookies();

  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const origin = `${proto}://${host}`;

  const res = await fetch(`${origin}/api/crypto/wallets`, {
    cache: "no-store",
    headers: {
      // ✅ Must await cookies() before using its value
      cookie: c.toString(),
      // (optional) forward auth header if present
      ...(h.get("authorization") ? { authorization: h.get("authorization")! } : {}),
      accept: "application/json",
    },
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

export default async function WalletPage() {
  const initialWallets = await fetchWalletsOnServer();
  return <ClientWallets initialWallets={initialWallets} />;
}
