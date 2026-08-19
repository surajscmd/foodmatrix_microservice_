import {
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";

interface InventoryItem {
  inventoryItemId: string;
  name: string;
  quantity: number;
  unit: string;
  status: string;
  minThreshold: number;
}

interface InventoryPanelProps {
  inventory: {
    restaurantName: string;
    items: InventoryItem[];
  };
}

export default function InventoryPanel({
  inventory,
}: InventoryPanelProps) {
  const statusConfig = (status: string) => {
    switch (status) {
      case "In Stock":
        return {
          icon: CheckCircle2,
          color: "text-emerald-400",
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/20",
        };

      case "Low Stock":
        return {
          icon: AlertTriangle,
          color: "text-amber-400",
          bg: "bg-amber-500/10",
          border: "border-amber-500/20",
        };

      case "Out of Stock":
        return {
          icon: XCircle,
          color: "text-red-400",
          bg: "bg-red-500/10",
          border: "border-red-500/20",
        };

      default:
        return {
          icon: Package,
          color: "text-zinc-400",
          bg: "bg-zinc-700/20",
          border: "border-zinc-700",
        };
    }
  };

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
      {/* Header */}

      <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <Package size={18} />
            </div>

            <div>
              <h2 className="font-semibold text-white">
                Inventory Overview
              </h2>

              <p className="text-xs text-zinc-500">
                {inventory.restaurantName}
              </p>
            </div>
          </div>
        </div>

        <button className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-400 transition hover:border-emerald-500/30 hover:text-emerald-400">
          View Inventory

          <ArrowRight size={14} />
        </button>
      </div>

      {/* Items */}

      <div className="space-y-3 p-5">
        {inventory.items.map((item) => {
          const status = statusConfig(item.status);
          const Icon = status.icon;

          const percent = Math.min(
            100,
            (item.quantity / (item.minThreshold * 2)) * 100,
          );

          return (
            <div
              key={item.inventoryItemId}
              className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 transition-all hover:border-zinc-700"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-white">
                    {item.name}
                  </h3>

                  <p className="mt-1 text-xs text-zinc-500">
                    Minimum Required • {item.minThreshold} {item.unit}
                  </p>
                </div>

                <div
                  className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${status.bg} ${status.border} ${status.color}`}
                >
                  <Icon size={14} />

                  {item.status}
                </div>
              </div>

              {/* Quantity */}

              <div className="mt-5 flex items-end justify-between">
                <div>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-white">
                      {item.quantity}
                    </span>

                    <span className="pb-1 text-sm text-zinc-500">
                      {item.unit}
                    </span>
                  </div>

                  {item.quantity <= item.minThreshold && (
                    <p className="mt-1 text-xs font-medium text-red-400">
                      Reorder immediately
                    </p>
                  )}
                </div>

                <span className="text-xs text-zinc-500">
                  Threshold {item.minThreshold}
                </span>
              </div>

              {/* Progress */}

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  style={{ width: `${percent}%` }}
                  className={`h-full rounded-full ${
                    item.status === "In Stock"
                      ? "bg-emerald-400"
                      : item.status === "Low Stock"
                        ? "bg-amber-400"
                        : "bg-red-400"
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}