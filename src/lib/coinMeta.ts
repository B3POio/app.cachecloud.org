// src/lib/coinMeta.ts
export const coinMeta: Record<"bitcoin" | "ethereum", { color: string; logo: string; name: string }> = {
  bitcoin: {
    name: "Bitcoin (BTC)",
    color: "#F7931A",
    logo: "/coins/bitcoin.svg",
  },
  ethereum: {
    name: "Ethereum (ETH)",
    color: "#627EEA",
    logo: "/coins/ethereum.svg",
  },
};
