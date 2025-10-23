// src/app/(dashboard)/dashboard/silver/page.tsx
import React, { Suspense } from "react";
import TopTile from "@/components/SilverTopTile";
import MetalChart from "@/components/charts/MetalsChart";
import Loading from "./loading";

export default function SilverPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<Loading />}>
        <TopTile />
      </Suspense>

        <div className="grid grid-cols-1 gap-6">
          <Suspense fallback={<Loading />}>
            <MetalChart metal="silver" />
          </Suspense>
        </div>
    </div>
  );
}
