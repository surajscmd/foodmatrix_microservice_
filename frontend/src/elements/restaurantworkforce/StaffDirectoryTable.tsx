import { ArrowUpRight } from "lucide-react";
import type { Staff } from "@/lib/hr-api";

export default function StaffDirectoryTable({
  staff,
  onOpen,
}: {
  staff: Staff[];
  onOpen: (staff: Staff) => void;
}) {
  return (
    <table className="w-full table-fixed text-left">
      <caption className="sr-only">Restaurant staff</caption>
      <thead className="border-y border-zinc-800 bg-zinc-950/80 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-600">
        <tr>
          <th scope="col" className="px-3 py-3 @xl:w-[34%] @xl:px-5">
            Employee
          </th>
          <th scope="col" className="hidden w-[23%] px-3 py-3 @xl:table-cell">
            Job role
          </th>
          <th scope="col" className="hidden w-[18%] px-3 py-3 @3xl:table-cell">
            Employee code
          </th>
          <th scope="col" className="w-28 px-2 py-3 @xl:w-28">
            Status
          </th>
          <th
            scope="col"
            className="w-12 py-3 pr-3 text-right @xl:w-28 @xl:pr-5"
          >
            <span className="hidden @xl:inline">Profile</span>
            <span className="sr-only @xl:hidden">Profile</span>
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-800/70">
        {staff.map((employee) => {
          const name = `${employee.firstName} ${employee.lastName}`;
          const statusTone =
            employee.status === "ACTIVE"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
              : employee.status === "ON_LEAVE"
                ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                : "border-red-500/20 bg-red-500/10 text-red-400";
          const statusDot =
            employee.status === "ACTIVE"
              ? "bg-emerald-400"
              : employee.status === "ON_LEAVE"
                ? "bg-amber-400"
                : "bg-red-400";
          return (
            <tr
              key={employee.id}
              className="group transition-colors duration-200 hover:bg-zinc-900/80 focus-within:bg-zinc-900/80"
            >
              <th scope="row" className="px-3 py-4 @xl:px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden
                    className="relative hidden size-10 shrink-0 place-items-center rounded-xl border border-zinc-800 bg-zinc-900 text-[11px] font-semibold uppercase text-emerald-400 transition-colors group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10 @md:grid"
                  >
                    {employee.firstName[0]}
                    {employee.lastName[0]}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-zinc-950 ${statusDot}`}
                    />
                  </span>
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => onOpen(employee)}
                      className="block rounded text-left text-sm font-medium leading-5 text-zinc-100 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-300"
                    >
                      {name}
                    </button>
                    <span className="mt-0.5 block break-words text-[11px] font-normal text-zinc-400 @xl:hidden">
                      {employee.role.replaceAll("_", " ")}
                    </span>
                    <span className="mt-0.5 block break-all font-mono text-[11px] font-normal text-zinc-400 @3xl:hidden">
                      {employee.employeeCode}
                    </span>
                  </div>
                </div>
              </th>
              <td className="hidden break-words px-3 py-4 text-xs text-zinc-400 @xl:table-cell">
                {employee.role.replaceAll("_", " ")}
              </td>
              <td className="hidden break-all px-3 py-4 font-mono text-[10px] text-zinc-500 @3xl:table-cell">
                {employee.employeeCode}
              </td>
              <td className="px-2 py-4">
                <span
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider ${statusTone}`}
                >
                  <span
                    aria-hidden
                    className="size-1.5 rounded-full bg-current"
                  />
                  {employee.status.replaceAll("_", " ")}
                </span>
              </td>
              <td className="py-4 pr-3 text-right @xl:pr-5">
                <button
                  type="button"
                  aria-label={`Open profile for ${name}`}
                  onClick={() => onOpen(employee)}
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 text-[11px] font-medium whitespace-nowrap text-zinc-400 transition-colors hover:border-emerald-500/30 hover:bg-zinc-900 hover:text-emerald-300 focus-visible:outline-2 focus-visible:outline-emerald-300"
                >
                  <span className="hidden @xl:inline">Profile</span>
                  <ArrowUpRight size={14} aria-hidden />
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
