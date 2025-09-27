// src/app/(dashboard)/dashboard/page.tsx
import TopTiles from "@/components/TopTiles";
import PriceChart from "@/components/PriceChart";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <TopTiles />
      <div className="grid gap-4 lg:grid-cols-2">
        <PriceChart coin="bitcoin" />
        <PriceChart coin="ethereum" />
      </div>
    </div>
  );
}
