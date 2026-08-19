import { ShieldCheck, Users } from 'lucide-react';

export const Buttomstats = () => {
  return (
       <div className="mt-2 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <span className="text-sm font-semibold text-white">
                  Platform Status
                </span>
              </div>

              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Operational
              </span>
            </div>

            <div className="grid grid-cols-3 gap-8 justify-items-center items-cente ">
              <div>
                <div className="text-2xl font-bold text-white">24</div>
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  Regions
                </div>
              </div>

              <div>
                <div className="text-2xl font-bold text-white">860+</div>
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  Restaurants
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-400" />
                  <span className="text-2xl font-bold text-white">18K+</span>
                </div>

                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  Employees
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-zinc-800 pt-4 text-xs text-zinc-500">
              Last synchronization completed successfully.
            </div>
          </div>
  )
}
