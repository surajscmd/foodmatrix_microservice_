"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";

export interface TableGuest {
  table: string;
  phone: string;
  name: string;
}

interface Props {
  onContinue: (guest: TableGuest) => void;
  onCancel: () => void;
}

const field =
  "mt-1.5 min-h-11 w-full rounded-lg border border-zinc-600 bg-[#181c1b] px-3 text-sm text-white placeholder:text-zinc-400 focus-visible:outline-2 focus-visible:outline-emerald-300";

export default function NewTableForm({ onContinue, onCancel }: Props) {
  const tableField = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    tableField.current?.focus();
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const table = String(form.get("table") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const name = String(form.get("name") ?? "").trim();

    if (!table) {
      setError("Enter a table label.");
      tableField.current?.focus();
      return;
    }
    if (!/^[0-9+\-\s]{7,20}$/.test(phone) || !/\d/.test(phone)) {
      setError("Enter a valid customer phone number.");
      event.currentTarget
        .querySelector<HTMLInputElement>('input[name="phone"]')
        ?.focus();
      return;
    }

    onContinue({ table, phone, name });
  }

  return (
    <form
      id="waiter-new-table"
      onSubmit={submit}
      aria-labelledby="waiter-new-table-title"
      className="rounded-xl border border-emerald-300/40 bg-linear-to-br from-[#1d332a] to-[#25262b] p-4 sm:p-5"
    >
      <h2
        id="waiter-new-table-title"
        className="text-sm font-semibold tracking-tight text-white"
      >
        Start a table order
      </h2>
      <div className="mt-4 grid gap-3 @min-[42rem]:grid-cols-3">
        <label className="text-sm font-medium text-zinc-100">
          Table label
          <input
            ref={tableField}
            name="table"
            required
            maxLength={50}
            placeholder="e.g. T04"
            className={field}
          />
        </label>
        <label className="text-sm font-medium text-zinc-100">
          Customer phone
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            maxLength={20}
            className={field}
          />
        </label>
        <label className="text-sm font-medium text-zinc-100">
          Customer name{" "}
          <span className="font-normal text-zinc-300">(optional)</span>
          <input name="name" autoComplete="name" className={field} />
        </label>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-rose-200">
          {error}
        </p>
      )}
      <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-white/10 pt-3">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 rounded-lg px-4 text-sm font-medium text-zinc-200 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-emerald-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-300 px-4 text-sm font-semibold text-emerald-950 hover:bg-emerald-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
        >
          Open menu <ArrowRight aria-hidden="true" className="size-4" />
        </button>
      </div>
    </form>
  );
}
