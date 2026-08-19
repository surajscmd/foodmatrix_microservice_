import {
  Bell,
  MapPin,
  Star,
  CircleCheck,
  Store,
  Clock3,
} from "lucide-react";

interface ManagerHeaderProps {
  user: {
    name: string;
    role: string;
    avatar: string;
  };

  restaurant: {
    name: string;
    city: string;
    status: string;
    rating: number;
    manager: string;
  };
}

export default function ManagerHeader({
  user,
  restaurant,
}: ManagerHeaderProps) {
  return (
    <header
      className="
      relative
      overflow-hidden
      rounded-3xl
      border
      border-zinc-800
      bg-zinc-900/50
      backdrop-blur-md
      "
    >
      {/* Emerald Glow */}

      <div
        className="
        absolute
        inset-0
        bg-[radial-gradient(circle_at_left,rgba(16,185,129,.12),transparent_45%)]
        pointer-events-none
        "
      />

      <div className="relative p-7">

        {/* TOP */}

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

          {/* Restaurant */}

          <div className="flex items-start gap-5">

            <div
              className="
              flex
              h-16
              w-16
              items-center
              justify-center
              rounded-2xl
              border
              border-emerald-500/20
              bg-emerald-500/10
              text-emerald-400
              "
            >
              <Store size={30} />
            </div>

            <div>

              <div className="flex flex-wrap items-center gap-3">

                <h1
                  className="
                  text-3xl
                  font-bold
                  tracking-tight
                  text-white
                  "
                >
                  {restaurant.name}
                </h1>

                <span
                  className="
                  rounded-full
                  border
                  border-emerald-500/20
                  bg-emerald-500/10
                  px-3
                  py-1
                  text-[10px]
                  font-mono
                  font-bold
                  uppercase
                  tracking-[0.18em]
                  text-emerald-400
                  flex
                  items-center
                  gap-1.5
                  "
                >
                  <CircleCheck size={12} />

                  {restaurant.status}
                </span>

              </div>

              <p
                className="
                mt-2
                text-sm
                text-zinc-500
                "
              >
                Restaurant Operations Dashboard
              </p>

            </div>

          </div>

          {/* Right */}

          <div className="flex items-center gap-4">

            <button
              className="
              relative
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              text-zinc-400
              transition
              hover:border-emerald-500/40
              hover:text-emerald-400
              "
            >
              <Bell size={18} />

              <span
                className="
                absolute
                right-2
                top-2
                h-2
                w-2
                rounded-full
                bg-emerald-400
                "
              />
            </button>

            <div
              className="
              flex
              items-center
              gap-3
              rounded-2xl
              border
              border-zinc-800
              bg-zinc-950/70
              px-4
              py-3
              "
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="
                h-12
                w-12
                rounded-xl
                object-cover
                "
              />

              <div>

                <p
                  className="
                  text-sm
                  font-semibold
                  text-white
                  "
                >
                  {user.name}
                </p>

                <p
                  className="
                  text-xs
                  text-zinc-500
                  uppercase
                  tracking-wider
                  font-mono
                  "
                >
                  Restaurant Manager
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* Bottom Stats */}

        <div
          className="
          mt-7
          grid
          gap-4
          border-t
          border-zinc-800
          pt-5
          md:grid-cols-4
          "
        >

          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              LOCATION
            </p>

            <div className="mt-2 flex items-center gap-2 text-sm text-white">
              <MapPin size={15} className="text-emerald-400" />
              {restaurant.city}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              RATING
            </p>

            <div className="mt-2 flex items-center gap-2 text-sm text-white">
              <Star
                size={15}
                className="fill-yellow-400 text-yellow-400"
              />
              {restaurant.rating}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              MANAGER
            </p>

            <div className="mt-2 text-sm font-medium text-emerald-400">
              {restaurant.manager}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              LAST SYNC
            </p>

            <div className="mt-2 flex items-center gap-2 text-sm text-white">
              <Clock3 size={15} className="text-emerald-400" />
              Just now
            </div>
          </div>

        </div>

      </div>
    </header>
  );
}