"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";

import type { Employee, Restaurant, Shift } from "@/utils/types";

interface ShiftPlannerProps {
  employees: Employee[];
  restaurants: Restaurant[];
  onAddShifts: (shifts: Partial<Shift>[]) => void;
  setActiveTab: (tab: "roster" | "monthly-tracker" | "add-shift") => void;
}

type SchedulePattern = "weekly" | "weekday" | "daily";
type ScheduleMode = "single" | "month";

export default function ShiftPlanner({
  employees,
  restaurants,
  onAddShifts,
  setActiveTab,
}: ShiftPlannerProps) {
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "");
  const [restaurantId, setRestaurantId] = useState(restaurants[0]?.id ?? "");

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");

  const [mode, setMode] = useState<ScheduleMode>("single");

  const [pattern, setPattern] = useState<SchedulePattern>("weekly");

  const createShift = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const employee = employees.find((emp) => emp.id === employeeId);

    const restaurant = restaurants.find((rest) => rest.id === restaurantId);

    if (!employee || !restaurant) return;

    const dates: string[] = [];

    if (mode === "single") {
      dates.push(date);
    } else {
      const baseDate = new Date(date);

      const year = baseDate.getFullYear();
      const month = baseDate.getMonth();

      const totalDays = new Date(year, month + 1, 0).getDate();

      for (let i = 1; i <= totalDays; i++) {
        const currentDate = new Date(year, month, i);

        const formatted = currentDate.toISOString().slice(0, 10);

        if (pattern === "daily") {
          dates.push(formatted);
        }

        if (
          pattern === "weekday" &&
          currentDate.getDay() >= 1 &&
          currentDate.getDay() <= 5
        ) {
          dates.push(formatted);
        }

        if (
          pattern === "weekly" &&
          currentDate.getDay() === baseDate.getDay()
        ) {
          dates.push(formatted);
        }
      }
    }

    const payload = dates.map((shiftDate) => ({
      employeeId: employee.id,
      employeeName: employee.name,
      role: employee.role,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      date: shiftDate,
      startTime,
      endTime,
    }));

    onAddShifts(payload);

    setActiveTab("roster");
  };

  return (
    <div className="max-w-xl mx-auto bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-4 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <Plus className="w-5 h-5 text-emerald-400" />
        </div>

        <div>
          <h3 className="text-sm font-medium text-white">
            Plan Employee Shift
          </h3>

          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
            Labor Forecasting
          </p>
        </div>
      </div>

      <form onSubmit={createShift} className="space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <SelectField
            label="Employee"
            value={employeeId}
            onChange={setEmployeeId}
          >
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Restaurant"
            value={restaurantId}
            onChange={setRestaurantId}
          >
            {restaurants.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-wider font-mono text-zinc-500">
            Scheduling Scope
          </label>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode("single")}
              className={`${mode === "single" ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" : "bg-zinc-950 border-zinc-800 text-zinc-500"} rounded-xl border py-2 text-xs transition`}
            >
              Single Shift
            </button>

            <button
              type="button"
              onClick={() => setMode("month")}
              className={`${mode === "month" ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" : "bg-zinc-950 border-zinc-800 text-zinc-500"} rounded-xl border py-2 text-xs transition`}
            >
              Monthly Plan
            </button>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <InputField
            label={mode === "single" ? "Shift Date" : "Anchor Date"}
            type="date"
            value={date}
            onChange={setDate}
          />

          {mode === "month" && (
            <SelectField
              label="Repeat Pattern"
              value={pattern}
              onChange={(value) => setPattern(value as SchedulePattern)}
            >
              <option value="weekly">Weekly</option>

              <option value="weekday">Weekdays</option>

              <option value="daily">Every Day</option>
            </SelectField>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Start Time"
            type="time"
            value={startTime}
            onChange={setStartTime}
          />

          <InputField
            label="End Time"
            type="time"
            value={endTime}
            onChange={setEndTime}
          />
        </div>

        {mode === "month" && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
            <p className="text-[10px] uppercase font-mono text-emerald-400">
              Monthly Automation
            </p>

            <p className="text-xs text-zinc-400 mt-1">
              System will generate recurring shift blocks automatically.
            </p>
          </div>
        )}

        <div className="pt-4 border-t border-zinc-800 flex gap-3">
          <button
            type="button"
            onClick={() => setActiveTab("roster")}
            className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 py-2 text-xs text-zinc-400 hover:text-white transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="flex-1 rounded-xl bg-emerald-500 py-2 text-xs font-medium text-zinc-950 flex items-center justify-center gap-2 hover:bg-emerald-400 transition"
          >
            <Check className="w-4 h-4" />
            Publish Shift
          </button>
        </div>
      </form>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] uppercase tracking-wider font-mono text-zinc-500">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/50"
      >
        {children}
      </select>
    </div>
  );
}

function InputField({
  label,
  type,
  value,
  onChange,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] uppercase tracking-wider font-mono text-zinc-500">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/50"
      />
    </div>
  );
}
