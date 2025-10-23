// src/app/(dashboard)/dashboard/gold/page.tsx
import React, { Suspense } from "react";
import GoldTopTile from "@/components/toptiles/GoldTopTile";
import MetalChart from "@/components/charts/MetalsChart";
import Loading from "./loading"; // uses your spinner

export default function GoldPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<Loading />}>
        <GoldTopTile />
      </Suspense>

        <div className="grid grid-cols-1 gap-6">
          <Suspense fallback={<Loading />}>
            <MetalChart metal="gold" />
          </Suspense>
        </div>
    </div>
  );
}
