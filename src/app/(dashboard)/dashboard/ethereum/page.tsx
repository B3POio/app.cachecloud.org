import EthereumTopTile from "@/components/toptiles/EthereumTopTile";
import PriceChart from "@/components/charts/PriceChart";
import Image from "next/image";

export default function EthereumPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
            <Image src={`/ethereum.png`} alt={`Ethereum`} width={20} height={20} />
            <span>Ethereum</span>
        </h1>
      </div>
      <EthereumTopTile />

        <div className="lg:col-span-2">
          <PriceChart coin="ethereum" />
        </div>

    </div>
  );
}
