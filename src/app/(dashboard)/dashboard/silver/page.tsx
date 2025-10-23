// src/app/(dashboard)/dashboard/silver/page.tsx
import React from "react";
import TopTile from "@/components/toptiles/SilverTopTile";
import MetalChart from "@/components/charts/MetalsChart";

export default function SilverPage() {
  return (
    <div className="space-y-6">
        <TopTile />

        <div className="grid grid-cols-1 gap-6">
            <MetalChart metal="silver" />
        </div>
    </div>
  );
}
