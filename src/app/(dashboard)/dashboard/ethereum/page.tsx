import EthereumTopTile from "@/components/EthereumTopTile";
import PriceChart from "@/components/PriceChart";

export default function EthereumPage() {
  return (
    <div className="space-y-6">
      <EthereumTopTile />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <PriceChart coin="ethereum" />
        </div>
      </div>
    </div>
  );
}
