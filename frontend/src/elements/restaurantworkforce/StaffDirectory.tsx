import { useCallback, useDeferredValue, useState } from "react";
import { Search, UserPlus, UsersRound, X } from "lucide-react";
import {
  getStaffByRestaurant,
  type EmployeeStatus,
  type Staff,
} from "@/lib/hr-api";
import StaffProfile from "./StaffProfile";
import StaffForm from "./StaffForm";
import StaffDirectoryTable from "./StaffDirectoryTable";
import {
  Empty,
  ErrorNote,
  input,
  panel,
  Pagination,
  primary,
  secondary,
  useWorkforceQuery,
} from "./shared";

const pageSize = 12;
const statusOptions = [
  { value: "", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "ON_LEAVE", label: "On leave" },
  { value: "TERMINATED", label: "Terminated" },
] as const;

export default function StaffDirectory({
  restaurantId,
  currency,
  today,
  timeZone,
}: {
  restaurantId: string;
  currency: string;
  today: string;
  timeZone: string;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<EmployeeStatus | "">("");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [employee, setEmployee] = useState<Staff>();
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState("");
  const query = useDeferredValue(search.trim());
  const load = useCallback(
    async () =>
      (
        await getStaffByRestaurant(restaurantId, page, pageSize, {
          search: query || undefined,
          status: status || undefined,
          directory: true,
        })
      ).data,
    [page, query, restaurantId, status],
  );
  const { data, error, loading } = useWorkforceQuery(
    `${restaurantId}/${page}/${query}/${status}/${revision}`,
    load,
    "Unable to load staff.",
  );

  function profileSaved(staff: Staff, message: string) {
    if (staff.status !== employee?.status) setPage(1);
    setEmployee(staff);
    setAdding(false);
    setNotice(message);
    setRevision((value) => value + 1);
  }

  function clearFilters() {
    setSearch("");
    setStatus("");
    setPage(1);
  }

  if (employee) {
    return (
      <StaffProfile
        key={employee.id}
        employee={employee}
        currency={currency}
        today={today}
        timeZone={timeZone}
        notice={notice}
        onClose={() => {
          setEmployee(undefined);
          setNotice("");
        }}
        onSave={profileSaved}
        onArchive={(message) => {
          setEmployee(undefined);
          setNotice(message);
          setPage(1);
          setRevision((value) => value + 1);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {notice && (
        <p
          role="status"
          className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200"
        >
          {notice}
        </p>
      )}
      {adding && (
        <StaffForm
          restaurantId={restaurantId}
          currency={currency}
          onClose={() => setAdding(false)}
          onSave={profileSaved}
        />
      )}
      <section
        className={panel + " @container"}
        aria-label="Staff directory"
        aria-busy={loading}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-teal-300/15 bg-linear-to-r from-teal-900/60 via-[#172623] to-[#141821] px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl border border-teal-300/20 bg-teal-300/12 text-teal-100">
              <UsersRound size={17} aria-hidden />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-white">
                Staff directory
              </h2>
            </div>
          </div>
          <button
            className={primary}
            aria-haspopup="dialog"
            onClick={() => setAdding(true)}
          >
            <UserPlus size={14} aria-hidden /> Add staff
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 bg-[#15171d] px-3 py-3 @xl:justify-between @xl:px-4">
          <div className="relative w-full @xl:max-w-xs">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-2.5 text-zinc-500"
              aria-hidden
            />
            <input
              type="search"
              className={
                input + " pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden"
              }
              aria-label="Search staff"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Name, role, or employee code"
            />
            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute inset-y-0 right-0 grid w-9 place-items-center rounded-r-lg text-zinc-400 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-300"
              >
                <X size={14} aria-hidden />
              </button>
            )}
          </div>
          <div
            role="group"
            aria-label="Filter by staff status"
            className="flex flex-wrap gap-0.5 rounded-lg border border-white/8 bg-zinc-950/60 p-0.5"
          >
            {statusOptions.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={status === value}
                onClick={() => {
                  setStatus(value);
                  setPage(1);
                }}
                className={`min-h-8 rounded-md px-2 text-xs font-medium focus-visible:outline-2 focus-visible:outline-emerald-300 ${status === value ? "bg-emerald-400/15 text-emerald-200" : "text-zinc-300 hover:bg-white/8"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {error && (
          <div className="flex items-center gap-2 p-4">
            <ErrorNote>{error}</ErrorNote>
            <button
              className={secondary}
              onClick={() => setRevision((n) => n + 1)}
            >
              Retry
            </button>
          </div>
        )}
        {loading && <Empty>Loading staff…</Empty>}
        {data && data.data.length === 0 && (
          <div className="border-t border-white/8 px-4 py-8 text-center">
            <p role="status" className="text-sm font-medium text-zinc-200">
              {query || status
                ? "No staff match these filters."
                : "No staff have been added yet."}
            </p>
            <button
              type="button"
              className={secondary + " mt-3"}
              onClick={query || status ? clearFilters : () => setAdding(true)}
            >
              {query || status ? "Clear filters" : "Add the first employee"}
            </button>
          </div>
        )}
        {data && data.data.length > 0 && (
          <>
            <StaffDirectoryTable
              staff={data.data}
              onOpen={(staff) => {
                setNotice("");
                setEmployee(staff);
              }}
            />
            <p
              role="status"
              className="border-t border-white/8 px-4 py-2 text-xs tabular-nums text-zinc-400"
            >
              Showing {(page - 1) * pageSize + 1}–
              {(page - 1) * pageSize + data.data.length} of{" "}
              {data.pagination.total}
            </p>
          </>
        )}
        {data && (
          <Pagination
            page={page}
            pages={data.pagination.totalPages}
            onChange={setPage}
          />
        )}
      </section>
    </div>
  );
}
