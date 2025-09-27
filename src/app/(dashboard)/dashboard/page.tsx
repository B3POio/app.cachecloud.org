// src/app/(dashboard)/dashboard/page.tsx
import TopTiles from "@/components/TopTiles";
import PriceChart from "@/components/PriceChart";

// src/app/(dashboard)/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <TopTiles />
      <div className="grid grid-cols-1 gap-4"> {/* <- single column full width */}
        <PriceChart coin="bitcoin" />
        <PriceChart coin="ethereum" />
      </div>
    </div>
  );
}

