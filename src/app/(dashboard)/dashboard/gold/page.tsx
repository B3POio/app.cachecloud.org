// src/app/(dashboard)/dashboard/gold/page.tsx
import React from "react";
import GoldTopTile from "@/components/toptiles/GoldTopTile";
import MetalChart from "@/components/charts/MetalsChart";

export default function GoldPage() {
  return (
    <div className="space-y-6">
        <GoldTopTile />
        <div className="grid grid-cols-1 gap-6">
            <MetalChart metal="gold" />
        </div>
    </div>
  );
}
