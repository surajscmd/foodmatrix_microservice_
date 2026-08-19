"use client";

import {
  Clock,
  User,
  ChefHat,
  ShoppingBag,
  Circle,
} from "lucide-react";

interface OrderItem {
  name: string;
  quantity: number;
}

interface Order {
  id: string;
  customerName?: string;
  tableNumber?: string;
  type: string;
  status: string;
  timestamp: string;
  total: number;
  items: OrderItem[];
}

interface LiveOrdersProps {
  orders: Order[];
}

export default function LiveOrders({
  orders,
}: LiveOrdersProps) {
  const statusStyles = {
    Preparing: {
      badge:
        "bg-amber-500/10 text-amber-400 border-amber-500/20",
      dot: "text-amber-400",
    },
    Ready: {
      badge:
        "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      dot: "text-emerald-400",
    },
    Completed: {
      badge:
        "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
      dot: "text-cyan-400",
    },
    Pending: {
      badge:
        "bg-red-500/10 text-red-400 border-red-500/20",
      dot: "text-red-400",
    },
  };

  return (
    <section
      className="
      rounded-3xl
      border
      border-zinc-800
      bg-zinc-900/50
      backdrop-blur-md
      overflow-hidden
      "
    >
      {/* Header */}

      <div
        className="
        flex
        items-center
        justify-between
        border-b
        border-zinc-800
        p-6
        "
      >
        <div>
          <p
            className="
            text-[10px]
            font-mono
            uppercase
            tracking-[0.18em]
            text-zinc-500
            "
          >
            KITCHEN OPERATIONS
          </p>

          <h2 className="mt-2 text-2xl font-bold text-white">
            Live Orders
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Orders currently being processed
          </p>
        </div>

        <div
          className="
          flex
          h-12
          w-12
          items-center
          justify-center
          rounded-xl
          bg-emerald-500/10
          "
        >
          <ShoppingBag
            className="text-emerald-400"
            size={22}
          />
        </div>
      </div>

      <div className="divide-y divide-zinc-800">
        {orders.map((order) => {
          const style =
            statusStyles[
              order.status as keyof typeof statusStyles
            ];

          return (
            <div
              key={order.id}
              className="
              p-5
              transition
              hover:bg-zinc-800/30
              "
            >
              <div className="flex items-start justify-between">

                <div>

                  <div className="flex items-center gap-3">

                    <h3 className="font-semibold text-white">
                      {order.id}
                    </h3>

                    <span
                      className={`
                      flex
                      items-center
                      gap-1
                      rounded-full
                      border
                      px-2.5
                      py-1
                      text-[10px]
                      font-mono
                      uppercase
                      tracking-wider
                      ${style.badge}
                      `}
                    >
                      <Circle
                        size={8}
                        fill="currentColor"
                        className={style.dot}
                      />

                      {order.status}
                    </span>

                  </div>

                  <div className="mt-4 flex flex-wrap gap-6 text-sm">

                    <span className="flex items-center gap-2 text-zinc-400">
                      <User size={15} />
                      {order.customerName ??
                        "Walk-in Customer"}
                    </span>

                    <span className="flex items-center gap-2 text-zinc-400">
                      <Clock size={15} />
                      {order.timestamp}
                    </span>

                    <span className="text-zinc-400">
                      {order.type}
                    </span>

                    {order.tableNumber && (
                      <span className="text-emerald-400 font-medium">
                        {order.tableNumber}
                      </span>
                    )}

                  </div>

                </div>

                <div className="text-right">

                  <p className="text-2xl font-bold text-white">
                    ${order.total}
                  </p>

                  <p className="text-xs text-zinc-500">
                    Order Value
                  </p>

                </div>

              </div>

              {/* Items */}

              <div className="mt-5 rounded-xl bg-zinc-950/60 p-4">

                <div className="mb-3 flex items-center gap-2">

                  <ChefHat
                    size={16}
                    className="text-emerald-400"
                  />

                  <span
                    className="
                    text-[10px]
                    font-mono
                    uppercase
                    tracking-widest
                    text-zinc-500
                    "
                  >
                    ITEMS
                  </span>

                </div>

                <div className="space-y-2">

                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className="
                      flex
                      items-center
                      justify-between
                      text-sm
                      "
                    >
                      <span className="text-zinc-300">
                        {item.name}
                      </span>

                      <span
                        className="
                        rounded-lg
                        bg-zinc-800
                        px-2
                        py-1
                        text-xs
                        text-zinc-400
                        "
                      >
                        × {item.quantity}
                      </span>
                    </div>
                  ))}

                </div>

              </div>

            </div>
          );
        })}
      </div>
    </section>
  );
}