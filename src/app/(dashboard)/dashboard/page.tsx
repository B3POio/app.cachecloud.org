// src/app/(dashboard)/dashboard/page.tsx
import TopTiles from "@/components/TopTiles";
import PriceChart from "@/components/PriceChart";
import MetalsChart from "@/components/MetalsChart";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <TopTiles />

      {/* Full-width Bitcoin chart */}
      <PriceChart coin="bitcoin" className="w-full" />

      {/* Full-width Ethereum chart */}
      <PriceChart coin="ethereum" className="w-full" />

      {/* Full-width Gold chart */}
      <MetalsChart metal="gold" className="w-full" />

      {/* Full-width Silver chart */}
      <MetalsChart metal="silver" className="w-full" />
    </div>
  );
}
