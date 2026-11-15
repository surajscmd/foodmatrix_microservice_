import type { Metadata } from "next";
import ResetPasswordForm from "@/elements/authscr/ResetPasswordForm";
import FoodMatrixMark from "@/elements/branding/FoodMatrixMark";

export const metadata: Metadata = {
  title: "Reset password | FoodMatrix",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{
    token?: string | string[];
    error?: string | string[];
  }>;
}) {
  const { token, error } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-[#070913] p-4">
      <section className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#0c0d12] p-6 shadow-2xl sm:p-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-white">
          <FoodMatrixMark size={28} className="rounded-lg" />
          FoodMatrix
        </div>
        <h1 className="mb-5 mt-2 text-2xl font-semibold text-white">
          Reset password
        </h1>
        <ResetPasswordForm
          token={!error && typeof token === "string" ? token : null}
        />
      </section>
    </main>
  );
}
