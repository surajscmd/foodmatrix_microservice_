"use client";

import { useMemo, useState } from "react";
import { ChevronDown, User, Timer, ShieldCheck, Terminal } from "lucide-react";

import type { AttendanceLog, Employee } from "@/utils/types";

interface PunchStationProps {
  employees: Employee[];
  attendanceLogs: AttendanceLog[];
  searchTerm: string;
  onPunchIn: (employeeId: string) => void;
}

export default function PunchStation({
  employees,
  attendanceLogs,
  searchTerm,
  onPunchIn,
}: PunchStationProps) {
  const [selectedEmployee, setSelectedEmployee] = useState(
    employees[0]?.id ?? "",
  );

  const [employeeOpen, setEmployeeOpen] = useState(false);

  const filteredEmployees = useMemo(() => {
    return employees.filter(
      (employee) =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.role.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [employees, searchTerm]);

  const activePunch = (employeeId: string) =>
    attendanceLogs.find(
      (log) => log.employeeId === employeeId && !log.checkOut,
    );

  const selectedEmployeeData = employees.find(
    (emp) => emp.id === selectedEmployee,
  );

  return (
    <div className="lg:col-span-5 space-y-5">
      {/* TERMINAL STATUS */}

      <div
        className="
        rounded-2xl 
        border border-zinc-800
        bg-zinc-900/40
        p-5
      "
      >
        <div className="flex items-center gap-3">
          <div
            className="
            w-12 h-12
            rounded-xl
            bg-emerald-500/10
            border border-emerald-500/20
            flex items-center justify-center
          "
          >
            <Terminal className="w-6 h-6 text-emerald-400" />
          </div>

          <div>
            <span
              className="
              text-[10px]
              uppercase
              tracking-widest
              font-mono
              text-zinc-500
            "
            >
              Edge Device
            </span>

            <h2
              className="
              mt-1
              text-sm
              font-semibold
              text-white
            "
            >
              Biometric Punch Terminal
            </h2>
          </div>
        </div>
      </div>

      {/* EMPLOYEE SELECTOR */}

      <div
        className="
        rounded-2xl
        border border-zinc-800
        bg-zinc-900/40
        p-5
        space-y-5
      "
      >
        <div>
          <span
            className="
            text-[10px]
            uppercase
            tracking-widest
            font-mono
            text-zinc-500
          "
          >
            Employee
          </span>

          <h3
            className="
            mt-1
            text-sm
            font-semibold
            text-white
          "
          >
            Select Staff Member
          </h3>
        </div>

        {/* CUSTOM SELECT */}

        <div className="relative">
          <button
            type="button"
            onClick={() => setEmployeeOpen(!employeeOpen)}
            className="
              w-full
              flex
              items-center
              justify-between
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              px-4
              py-3
              hover:border-emerald-500/40
              transition
            "
          >
            <div className="flex items-center gap-3">
              <div
                className="
                w-9
                h-9
                rounded-full
                bg-emerald-500/10
                border
                border-emerald-500/20
                flex
                items-center
                justify-center
              "
              >
                <User className="w-4 h-4 text-emerald-400" />
              </div>

              <div className="text-left">
                <p className="text-sm text-white font-medium">
                  {selectedEmployeeData?.name ?? "Select Employee"}
                </p>

                <p className="text-xs text-zinc-500">
                  {selectedEmployeeData?.role ?? "Choose staff member"}
                </p>
              </div>
            </div>

            <ChevronDown
              className={`
                w-4 h-4
                text-zinc-500
                transition-transform
                ${employeeOpen ? "rotate-180" : ""}
              `}
            />
          </button>

          {employeeOpen && (
            <div
              className="
              absolute
              z-50
              top-full
              mt-2
              w-full
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              shadow-2xl
              overflow-hidden
            "
            >
              <div
                className="
                max-h-64
                overflow-y-auto
                p-2
              "
              >
                {filteredEmployees.map((employee) => {
                  const punched = activePunch(employee.id);

                  return (
                    <button
                      key={employee.id}
                      disabled={!!punched}
                      onClick={() => {
                        setSelectedEmployee(employee.id);
                        setEmployeeOpen(false);
                      }}
                      className={`
                        w-full
                        flex
                        items-center
                        justify-between
                        px-3
                        py-3
                        rounded-lg
                        transition

                        ${
                          punched
                            ? "opacity-40 cursor-not-allowed"
                            : "hover:bg-zinc-900"
                        }

                        ${
                          selectedEmployee === employee.id
                            ? "bg-emerald-500/10"
                            : ""
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="
                          w-8
                          h-8
                          rounded-full
                          bg-zinc-900
                          border
                          border-zinc-800
                          flex
                          items-center
                          justify-center
                          text-xs
                          font-semibold
                          text-zinc-300
                        "
                        >
                          {employee.name.charAt(0)}
                        </div>

                        <div className="text-left">
                          <p className="text-sm text-white">{employee.name}</p>

                          <p className="text-xs text-zinc-500">
                            {employee.role}
                          </p>
                        </div>
                      </div>

                      {punched && (
                        <span
                          className="
                          text-[11px]
                          text-orange-400
                          bg-orange-400/10
                          px-2
                          py-1
                          rounded-md
                        "
                        >
                          On Duty
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* EMPLOYEE INFO */}

        {selectedEmployeeData && (
          <div className="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-950 to-zinc-900/60 p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                {selectedEmployeeData.name.charAt(0)}
              </div>

              <div>
                <p className="text-sm font-semibold text-white">
                  {selectedEmployeeData.name}
                </p>

                <p className="text-xs text-zinc-500">Identity Verified</p>
              </div>

              <div className="ml-auto px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Ready
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
              <p className="text-[12px] uppercase tracking-wider text-zinc-500">
                Assigned Role
              </p>

              <p className="text-xs font-medium text-white">
                {selectedEmployeeData.role}
              </p>
            </div>
          </div>
        )}

        {/* ACTION */}

        <button
          onClick={() => {
            if (selectedEmployee) {
              onPunchIn(selectedEmployee);
            }
          }}
          disabled={!selectedEmployee || !!activePunch(selectedEmployee)}
          className="
            w-full
            rounded-xl
            bg-emerald-500
            py-3
            font-bold
            uppercase
            text-slate-950
            transition
            hover:bg-emerald-400
            disabled:bg-zinc-800
            disabled:text-zinc-600
            disabled:cursor-not-allowed
            flex
            items-center
            justify-center
            gap-2
          "
        >
          <Timer className="w-4 h-4" />
          Swipe Card In
        </button>
      </div>

      {/* GUIDE */}

      <div
        className="
        rounded-2xl
        border border-zinc-800
        bg-zinc-900/40
        p-5
      "
      >
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />

          <h3 className="text-sm font-semibold text-white">
            Terminal Procedure
          </h3>
        </div>

        <div
          className="
          space-y-3
          text-sm
          text-zinc-500
        "
        >
          <p>1. Select an employee.</p>

          <p>2. Verify badge identity.</p>

          <p>
            3. Press
            <strong className="text-white"> Swipe Card In</strong>.
          </p>

          <p>
            4. Use attendance board for
            <strong className="text-white"> Swipe Out</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
