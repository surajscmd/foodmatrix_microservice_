import { ArrowUpRight } from "lucide-react";
import type { Staff } from "@/lib/hr-api";
import { Status } from "./shared";

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
      <thead className="border-y border-white/8 bg-[#191c22] text-[11px] font-medium text-zinc-300">
        <tr>
          <th scope="col" className="px-3 py-2.5 @xl:w-[37%] @xl:px-4">
            Employee
          </th>
          <th scope="col" className="hidden w-[23%] px-3 py-2.5 @xl:table-cell">
            Job role
          </th>
          <th
            scope="col"
            className="hidden w-[15%] px-3 py-2.5 @3xl:table-cell"
          >
            Employee code
          </th>
          <th scope="col" className="w-24 px-2 py-2.5 @xl:w-28">
            Status
          </th>
          <th scope="col" className="w-12 @xl:w-28">
            <span className="sr-only">Profile</span>
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/7">
        {staff.map((employee) => {
          const name = `${employee.firstName} ${employee.lastName}`;
          return (
            <tr
              key={employee.id}
              className="group bg-[#111217] transition-colors even:bg-[#14161c] hover:bg-[#162522] focus-within:bg-[#162522]"
            >
              <th scope="row" className="px-3 py-2 @xl:px-4">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    aria-hidden
                    className="hidden size-8 shrink-0 place-items-center rounded-lg border border-teal-300/20 bg-teal-300/10 text-[11px] font-semibold uppercase text-teal-100 @md:grid"
                  >
                    {employee.firstName[0]}
                    {employee.lastName[0]}
                  </span>
                  <div className="min-w-0">
                    <span className="block break-words text-xs font-semibold text-zinc-100">
                      {name}
                    </span>
                    <span className="mt-0.5 block break-words text-[11px] font-normal text-zinc-400 @xl:hidden">
                      {employee.role}
                    </span>
                    <span className="mt-0.5 block break-all font-mono text-[11px] font-normal text-zinc-400 @3xl:hidden">
                      {employee.employeeCode}
                    </span>
                  </div>
                </div>
              </th>
              <td className="hidden break-words px-3 py-2 text-xs text-zinc-300 @xl:table-cell">
                {employee.role}
              </td>
              <td className="hidden break-all px-3 py-2 font-mono text-[11px] text-zinc-300 @3xl:table-cell">
                {employee.employeeCode}
              </td>
              <td className="px-2 py-2">
                <Status value={employee.status} />
              </td>
              <td className="py-2 pr-3 text-right @xl:pr-4">
                <button
                  type="button"
                  aria-label={`Open profile for ${name}`}
                  onClick={() => onOpen(employee)}
                  className="inline-flex min-h-8 items-center gap-1 rounded-md border border-white/10 bg-white/4 px-2 text-xs font-medium whitespace-nowrap text-zinc-200 hover:border-emerald-300/35 hover:text-emerald-200 focus-visible:outline-2 focus-visible:outline-emerald-300"
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
