// src/app/(dashboard)/dashboard/gold/page.tsx
import React, { Suspense } from "react";
import GoldTopTile from "@/components/GoldTopTile";
import MetalChart from "@/components/MetalsChart";
import Loading from "./loading"; // uses your spinner

export default function GoldPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<Loading />}>
        <GoldTopTile />
      </Suspense>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <Suspense fallback={<Loading />}>
            <MetalChart metal="gold" />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
