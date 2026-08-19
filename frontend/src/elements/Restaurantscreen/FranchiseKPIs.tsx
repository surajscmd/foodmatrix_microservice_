"use client";

interface KPIs {
  totalStores: number;
  operationalCount: number;
  avgRating: string;
  totalRevenue: number;
}

export default function FranchiseKPIs({ kpis }: { kpis: KPIs }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
        <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Deployments Total</span>
        <h3 className="text-xl font-semibold text-white mt-1">{kpis.totalStores} nodes</h3>
      </div>
      <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
        <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Operational Heartbeat</span>
        <h3 className="text-xl font-semibold text-emerald-400 mt-1">{kpis.operationalCount} live</h3>
      </div>
      <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
        <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Avg Rating Index</span>
        <h3 className="text-xl font-semibold text-amber-400 mt-1">{kpis.avgRating} / 5.0</h3>
      </div>
      <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
        <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Monthly Franchise Cap</span>
        <h3 className="text-xl font-semibold text-white mt-1">${(kpis.totalRevenue / 1000000).toFixed(2)}M</h3>
      </div>
    </div>
  );
}