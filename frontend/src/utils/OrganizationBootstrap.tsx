"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { useOrganizationStore } from "@/store/organization-store";

export default function OrganizationBootstrap({
  children,
}: {
  children: ReactNode;
}) {
  const isHydrated = useOrganizationStore((state) => state.isHydrated);
  const error = useOrganizationStore((state) => state.error);
  const restoreWorkspace = useOrganizationStore(
    (state) => state.restoreWorkspace,
  );

  useEffect(() => {
    if (!isHydrated) void restoreWorkspace();
  }, [isHydrated, restoreWorkspace]);

  if (!isHydrated) {
    return (
      <div
        role="status"
        className="flex min-h-44 items-center justify-center gap-2 text-sm text-zinc-300"
      >
        <LoaderCircle
          size={16}
          className="animate-spin text-emerald-400"
          aria-hidden
        />
        Loading your workspace…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
        <p
          role="alert"
          className="flex items-start gap-2 text-sm text-zinc-200"
        >
          <CircleAlert
            size={17}
            className="mt-0.5 shrink-0 text-amber-300"
            aria-hidden
          />
          {error}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-xs font-medium text-emerald-200 hover:bg-emerald-400/20 focus-visible:outline-emerald-400"
            onClick={() => void restoreWorkspace()}
          >
            Retry
          </button>
          <Link
            href="/login"
            className="text-xs text-zinc-400 hover:text-white"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
