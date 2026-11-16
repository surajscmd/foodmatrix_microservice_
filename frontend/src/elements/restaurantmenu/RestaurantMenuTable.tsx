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
        <div role="status" className="grid justify-items-center gap-2 px-4 py-11 text-center text-sm text-zinc-300">
          <UtensilsCrossed className="size-5 text-emerald-300/75" aria-hidden="true" />
          {filtered
            ? "No menu items match your filters."
            : "This restaurant has no menu items yet."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-950/45 text-xs text-zinc-400">
              <tr>
                <th scope="col" className="w-full px-3 py-3 font-medium sm:px-4">Menu item</th>
                <th scope="col" className="hidden px-3 py-3 font-medium md:table-cell md:min-w-36">Category</th>
                <th scope="col" className="px-3 py-3 text-right font-medium whitespace-nowrap sm:px-4">Selling price</th>
                <th scope="col" className="px-3 py-3 text-center font-medium sm:px-4">Availability</th>
                <th scope="col" className="px-3 py-2.5 sm:px-4"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {items.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-white/[0.035]">
                  <td className="px-3 py-3 sm:px-4">
                    <p className="min-w-24 font-medium text-zinc-100">{item.name}</p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      <span className="md:hidden">{item.category.name} · </span>
                      {item.sku}
                    </p>
                  </td>
                  <td className="hidden px-3 py-3 text-xs text-zinc-300 md:table-cell">
                    {item.category.name}
                  </td>
                  <td className="px-3 py-3 text-right sm:px-4">
                    <p className="font-semibold whitespace-nowrap text-zinc-100 tabular-nums">{formatMoney(item.price)}</p>
                    {!item.restaurantConfigured && <p className="mt-0.5 text-xs text-zinc-400">Default</p>}
                  </td>
                  <td className="px-3 py-3 text-center sm:px-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-medium whitespace-nowrap ${item.isAvailable ? "border-emerald-400/15 bg-emerald-400/10 text-emerald-200" : "border-amber-400/15 bg-amber-400/10 text-amber-200"}`}>
                      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
                      {item.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right sm:px-4">
                    <button
                      type="button"
                      aria-label={`Edit ${item.name}`}
                      title={`Edit ${item.name}`}
                      disabled={disabled}
                      onClick={() => onEdit(item)}
                      className="inline-flex min-h-8 min-w-8 items-center justify-center gap-1.5 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-2 text-xs font-medium text-emerald-100 transition enabled:hover:bg-emerald-400/20 focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:opacity-50"
                    >
                      <Pencil className="size-3.5" aria-hidden="true" />
                      <span className="hidden sm:inline">Edit</span>
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
