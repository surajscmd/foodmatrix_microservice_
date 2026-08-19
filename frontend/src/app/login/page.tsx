import LoginForm from "@/elements/authscr/Loginform";
import { Buttomstats } from "@/elements/authscr/Buttomstats";
import Loginleftcol from "@/elements/authscr/Loginleftcol";
import Link from "next/link";

export default function LoginScreen() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#070913] relative overflow-hidden px-4 py-12">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.06),transparent_45%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.04),transparent_40%)]" />

      <div className="w-full max-w-6xl grid md:grid-cols-12 gap-8 items-center z-10">
        {/* Left Side */}
        <Loginleftcol />

        {/* Right Side */}
        <div className="md:col-span-6 w-full max-w-md mx-auto flex flex-col justify-start gap-0">
          <div className="bg-[#0c0d12] border border-zinc-800/80 rounded-2xl p-6 lg:p-8 shadow-2xl relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full" />

            {/* Mobile Logo */}
            <div className="flex items-center gap-2 mb-6 md:hidden">
              <div className="w-7 h-7 bg-emerald-500 rounded flex items-center justify-center text-zinc-950 font-bold italic text-xs">
                FM
              </div>

              <span className="text-lg font-bold text-white">FoodMatrix</span>
            </div>

            {/* Portal discription */}
            <div className="mb-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                The Central Command for Your Franchise.
              </span>

              {/* <h2 className="mt-5 text-3xl font-bold tracking-tight text-white">
                The Central Command for Your Franchise.
              </h2> */}

              <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-white">
                      Identity & Access Management
                    </p>

                    <p className="mt-1 text-[11px] text-zinc-500">
                      Authentication • Authorization • Role Verification
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-medium text-emerald-400">
                      Online
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Unified operations, real-time insights, and complete business
                visibility.
              </p>
            </div>

            {/* Login Form */}
            <LoginForm />

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
              <span className="text-[9px] text-zinc-500 font-mono">
                SECURE GATEWAY • ENCRYPTED CONNECTION
              </span>
            </div>
            <Link
              href="/restaurant/edge-dashboard"
              className="flex items-center gap-3 my-10 rounded-xl bg-green-500/10 px-3 py-2.5 text-sm font-semibold text-green-400 ring-1 ring-green-500/20"
            >
              <span className="mx-auto">Resturent dashboard</span>
            </Link>
             <Link
              href="/operations/info"
              className="flex items-center gap-3 my-10 rounded-xl bg-green-500/10 px-3 py-2.5 text-sm font-semibold text-green-400 ring-1 ring-green-500/20"
            >
              <span className="mx-auto">Central Operations</span>
            </Link>
          </div>
          {/* Bottom Status */}
          {/* <Buttomstats /> */}
        </div>
      </div>
    </div>
  );
}
