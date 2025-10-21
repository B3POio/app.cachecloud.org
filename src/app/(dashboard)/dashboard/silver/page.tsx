// src/app/(dashboard)/dashboard/silver/page.tsx
import React, { Suspense } from "react";
import TopTile from "@/components/SilverTopTile";
import MetalChart from "@/components/MetalsChart";
import Loading from "./loading";

export default function SilverPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<Loading />}>
        <TopTile />
      </Suspense>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <Suspense fallback={<Loading />}>
            <MetalChart metal="silver" />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
