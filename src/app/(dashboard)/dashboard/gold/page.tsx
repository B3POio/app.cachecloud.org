// src/app/(dashboard)/dashboard/gold/page.tsx
import GoldTopTile from "@/components/GoldTopTile";
import MetalChart from "@/components/MetalsChart";

export default function GoldPage() {
  return (
    <div className="space-y-6">
      <GoldTopTile />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <MetalChart metal="gold" />
        </div>
      </div>
    </div>
  );
}
