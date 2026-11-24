"use client";

import { useState } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";
import RestaurantMenuEditDrawer from "@/elements/menu/RestaurantMenuEditDrawer";
import RestaurantMenuFilters from "@/elements/restaurantmenu/RestaurantMenuFilters";
import RestaurantMenuMetrics from "@/elements/restaurantmenu/RestaurantMenuMetrics";
import RestaurantMenuPagination from "@/elements/restaurantmenu/RestaurantMenuPagination";
import RestaurantMenuTable from "@/elements/restaurantmenu/RestaurantMenuTable";
import useRestaurantMenuPage from "@/hooks/useRestaurantMenuPage";
import type { RestaurantMenuEntry } from "@/lib/catalog-api";
import { useOrganizationStore } from "@/store/organization-store";
import type { Restaurant } from "@/utils/types/organization";

export default function RestaurantMenuScreen() {
  const user = useOrganizationStore((state) => state.currentUser?.systemUser);
  const restaurant = useOrganizationStore((state) => state.selectedRestaurant);

  if (
    user?.role !== "RESTAURANT_ADMIN" ||
    !user.isActive ||
    !restaurant ||
    user.managedRestaurantId !== restaurant.id
  ) {
    return (
      <p
        role="alert"
        className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-300"
      >
        Menu Management is available to the assigned restaurant admin.
      </p>
    );
  }

  return (
    <RestaurantMenuWorkspace
      key={`${user.id}:${restaurant.id}`}
      restaurant={restaurant}
    />
  );
}

function RestaurantMenuWorkspace({ restaurant }: { restaurant: Restaurant }) {
  const {
    query,
    search,
    setSearch,
    categories,
    categoryError,
    availabilityCounts,
    menu,
    error,
    refreshing,
    searching,
    refresh,
    changeFilters,
    changePage,
  } = useRestaurantMenuPage(restaurant.id);
  const [editing, setEditing] = useState<RestaurantMenuEntry | null>(null);
  const [notice, setNotice] = useState("");
  const currency = restaurant.defaultCurrency?.trim().toUpperCase();
  const money = new Intl.NumberFormat(
    "en-IN",
    currency && /^[A-Z]{3}$/.test(currency)
      ? { style: "currency", currency }
      : { minimumFractionDigits: 2, maximumFractionDigits: 2 },
  );

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 motion-safe:animate-fade-in">
      <header className="flex flex-wrap items-center justify-between gap-4 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden className="h-4 w-1 rounded-full bg-emerald-400" />
          <div className="min-w-0">
            <h1 className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">
              Restaurant menu
            </h1>
            <p className="mt-0.5 text-[10px] text-zinc-500">
              Selling prices, item availability and menu categories
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          title="Refresh menu"
          aria-label="Refresh menu"
          className="grid size-10 place-items-center rounded-xl border border-zinc-800 bg-zinc-900/70 text-zinc-400 transition enabled:hover:border-emerald-400/30 enabled:hover:text-emerald-400 focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:opacity-60"
        >
          <RefreshCw
            className={`size-4 ${refreshing ? "motion-safe:animate-spin" : ""}`}
            aria-hidden="true"
          />
        </button>
      </header>

      {(error || categoryError) && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100"
        >
          <p>{error || categoryError}</p>
          <button
            type="button"
            onClick={refresh}
            className="rounded-lg border border-rose-200/25 px-3 py-1.5 text-xs font-semibold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-rose-200"
          >
            Retry
          </button>
        </div>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-2.5 text-sm text-emerald-100"
        >
          {notice}
        </p>
      )}
      <RestaurantMenuMetrics counts={availabilityCounts} />

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80">
        <RestaurantMenuFilters
          visibleRows={menu?.data.length ?? 0}
          total={menu?.pagination.total}
          loading={refreshing || searching}
          categories={categories}
          categoryId={query.categoryId}
          availability={query.availability}
          availabilityCounts={availabilityCounts}
          search={search}
          onSearch={setSearch}
          onChange={changeFilters}
        />

        {menu ? (
          <>
            <RestaurantMenuTable
              items={menu.data}
              formatMoney={money.format}
              disabled={refreshing || searching || Boolean(error)}
              filtered={Boolean(
                query.search || query.categoryId || query.availability,
              )}
              onEdit={(item) => {
                setNotice("");
                setEditing(item);
              }}
            />
            {menu.data.length > 0 && (
              <RestaurantMenuPagination
                pagination={menu.pagination}
                visibleRows={menu.data.length}
                disabled={refreshing || searching || Boolean(error)}
                onPage={changePage}
                onLimit={(limit) => changeFilters({ limit })}
              />
            )}
          </>
        ) : (
          refreshing && (
            <p
              role="status"
              className="flex min-h-32 items-center justify-center gap-2 px-4 text-sm text-zinc-300"
            >
              <LoaderCircle
                className="size-4 text-emerald-300 motion-safe:animate-spin"
                aria-hidden="true"
              />
              Loading restaurant menu…
            </p>
          )
        )}
      </div>

      {editing && (
        <RestaurantMenuEditDrawer
          key={editing.id}
          menuItem={editing}
          restaurant={restaurant}
          config={{ restaurantMenuItemId: editing.restaurantMenuItemId }}
          initialPrice={editing.price}
          initialIsAvailable={editing.isAvailable}
          presentation="modal"
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setNotice(`${editing.name} was updated.`);
            refresh();
          }}
        />
      )}
    </div>
  );
}
