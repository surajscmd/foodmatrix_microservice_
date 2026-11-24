"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import MenuGrid from "@/elements/waiterpad/MenuGrid";
import CartPanel from "@/elements/waiterpad/CartPanel";
import KitchenTicket from "@/elements/waiterpad/KitchenTicket";
import TableOrders, { OrderStatus } from "@/elements/waiterpad/TableOrders";
import type { TableGuest } from "@/elements/waiterpad/NewTableForm";
import WaiterMark from "@/elements/waiterpad/WaiterMark";
import TableRepresentation from "@/elements/waiterpad/TableRepresentation";
import RefreshButton from "@/elements/waiterpad/RefreshButton";
import ModifierPicker from "@/elements/Cash-pos/ModifierPicker";
import useCashierModifierGroups from "@/elements/Cash-pos/useCashierModifierGroups";
import {
  cashierOrderItem,
  type CartModifier,
  type CashierModifierGroup,
} from "@/elements/Cash-pos/cashier-modifiers";
import {
  canAddToTable,
  type CartItem,
  type MenuItem,
} from "@/elements/waiterpad/types";
import useRestaurantMenu from "@/hooks/useRestaurantMenu";
import { OrderApiError, orderApi, type Order } from "@/lib/order-api";
import { useOrganizationStore } from "@/store/organization-store";
import type { Restaurant } from "@/utils/types/organization";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function WaiterScreen() {
  const user = useOrganizationStore((state) => state.currentUser?.systemUser);
  const restaurant = useOrganizationStore((state) => state.selectedRestaurant);
  const hydrated = useOrganizationStore((state) => state.isHydrated);
  const error = useOrganizationStore((state) => state.error);

  if (!hydrated) return <p role="status">Loading your restaurant…</p>;
  if (error) return <p role="alert">{error}</p>;
  if (
    !user?.isActive ||
    (user.role !== "RESTAURANT_ADMIN" && user.role !== "STAFF") ||
    !restaurant ||
    restaurant.id !== user.managedRestaurantId
  ) {
    return (
      <p role="alert">Sign in with an account assigned to a restaurant.</p>
    );
  }

  return (
    <WaiterStation
      key={`${user.id}:${restaurant.id}`}
      restaurant={restaurant}
    />
  );
}

