import TopTiles from "@/components/TopTiles";
import PriceChart from "@/components/PriceChart";
import MetalsChart from "@/components/MetalsChart";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <TopTiles />

      {/* Bitcoin and Ethereum side by side only on xl screens */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <PriceChart coin="bitcoin" className="w-full" />
        <PriceChart coin="ethereum" className="w-full" />
      </div>

      {/* Gold and Silver side by side only on xl screens */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <MetalsChart metal="gold" className="w-full" />
        <MetalsChart metal="silver" className="w-full" />
      </div>
    </div>
  );
}
