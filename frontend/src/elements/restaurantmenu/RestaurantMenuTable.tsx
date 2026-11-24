import { Pencil, UtensilsCrossed } from "lucide-react";
import type { RestaurantMenuEntry } from "@/lib/catalog-api";

interface Props {
  items: RestaurantMenuEntry[];
  formatMoney: (value: number) => string;
  disabled: boolean;
  filtered: boolean;
  onEdit: (item: RestaurantMenuEntry) => void;
}

export default function RestaurantMenuTable({
  items,
  formatMoney,
  disabled,
  filtered,
  onEdit,
}: Props) {
  return (
    <section aria-label="Menu items">
      {items.length === 0 ? (
        <div
          role="status"
          className="grid justify-items-center gap-2 px-4 py-11 text-center text-sm text-zinc-300"
        >
          <UtensilsCrossed
            className="size-5 text-emerald-300/75"
            aria-hidden="true"
          />
          {filtered
            ? "No menu items match your filters."
            : "This restaurant has no menu items yet."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="border-b border-zinc-800/80 bg-zinc-950/80 font-mono text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
              <tr>
                <th scope="col" className="px-5 py-3.5">
                  Menu item
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Category
                </th>
                <th scope="col" className="whitespace-nowrap px-5 py-3.5">
                  Selling price
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Availability
                </th>
                <th scope="col" className="px-5 py-3.5 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="group transition-colors duration-200 hover:bg-zinc-900/50"
                >
                  <td className="px-5 py-4">
                    <div className="flex min-w-[260px] items-center gap-3">
                      <span
                        aria-hidden
                        className={`grid size-9 shrink-0 place-items-center rounded-lg border ${item.isAvailable ? "border-emerald-500/15 bg-emerald-500/[0.06]" : "border-zinc-800 bg-zinc-900"}`}
                      >
                        <span
                          className={`size-2 rounded-full ${item.isAvailable ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.45)]" : "bg-zinc-600"}`}
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold leading-5 text-zinc-100 transition-colors group-hover:text-white">
                          {item.name}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="inline-flex rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-[10px] font-semibold tracking-wide text-zinc-500">
                            {item.sku}
                          </span>
                          {item.description && (
                            <span className="line-clamp-2 max-w-56 text-xs leading-4 text-zinc-600">
                              {item.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center rounded-md border border-zinc-800 bg-zinc-900/70 px-2.5 py-1.5 text-[10px] font-medium text-zinc-400">
                      {item.category.name}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="whitespace-nowrap font-mono text-[13px] font-semibold tabular-nums text-zinc-200">
                      {formatMoney(item.price)}
                    </p>
                    <p className="mt-0.5 text-[9px] uppercase tracking-wider text-zinc-500">
                      {item.restaurantConfigured
                        ? "Restaurant price"
                        : "Default price"}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider whitespace-nowrap ${item.isAvailable ? "border-emerald-500/15 bg-emerald-500/[0.05] text-emerald-400" : "border-rose-500/15 bg-rose-500/[0.05] text-rose-400"}`}
                    >
                      <span
                        aria-hidden="true"
                        className="size-1.5 rounded-full bg-current"
                      />
                      {item.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      aria-label={`Edit ${item.name}`}
                      title={`Edit ${item.name}`}
                      disabled={disabled}
                      onClick={() => onEdit(item)}
                      className="inline-flex min-h-8 min-w-8 items-center justify-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-300 transition-colors enabled:hover:bg-emerald-500/20 focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:opacity-50"
                    >
                      <Pencil className="size-3.5" aria-hidden="true" />
                      <span>Edit</span>
                    </button>
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