function WaiterStation({ restaurant }: { restaurant: Restaurant }) {
  const {
    items: menu,
    error: menuError,
    refresh: refreshMenu,
  } = useRestaurantMenu(restaurant.id);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [ordersError, setOrdersError] = useState("");
  const [ordersRevision, setOrdersRevision] = useState(0);
  const [loadedRevision, setLoadedRevision] = useState(-1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ticket, setTicket] = useState<{
    id: string;
    key: string;
    order: Order | null;
    error: string;
  } | null>(null);
  const [guest, setGuest] = useState<TableGuest | null>(null);
  const [settingUp, setSettingUp] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const modifierCatalog = useCashierModifierGroups();
  const customizableItems = new Set(
    modifierCatalog.error ? undefined : modifierCatalog.groups?.keys(),
  );
  const [options, setOptions] = useState<{
    item: MenuItem;
    groups: CashierModifierGroup[];
    line?: CartItem;
  } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [notice, setNotice] = useState<{ error: boolean; text: string }>();
  const lock = useRef(false);
  const workspace = useRef<HTMLDivElement>(null);
  const tableList = useRef<HTMLDivElement>(null);

  const ticketKey = `${selectedId}:${ordersRevision}`;
  const currentTicket = ticket?.key === ticketKey ? ticket : null;
  const ticketRefreshing = selectedId !== null && !currentTicket;
  const tablesRefreshing = loadedRevision !== ordersRevision;
  const selected =
    ticket?.id === selectedId
      ? ticket.order
      : (orders?.find((order) => order.id === selectedId) ?? null);
  const menuDisabled =
    busy ||
    uncertain ||
    ticketRefreshing ||
    Boolean(currentTicket?.error) ||
    (Boolean(selectedId) && (!selected || !canAddToTable(selected)));
  const currency = restaurant.defaultCurrency?.trim().toUpperCase();
  const money = new Intl.NumberFormat(
    "en-IN",
    currency && /^[A-Z]{3}$/.test(currency)
      ? { style: "currency", currency }
      : { maximumFractionDigits: 2 },
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadOrders() {
      const open = new Map<string, Order>();
      for (let page = 1; !controller.signal.aborted; page++) {
        const result = await orderApi.getRegisterOrders(
          "open",
          page,
          controller.signal,
        );
        for (const order of result.data) {
          if (order.type === "DINE_IN" && order.tableId)
            open.set(order.id, order);
        }
        if (page >= result.pagination.totalPages) break;
      }
      if (!controller.signal.aborted) {
        setOrders([...open.values()]);
        setOrdersError("");
      }
    }

    void loadOrders()
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setOrdersError(errorMessage(error, "Unable to load open tables."));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadedRevision(ordersRevision);
      });
    return () => controller.abort();
  }, [ordersRevision]);

  useEffect(() => {
    if (!selectedId) return;
    const controller = new AbortController();

    void orderApi
      .getOrder(selectedId, controller.signal)
      .then((order) => {
        if (!controller.signal.aborted)
          setTicket({ id: selectedId, key: ticketKey, order, error: "" });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setTicket((previous) => ({
            id: selectedId,
            key: ticketKey,
            order:
              error instanceof OrderApiError && error.status === 404
                ? null
                : previous?.id === selectedId
                  ? previous.order
                  : null,
            error: errorMessage(error, "Unable to refresh the ticket."),
          }));
        }
      });

    return () => controller.abort();
  }, [selectedId, ticketKey]);

  function refreshOrders() {
    setOrdersRevision((value) => value + 1);
  }

  function addItem(item: MenuItem, modifiers: CartModifier[] = []) {
    if (lock.current || menuDisabled) return;
    const id = JSON.stringify([item.id, modifiers.map(({ id }) => id).sort()]);
    setCart((current) =>
      current.some((line) => line.id === id)
        ? current.map((line) =>
            line.id === id
              ? { ...line, quantity: Math.min(99, line.quantity + 1) }
              : line,
          )
        : [...current, { id, menuItem: item, quantity: 1, modifiers }],
    );
  }

  function openOptions(item: MenuItem, line?: CartItem) {
    if (lock.current || menuDisabled || modifierCatalog.error) return;
    const groups = modifierCatalog.groups?.get(item.id);
    if (groups?.length) setOptions({ item, groups, line });
  }

  function saveOptions(modifiers: CartModifier[]) {
    if (!options || lock.current || menuDisabled) return;
    if (options.line) {
      const id = JSON.stringify([
        options.item.id,
        modifiers.map(({ id }) => id).sort(),
      ]);
      const quantity = options.line.quantity;
      const existing = cart.find(
        (line) => line.id === id && line.id !== options.line?.id,
      );
      if (existing && existing.quantity + quantity > 99) {
        setNotice({
          error: true,
          text: "This combination would exceed 99 items. Reduce the quantity first.",
        });
        return;
      }
      setCart((current) => {
        const remaining = current.filter(
          (line) => line.id !== options.line?.id,
        );
        return existing
          ? remaining.map((line) =>
              line.id === id
                ? { ...line, quantity: line.quantity + quantity }
                : line,
            )
          : [...remaining, { id, menuItem: options.item, modifiers, quantity }];
      });
    } else {
      addItem(options.item, modifiers);
    }
    setOptions(null);
  }

  function changeQuantity(itemId: string, delta: number) {
    if (lock.current || uncertain || (delta > 0 && menuDisabled)) return;
    setCart((current) =>
      current
        .map((line) =>
          line.id === itemId
            ? { ...line, quantity: Math.min(99, line.quantity + delta) }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }

  function rememberOrder(order: Order) {
    setOrders((current) => [
      order,
      ...(current ?? []).filter((existing) => existing.id !== order.id),
    ]);
    setSelectedId(order.id);
  }

  async function confirmForKitchen(order: Order) {
    if (order.status !== "PENDING") return order;
    try {
      return await orderApi.confirmOrder(order.id);
    } catch (error) {
      const latest = await orderApi.getOrder(order.id).catch(() => null);
      if (
        latest &&
        ["CONFIRMED", "PREPARING", "READY", "COMPLETED"].includes(latest.status)
      )
        return latest;
      throw error;
    }
  }

  async function runAction(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setNotice(undefined);
    try {
      await action();
    } catch (error) {
      setNotice({
        error: true,
        text: errorMessage(error, "Unable to update this table."),
      });
    } finally {
      refreshOrders();
      lock.current = false;
      setBusy(false);
    }
  }

  function sendOrder() {
    if (!cart.length || menuDisabled) return;
    if (!selected && !guest) return;

    if (
      !selected &&
      guest &&
      orders?.some(
        (order) => order.tableId?.toLowerCase() === guest.table.toLowerCase(),
      )
    ) {
      setNotice({
        error: true,
        text: "This table already has an order. Clear this round, then open the existing table.",
      });
      return;
    }

    void runAction(async () => {
      const items = cart.map(({ menuItem, quantity, modifiers }) =>
        cashierOrderItem(menuItem.id, quantity, modifiers),
      );
      let saved: Order;
      try {
        if (selected) {
          saved = await orderApi.addItems(selected.id, items);
        } else if (guest) {
          saved = await orderApi.createOrder(
            {
              type: "DINE_IN",
              tableId: guest.table,
              phone: guest.phone,
              ...(guest.name ? { name: guest.name } : {}),
              items,
            },
            crypto.randomUUID(),
          );
        } else return;
      } catch (error) {
        if (
          error instanceof OrderApiError &&
          error.status < 500 &&
          error.status !== 408
        )
          throw error;
        setUncertain(true);
        throw new Error(
          "The order response was lost. Check the table and its items before sending another order.",
        );
      }

      rememberOrder(saved);
      setCart([]);
      setMenuOpen(false);
      try {
        const confirmed = await confirmForKitchen(saved);
        rememberOrder(confirmed);
        setNotice({
          error: false,
          text: `Order #${confirmed.orderNumber} sent to the kitchen.`,
        });
      } catch {
        setNotice({
          error: true,
          text: `Order #${saved.orderNumber} was saved. Use Confirm for kitchen to finish sending it.`,
        });
      }
    });
  }

  const inWorkspace = selectedId !== null || guest !== null;
  const heading = inWorkspace ? workspace : tableList;

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: "start" });
  }, [heading]);

  function backToTables() {
    setSelectedId(null);
    setGuest(null);
    setSettingUp(false);
    setMenuOpen(false);
  }

  function openTable(id: string) {
    setTicket(null);
    setGuest(null);
    setSettingUp(false);
    setMenuOpen(false);
    setSelectedId(id);
    if (!uncertain) setNotice(undefined);
  }

  function continueToMenu(details: TableGuest) {
    const existing = orders?.find(
      (order) => order.tableId?.toLowerCase() === details.table.toLowerCase(),
    );
    if (existing) {
      openTable(existing.id);
      return;
    }
    setGuest(details);
    setMenuOpen(true);
    setSettingUp(false);
    setNotice(undefined);
  }

  function confirmSelected(order: Order) {
    void runAction(async () => {
      const confirmed = await confirmForKitchen(order);
      rememberOrder(confirmed);
      setNotice({
        error: false,
        text: `Order #${confirmed.orderNumber} sent to the kitchen.`,
      });
    });
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 font-sans motion-safe:animate-fade-in text-zinc-100">
      <header className="flex flex-wrap items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-3">
          <span aria-hidden className="h-4 w-1 rounded-full bg-emerald-400" />
          <div>
            <h1 className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">
              Waiter pad
            </h1>
            <p className="mt-0.5 text-[10px] text-zinc-500">
              Table orders, menu options and kitchen service
            </p>
          </div>
        </div>
      </header>
      {(notice || uncertain) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${notice?.error || uncertain ? "border-amber-400/40 bg-amber-950 text-amber-100" : "border-emerald-400/40 bg-emerald-950 text-emerald-100"}`}
        >
          {notice && (
            <p role={notice.error ? "alert" : "status"}>{notice.text}</p>
          )}
          {uncertain && (
            <div className="mt-1 flex flex-wrap gap-x-4">
              {inWorkspace && (
                <button
                  type="button"
                  className="min-h-11 underline"
                  disabled={busy}
                  onClick={backToTables}
                >
                  Review open tables
                </button>
              )}
              <button
                type="button"
                className="min-h-11 underline"
                disabled={busy}
                onClick={() => {
                  setCart([]);
                  setUncertain(false);
                  setNotice(undefined);
                }}
              >
                Discard draft after checking
              </button>
            </div>
          )}
        </div>
      )}

      {!inWorkspace ? (
        <div
          ref={tableList}
          tabIndex={-1}
          className="scroll-mt-20 outline-none"
        >
          <TableOrders
            orders={orders}
            error={ordersError}
            busy={busy}
            refreshing={tablesRefreshing}
            settingUp={settingUp}
            onRefresh={refreshOrders}
            onSelect={openTable}
            onNew={() => {
              if (!uncertain) {
                setNotice(undefined);
                setSettingUp(true);
              }
            }}
            newLocked={uncertain}
            onCancelNew={() => setSettingUp(false)}
            onContinue={continueToMenu}
          />
        </div>
      ) : (
        <div
          ref={workspace}
          tabIndex={-1}
          className="space-y-4 scroll-mt-20 outline-none"
        >
          <header className="relative overflow-hidden rounded-3xl border border-zinc-800/90 bg-gradient-to-br from-[#0d1117] via-[#090b0f] to-[#07090c] shadow-[0_12px_40px_rgba(0,0,0,0.15)]">
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-cyan-400/40"
            />
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4">
              <button
                type="button"
                disabled={
                  busy ||
                  (cart.length > 0 &&
                    !uncertain &&
                    (selectedId === null || !!selected))
                }
                onClick={() => {
                  if (!uncertain) setCart([]);
                  backToTables();
                }}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg pr-2 text-xs font-medium text-emerald-100 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:opacity-50"
              >
                <ArrowLeft aria-hidden="true" className="size-4" /> All tables
              </button>
              {selectedId && (
                <RefreshButton
                  label="Refresh ticket"
                  refreshing={ticketRefreshing}
                  disabled={busy}
                  onClick={refreshOrders}
                />
              )}
            </div>
            <div className="flex min-w-0 items-center gap-4 px-5 py-5 sm:px-6">
              <WaiterMark />
              <div className="min-w-0">
                <h2 className="break-words text-xl font-semibold tracking-tight text-white">
                  {selected
                    ? `Table ${selected.tableId}`
                    : guest
                      ? `Table ${guest.table}`
                      : "Table order unavailable"}
                </h2>
                {selected ? (
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="font-mono text-xs text-zinc-200">
                      Order #{selected.orderNumber}
                    </p>
                    {selected.customer?.name && (
                      <p className="break-words text-xs text-zinc-200">
                        {selected.customer.name}
                      </p>
                    )}
                    <OrderStatus status={selected.status} />
                  </div>
                ) : guest ? (
                  <p className="mt-0.5 text-xs text-zinc-200">
                    {guest.name || "New order"}
                  </p>
                ) : null}
              </div>
              {(selected?.tableId || guest?.table) && (
                <div className="ml-auto hidden w-32 shrink-0 sm:block">
                  <TableRepresentation
                    label={selected?.tableId ?? guest?.table ?? ""}
                    ready={selected?.status === "READY"}
                    preparing={selected?.status === "PREPARING"}
                  />
                </div>
              )}
            </div>
          </header>

          {currentTicket?.error && (
            <p
              role="alert"
              className="rounded-xl border border-rose-400/25 bg-rose-950 px-4 py-3 text-sm text-rose-100"
            >
              {currentTicket.error}
            </p>
          )}

          {selectedId && !selected ? (
            <p
              role="status"
              className="rounded-xl border border-zinc-700 bg-zinc-900/40 p-4 text-sm"
            >
              {ticketRefreshing
                ? "Loading ticket…"
                : "This ticket is unavailable."}
            </p>
          ) : (
            <>
              {selected && (
                <KitchenTicket
                  order={selected}
                  formatMoney={money.format}
                  actions={
                    !uncertain && (
                      <>
                        {selected.status === "PENDING" && (
                          <button
                            type="button"
                            disabled={
                              busy ||
                              ticketRefreshing ||
                              Boolean(currentTicket?.error)
                            }
                            onClick={() => confirmSelected(selected)}
                            className="min-h-11 rounded-lg border border-amber-200/40 px-3 text-sm font-semibold text-amber-100 hover:bg-amber-200/10 focus-visible:outline-2 focus-visible:outline-amber-200 disabled:opacity-50"
                          >
                            Confirm for kitchen
                          </button>
                        )}
                        {canAddToTable(selected) && (
                          <button
                            type="button"
                            disabled={menuDisabled}
                            aria-expanded={menuOpen}
                            aria-controls="waiter-menu-region"
                            onClick={() => setMenuOpen(true)}
                            className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3.5 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:opacity-50 ${menuOpen ? "border border-white/20 text-zinc-100 hover:bg-white/8" : "bg-emerald-400 text-zinc-950 hover:bg-emerald-300"}`}
                          >
                            <Plus aria-hidden="true" className="size-4" />
                            Add items
                          </button>
                        )}
                      </>
                    )
                  }
                />
              )}

              {!selected && guest && (
                <button
                  type="button"
                  disabled={menuDisabled}
                  onClick={() => setMenuOpen(true)}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-400 px-4 text-xs font-semibold text-zinc-950 hover:bg-emerald-300 focus-visible:outline-2 focus-visible:outline-emerald-300 disabled:opacity-50"
                >
                  <Plus size={15} aria-hidden /> Add items
                </button>
              )}

              {menuOpen && (!selected || canAddToTable(selected)) && (
                <MenuGrid
                  table={selected?.tableId ?? guest?.table ?? ""}
                  lines={cart}
                  items={menu?.filter((item) => item.isAvailable) ?? null}
                  error={menuError}
                  optionsError={modifierCatalog.error}
                  disabled={menuDisabled}
                  customizableItems={customizableItems}
                  formatMoney={money.format}
                  onAdd={addItem}
                  onOptions={openOptions}
                  onRetry={refreshMenu}
                  onRetryOptions={modifierCatalog.refresh}
                  onClose={() => setMenuOpen(false)}
                />
              )}

              {!uncertain && cart.length > 0 && (
                <CartPanel
                  lines={cart}
                  busy={busy}
                  canSend={!menuDisabled}
                  formatMoney={money.format}
                  onChange={changeQuantity}
                  onEditOptions={(line) => openOptions(line.menuItem, line)}
                  customizableItems={customizableItems}
                  onSend={sendOrder}
                  onClear={() => setCart([])}
                />
              )}
            </>
          )}
        </div>
      )}
      {options && (
        <ModifierPicker
          item={options.item}
          groups={options.groups}
          initialModifiers={options.line?.modifiers ?? []}
          quantity={options.line?.quantity ?? 1}
          editing={Boolean(options.line)}
          blocked={menuDisabled}
          formatMoney={money.format}
          onClose={() => setOptions(null)}
          onSave={saveOptions}
        />
      )}
    </div>
  );
}
