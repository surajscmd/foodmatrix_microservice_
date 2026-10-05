import { ArrowDown, ArrowRight, Building2, Store } from "lucide-react";

const Loginleftcol = () => {
  return (
    <div className="hidden md:flex md:col-span-6 flex-col justify-between pr-10">
      {/* Brand */}
      <div>
        <div className="flex items-center gap-3 mb-14">
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

        {/* Hero */}
        <div>
          <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.3em] text-emerald-400">
            FoodMatrix / Operations
          </p>

          <h2 className="max-w-xl text-5xl font-black leading-[1.05] tracking-tight text-white">
            Every restaurant
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-400 bg-clip-text text-transparent">
              is a system.
            </span>
          </h2>

          <p className="mt-7 max-w-lg text-sm leading-7 text-zinc-400">
            FoodMatrix brings the moving parts together — people, products,
            orders, inventory, and operations — so the entire restaurant network
            works as one.
          </p>
        </div>

        {/* Operational Architecture */}
        <div className="mt-12 max-w-lg">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500">
              Connected Operations
            </span>

            <span className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Unified
            </span>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-5">
            {/* Franchise */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                <Building2 className="h-4 w-4 text-emerald-400" />
              </div>

              <div>
                <p className="text-xs font-semibold text-white">Franchise</p>

                <p className="text-[10px] text-zinc-600">Central oversight</p>
              </div>
            </div>

            {/* Connector */}
            <div className="ml-[18px] h-7 border-l border-dashed border-zinc-700" />

            {/* Operations */}
            <div className="ml-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/5">
                <ArrowDown className="h-4 w-4 text-cyan-400" />
              </div>

              <div>
                <p className="text-xs font-semibold text-white">Operations</p>

                <p className="text-[10px] text-zinc-600">
                  Coordinated workflows
                </p>
              </div>
            </div>

            {/* Connector */}
            <div className="ml-[34px] h-7 border-l border-dashed border-zinc-700" />

            {/* Restaurant */}
            <div className="ml-8 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-sky-500/20 bg-sky-500/5">
                <Store className="h-4 w-4 text-sky-400" />
              </div>

              <div>
                <p className="text-xs font-semibold text-white">Restaurant</p>

                <p className="text-[10px] text-zinc-600">
                  Execution at the floor
                </p>
              </div>
            </div>

            {/* Bottom statement */}
            <div className="mt-6 border-t border-zinc-800 pt-4">
              <div className="flex items-center gap-2">
                <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />

                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500">
                  One operational layer
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Statement */}
      <div className="mt-10 border-t border-zinc-800/70 pt-5">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-600">
          Built for operational clarity.
        </p>
      </div>
    </div>
  );
};

export default Loginleftcol;
