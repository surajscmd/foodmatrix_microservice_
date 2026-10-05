"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Home, LockKeyhole } from "lucide-react";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070a13] px-6 text-white">
      <div className="w-full max-w-xl text-center">
        {/* Status */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/5 px-4 py-2">
          <LockKeyhole className="h-4 w-4 text-red-400" />

          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-red-400">
            ACCESS DENIED
          </span>
        </div>

        {/* Error Code */}
        <div className="relative">
          <h1 className="select-none font-mono text-[110px] font-black leading-none tracking-[-0.08em] text-zinc-800 sm:text-[150px]">
            403
          </h1>

          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-xl border border-zinc-800 bg-[#070a13]/90 px-4 py-2 font-mono text-xs uppercase tracking-[0.25em] text-zinc-400 backdrop-blur">
              Restricted Area
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="mt-4">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            You don&apos;t have access to this portal.
          </h2>

          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-zinc-500">
            Your current account does not have the required permissions
            to access this resource. Contact your administrator if you
            believe this is incorrect.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 px-5 py-3 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>

          <button
            type="button"
            onClick={() => router.replace("/")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            <Home className="h-4 w-4" />
            Go Home
          </button>
        </div>

        {/* Footer */}
        <div className="mt-12 border-t border-zinc-900 pt-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-700">
            FoodMatrix Security Gateway
          </p>
        </div>
      </div>
    </main>
  );
}
