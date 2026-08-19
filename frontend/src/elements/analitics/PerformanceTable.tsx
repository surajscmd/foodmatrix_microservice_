"use client";

import { Star } from "lucide-react";

interface PerformanceLog {
  date: string;
  receipts: number;
  avgTicket: number;
  waste: string;
  rating: number;
  score: string;
}

interface PerformanceTableProps {
  logs: PerformanceLog[];
  searchTerm: string;
}

export default function PerformanceTable({
  logs,
  searchTerm,
}: PerformanceTableProps) {
  const filteredLogs = logs.filter(
    (log) =>
      log.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.score.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50">

      {/* Header */}

      <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">

        <div>

          <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-zinc-500">
            Business Intelligence
          </p>

          <h3 className="mt-1 text-lg font-semibold text-white">
            Daily Performance Ledger
          </h3>

        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1">

          <span className="text-xs font-semibold text-zinc-400">
            {filteredLogs.length} Records
          </span>

        </div>

      </div>

      {filteredLogs.length === 0 ? (
        <div className="flex h-44 items-center justify-center">

          <p className="font-mono text-sm text-zinc-500">
            No records found.
          </p>

        </div>
      ) : (
        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="border-b border-zinc-800 bg-zinc-950/40">

              <tr className="text-left">

                <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-wide text-zinc-500">
                  Date
                </th>

                <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-wide text-zinc-500">
                  Revenue
                </th>

                <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-wide text-zinc-500">
                  Avg Ticket
                </th>

                <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-wide text-zinc-500">
                  Waste
                </th>

                <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-wide text-zinc-500">
                  Rating
                </th>

                <th className="px-6 py-4 text-right font-mono text-[10px] uppercase tracking-wide text-zinc-500">
                  Score
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredLogs.map((log) => (

                <tr
                  key={log.date}
                  className="border-b border-zinc-800/60 transition-colors hover:bg-zinc-800/20"
                >

                  <td className="px-6 py-5">

                    <span className="font-semibold text-white">
                      {log.date}
                    </span>

                  </td>

                  <td className="px-6 py-5">

                    <span className="font-semibold text-emerald-400">
                      ${log.receipts.toLocaleString("en-IN")}
                    </span>

                  </td>

                  <td className="px-6 py-5 text-zinc-300">
                    ${log.avgTicket.toFixed(2)}
                  </td>

                  <td className="px-6 py-5">

                    <span className="rounded-md bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-300">
                      {log.waste}
                    </span>

                  </td>

                  <td className="px-6 py-5">

                    <div className="flex items-center gap-1">

                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />

                      <span className="font-semibold text-white">
                        {log.rating}
                      </span>

                    </div>

                  </td>

                  <td className="px-6 py-5 text-right">

                    <span
                      className={`inline-flex rounded-lg px-3 py-1 text-xs font-bold ${
                        Number(log.score.replace("%", "")) >= 95
                          ? "bg-emerald-500/10 text-emerald-400"
                          : Number(log.score.replace("%", "")) >= 90
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {log.score}
                    </span>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>
      )}
    </section>
  );
}