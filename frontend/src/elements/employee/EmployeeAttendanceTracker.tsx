'use client';
import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Employee, Shift, AttendanceLog } from '../../utils/types';

interface Props {
  trackerEmp: Employee;
  setTrackerEmp: (emp: Employee | null) => void;
  employees: Employee[];
  shifts: Shift[];
  attendanceLogs: AttendanceLog[];
}

const monthsList = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function EmployeeAttendanceTracker({ trackerEmp, setTrackerEmp, employees, shifts, attendanceLogs }: Props) {
  const [trackerYear, setTrackerYear] = useState(2026);
  const [trackerMonth, setTrackerMonth] = useState(6); // 0-indexed, 6 = July
  const [selectedDay, setSelectedDay] = useState<number | null>(17);

  // Calendar Math
  const firstDayDate = new Date(trackerYear, trackerMonth, 1);
  const firstDayOfWeek = firstDayDate.getDay(); 
  const daysInSelectedMonth = new Date(trackerYear, trackerMonth + 1, 0).getDate();
  
  const blanks = Array.from({ length: firstDayOfWeek }, () => null);
  const days = Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1);
  const calendarGrid = [...blanks, ...days];

  const getDayData = (day: number) => {
    const dateString = `${trackerYear}-${String(trackerMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const shift = shifts.find(sh => sh.employeeId === trackerEmp.id && sh.date === dateString);
    const log = attendanceLogs.find(l => {
      const logDate = new Date(l.checkIn).toISOString().substring(0, 10);
      return l.employeeId === trackerEmp.id && logDate === dateString;
    });
    return { shift, log, dateString };
  };

  // KPI Calculations
  let scheduledCount = 0;
  let completedCount = 0;
  let hoursAccumulated = 0;
  let lateCount = 0;
  let noShowCount = 0;

  for (let d = 1; d <= daysInSelectedMonth; d++) {
    const { shift, log, dateString } = getDayData(d);
    if (shift) {
      scheduledCount++;
      if (shift.status === 'Completed' || (log && log.checkOut)) {
        completedCount++;
      } else if (dateString < '2026-07-17' && !log) {
        noShowCount++;
      }
    }
    if (log) {
      if (log.status === 'Late') lateCount++;
      if (log.checkOut) {
        const durationMs = new Date(log.checkOut).getTime() - new Date(log.checkIn).getTime();
        hoursAccumulated += Math.max(0, durationMs / (1000 * 60 * 60));
      }
    }
  }

  const selectedData = selectedDay ? getDayData(selectedDay) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header / Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800">
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => setTrackerEmp(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 hover:text-white text-xs font-mono font-bold rounded-xl border border-zinc-800 cursor-pointer transition-all shadow-sm"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>Back to Staff Registry</span>
          </button>
          <div className="pt-1.5">
            <h2 className="text-md font-semibold text-white flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-emerald-400" />
              <span>Monthly Attendance Tracker</span>
            </h2>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Operator: <span className="text-emerald-400 font-bold">{trackerEmp.name}</span> ({trackerEmp.role})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Employee Switcher */}
          <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 min-w-[200px] w-full lg:w-auto">
            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">OPERATOR:</span>
            <select
              value={trackerEmp.id}
              onChange={(e) => {
                const emp = employees.find(emp => emp.id === e.target.value);
                if (emp) {
                  setTrackerEmp(emp);
                  setSelectedDay(17);
                }
              }}
              className="bg-transparent border-none text-xs text-white focus:outline-none font-semibold w-full cursor-pointer"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id} className="bg-zinc-950 text-zinc-300">
                  {emp.name} ({emp.role})
                </option>
              ))}
            </select>
          </div>

          {/* Month Controls */}
          <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-1 w-full lg:w-auto justify-between lg:justify-start">
            <button
              onClick={() => {
                if (trackerMonth === 0) {
                  setTrackerMonth(11);
                  setTrackerYear(prev => prev - 1);
                } else {
                  setTrackerMonth(prev => prev - 1);
                }
                setSelectedDay(1);
              }}
              className="p-1 hover:bg-zinc-900 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-zinc-200 px-4 min-w-[110px] text-center">
              {monthsList[trackerMonth]} {trackerYear}
            </span>
            <button
              onClick={() => {
                if (trackerMonth === 11) {
                  setTrackerMonth(0);
                  setTrackerYear(prev => prev + 1);
                } else {
                  setTrackerMonth(prev => prev + 1);
                }
                setSelectedDay(1);
              }}
              className="p-1 hover:bg-zinc-900 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Summary Block */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-xl">
          <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold block">Shifts Scheduled</span>
          <h4 className="text-sm font-bold font-mono text-white mt-1">{scheduledCount} shifts</h4>
        </div>
        <div className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-xl">
          <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold block text-emerald-400">Completed Shifts</span>
          <h4 className="text-sm font-bold font-mono text-emerald-400 mt-1">{completedCount} shifts</h4>
        </div>
        <div className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-xl">
          <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold block text-cyan-400">Hours Logged</span>
          <h4 className="text-sm font-bold font-mono text-cyan-400 mt-1">{hoursAccumulated.toFixed(1)} hrs</h4>
        </div>
        <div className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-xl">
          <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold block text-amber-400">Lateness Log</span>
          <h4 className="text-sm font-bold font-mono text-amber-400 mt-1">{lateCount} times</h4>
        </div>
        <div className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-xl col-span-2 md:col-span-1">
          <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold block text-rose-400">Unexcused Absences</span>
          <h4 className="text-sm font-bold font-mono text-rose-400 mt-1">{noShowCount} days</h4>
        </div>
      </div>

      {/* Calendar & Audit Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Grid (Col 8) */}
        <div className="lg:col-span-8 bg-zinc-900/30 border border-zinc-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="text-xs font-bold font-mono text-zinc-300 uppercase tracking-wider">Attendance Calendar</span>
            <span className="text-[10px] text-zinc-500 font-mono">Click a day to audit logs</span>
          </div>
          
          <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-mono text-zinc-500 uppercase font-bold pb-1">
            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {calendarGrid.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} className="aspect-square bg-zinc-950/20 rounded-lg" />;
              
              const { shift, log, dateString } = getDayData(day);
              const isSelected = selectedDay === day;

              let cellStyle = "bg-zinc-950/40 border-zinc-850 text-zinc-400";
              let statusLabel = "Rest Day";
              let statusDot = "";

              if (shift && !log) {
                if (dateString >= '2026-07-17') {
                  cellStyle = "bg-zinc-950 border-cyan-500/20 text-cyan-400";
                  statusLabel = "Scheduled"; statusDot = "bg-cyan-400";
                } else {
                  cellStyle = "bg-rose-500/5 border-rose-500/20 text-rose-400";
                  statusLabel = "Absent"; statusDot = "bg-rose-500";
                }
              } else if (log) {
                if (!log.checkOut) {
                  cellStyle = "bg-emerald-500/5 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]";
                  statusLabel = "On Duty"; statusDot = "bg-emerald-400 animate-pulse";
                } else if (log.status === 'Late') {
                  cellStyle = "bg-amber-500/5 border-amber-500/30 text-amber-400";
                  statusLabel = "Late Check"; statusDot = "bg-amber-400";
                } else {
                  cellStyle = "bg-emerald-950/20 border-emerald-500/20 text-emerald-400";
                  statusLabel = "Completed"; statusDot = "bg-emerald-500";
                }
              }

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`aspect-square p-2 border rounded-xl flex flex-col justify-between text-left transition-all relative ${cellStyle} ${isSelected ? 'ring-2 ring-emerald-400 border-transparent' : ''}`}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="text-xs font-mono font-bold">{day}</span>
                    {statusDot && <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />}
                  </div>
                  <div className="space-y-0.5">
                    {shift && <span className="text-[8px] font-mono block opacity-80 truncate">{shift.startTime}</span>}
                    <span className="text-[7px] font-mono font-bold uppercase block opacity-70 truncate max-w-full">{statusLabel}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Audit Details Console (Col 4) */}
        <div className="lg:col-span-4 bg-zinc-900/30 border border-zinc-800 p-6 rounded-2xl space-y-4">
          <div className="border-b border-zinc-800 pb-3">
            <span className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider block">Day Audit Console</span>
            <h4 className="text-xs font-semibold text-white mt-1">
              {selectedDay ? `${monthsList[trackerMonth]} ${selectedDay}, ${trackerYear}` : 'Select a Day'}
            </h4>
          </div>

          {selectedData ? (() => {
            const { shift, log, dateString } = selectedData;
            
            return (
              <div className="space-y-4">
                {/* Status Ribbon */}
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-850 text-xs">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold block">Consolidated Status</span>
                  <div className="flex items-center gap-2 mt-1 font-bold">
                    {!shift && !log && (
                      <span className="text-zinc-500">Rest Day (Unscheduled Off)</span>
                    )}
                    {shift && !log && (
                      dateString >= '2026-07-17' ? (
                        <span className="text-cyan-400">Scheduled (Upcoming Shift)</span>
                      ) : (
                        <span className="text-rose-400">Unexcused No-Show / Absent</span>
                      )
                    )}
                    {log && (
                      log.checkOut ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          Present & Complete {log.status === 'Late' && <span className="text-amber-400">({log.status})</span>}
                        </span>
                      ) : (
                        <span className="text-emerald-400 animate-pulse flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                          Active On Duty
                        </span>
                      )
                    )}
                  </div>
                </div>

                {/* Planned Schedule Block */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold block">Planned Schedule Details</span>
                  <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-850 space-y-2">
                    {shift ? (
                      <>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-400">Target Shift Block:</span>
                          <span className="font-mono font-bold text-white">{shift.startTime} - {shift.endTime}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] border-t border-zinc-850 pt-1.5">
                          <span className="text-zinc-550">Scheduled Node:</span>
                          <span className="text-zinc-300 font-medium truncate max-w-[150px]">{shift.restaurantName}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-zinc-550">Planned Duration:</span>
                          <span className="text-zinc-300 font-mono">8.0 hrs</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-[11px] text-zinc-500 font-mono py-1">Zero shifts planned for this date block.</p>
                    )}
                  </div>
                </div>

                {/* Actual Swipe Logs */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold block">Actual Terminal Log</span>
                  <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-850 space-y-2">
                    {log ? (
                      <>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-400">Punch In:</span>
                            <span className="font-mono text-zinc-200">
                              {new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>
                          {log.checkOut && (
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-zinc-400">Punch Out:</span>
                              <span className="font-mono text-zinc-200">
                                {new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-center text-[11px] border-t border-zinc-850 pt-1.5">
                          <span className="text-zinc-550">Calculated Hours:</span>
                          <span className="font-mono font-bold text-emerald-400">
                            {log.checkOut ? (
                              `${((new Date(log.checkOut).getTime() - new Date(log.checkIn).getTime()) / (1000 * 60 * 60)).toFixed(2)} hrs`
                            ) : (
                              'In Progress'
                            )}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-zinc-550">Tardiness Factor:</span>
                          <span className={`font-mono font-bold ${log.status === 'Late' ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
                            {log.status}
                          </span>
                        </div>
                      </>
                    ) : (
                      <p className="text-[11px] text-zinc-550 font-mono py-1">No punch records found on this date.</p>
                    )}
                  </div>
                </div>

                {/* Diagnostic Context Guidance */}
                <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl text-[10px] font-mono text-zinc-500 leading-normal">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">AUDIT ASSISTANCE</span>
                  {shift && !log && dateString < '2026-07-17' && (
                    <p className="text-rose-400/90 font-bold">⚠️ Staff failed to log punches for planned scheduled block. Flagged for review.</p>
                  )}
                  {log && log.status === 'Late' && (
                    <p className="text-amber-400/90 font-bold">⚠️ Employee logged entry past scheduled threshold tolerance. Lateness added to profile.</p>
                  )}
                  {!shift && log && (
                    <p className="text-purple-400/90">ℹ️ Swiped check-in without an assigned roster. Flagged as unscheduled backup duty.</p>
                  )}
                  {shift && log && (
                    <p className="text-emerald-500/90">✓ Verified scheduled hours completed cleanly. Perfect match in operational ledger.</p>
                  )}
                  {!shift && !log && (
                    <p>ℹ️ Regular weekend/midweek rest day. No labor tracking active.</p>
                  )}
                </div>
              </div>
            );
          })() : (
            <div className="py-12 text-center text-zinc-500 text-xs font-mono">
              Click any day on the calendar to audit specific shift logs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}