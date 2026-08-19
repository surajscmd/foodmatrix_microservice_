import {
  Building2,
  ChartNoAxesCombined,
  Package,
  Store,

} from "lucide-react";

const Loginleftcol = () => {
  return (
    <div className="hidden md:flex md:col-span-6 flex-col justify-between pr-8">
      {/* Logo */}
      <div>
        <div className="flex items-center gap-3 mb-10">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 font-black text-zinc-950 shadow-[0_0_25px_rgba(16,185,129,0.35)]">
            FM
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              FoodMatrix
            </h1>

            <span className="mt-1 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
              Enterprise Edition
            </span>
          </div>
        </div>

        {/* Hero */}
        <h2 className="max-w-xl text-5xl font-black leading-tight tracking-tight text-white">
          Enterprise Operations
          <br />
          <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-400 bg-clip-text text-transparent">
            Built for Every Franchise.
          </span>
        </h2>

        <p className="mt-6 max-w-lg text-sm leading-7 text-zinc-400">
          Securely manage regional operations and restaurant workflows from one
          intelligent platform with centralized visibility, real-time analytics,
          inventory control, workforce management, and operational insights.
        </p>

        {/* Features */}
        <div className="mt-10 grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <Building2 className="mb-3 h-5 w-5 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">
              Regional Operations
            </h3>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Manage multiple restaurants from one centralized dashboard.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <Store className="mb-3 h-5 w-5 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">
              Restaurant Operations
            </h3>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Orders, kitchen, POS, inventory and daily store management.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <ChartNoAxesCombined className="mb-3 h-5 w-5 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">
              Live Analytics
            </h3>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Revenue, KPIs, customer insights and performance monitoring.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <Package className="mb-3 h-5 w-5 text-violet-400" />
            <h3 className="text-sm font-semibold text-white">
              Smart Inventory
            </h3>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Track stock, purchasing and warehouse movement in real time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loginleftcol;