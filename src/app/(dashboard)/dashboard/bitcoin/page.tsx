// src/app/(dashboard)/dashboard/bitcoin/page.tsx
import BitcoinTopTile from "@/components/BitcoinTopTile";
import PriceChart from "@/components/PriceChart";

export default function BitcoinPage() {
  return (
    <div className="space-y-6">
      <BitcoinTopTile />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <PriceChart coin="bitcoin" />
        </div>
      </div>
    </div>
  );
}
