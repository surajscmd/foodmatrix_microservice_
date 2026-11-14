"use client";

import { useEffect, useRef, useState } from "react";
import { loadAllStockIngredients } from "@/lib/catalog-api";
import {
  cancelStockRequest,
  createStockRequest,
  getRestaurantStockMovements,
  getRestaurantStockRequests,
  getRestaurantStocks,
  getRestaurantTransfers,
  InventoryApiError,
  receiveStockTransfer,
  type PaginatedResult,
  type RestaurantStockView,
  type StockMovementView,
  type StockRequest,
  type StockTransfer,
} from "@/lib/inventory-api";
import { useOrganizationStore } from "@/store/organization-store";
import type { Restaurant } from "@/utils/types/organization";
import InventoryRequestForm, {
  FormPanel,
  type IngredientOption,
} from "@/elements/inventroyresto/InventoryRequestForm";
import InventoryReceiveForm from "@/elements/inventroyresto/InventoryReceiveForm";
import InventoryStockPanel from "@/elements/inventroyresto/InventoryStockPanel";
import {
  MovementTable,
  RequestList,
  TransferList,
} from "@/elements/inventroyresto/InventoryActivity";
import InventoryHeader, {
  type Section,
} from "@/elements/inventroyresto/InventoryHeader";
import { allPages, button } from "@/elements/inventroyresto/inventory-view";

type Form =
  | { type: "request"; preset: { id: string; amount: string } | null }
  | { type: "receive"; transfer: StockTransfer }
  | { type: "cancel"; request: StockRequest };

interface Data {
  stock: RestaurantStockView[];
  requests: StockRequest[];
  deliveries: StockTransfer[];
  movements: PaginatedResult<StockMovementView>;
}

const message = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "The inventory request could not be completed.";

export default function FranchiseInventoryScreen() {
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
    <Workspace
      key={`${user.id}:${restaurant.id}`}
      restaurant={restaurant}
      manager={user.role === "RESTAURANT_ADMIN"}
    />
  );
}

function Workspace({
  restaurant,
  manager,
}: {
  restaurant: Restaurant;
  manager: boolean;
}) {
  const [section, setSection] = useState<Section>("stock");
  const [movementPage, setMovementPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<{
    key: string;
    rows: Partial<Data>;
    errors: Partial<Record<Section, string>>;
  }>();
  const [catalog, setCatalog] = useState<IngredientOption[]>([]);
  const [catalogError, setCatalogError] = useState("");
  const [catalogRevision, setCatalogRevision] = useState(0);
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionUncertain, setActionUncertain] = useState(false);
  const [notice, setNotice] = useState("");
  const lock = useRef(false);
  const sectionRef = useRef<HTMLElement>(null);
  const loadKey = `${section}:${movementPage}:${revision}`;
  const refreshing = data?.key !== loadKey;
  const rows = data?.rows ?? {};
  const error = data?.errors[section];

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    const id = restaurant.id;
    const paged = { limit: 50 };
    async function load() {
      try {
        const result =
          section === "stock"
            ? {
                stock: await allPages(
                  (page) =>
                    getRestaurantStocks(id, { ...paged, page }, options),
                  options.signal,
                ),
              }
            : section === "requests"
              ? {
                  requests: await allPages(
                    (page) =>
                      getRestaurantStockRequests(
                        id,
                        { ...paged, page },
                        options,
                      ),
                    options.signal,
                  ),
                }
              : section === "deliveries"
                ? {
                    deliveries: await allPages(
                      (page) =>
                        getRestaurantTransfers(id, { ...paged, page }, options),
                      options.signal,
                    ),
                  }
                : {
                    movements: await getRestaurantStockMovements(
                      id,
                      { page: movementPage, limit: 20 },
                      options,
                    ),
                  };
        if (!controller.signal.aborted)
          setData((previous) => ({
            key: loadKey,
            rows: { ...previous?.rows, ...result },
            errors: { ...previous?.errors, [section]: undefined },
          }));
      } catch (error) {
        if (!controller.signal.aborted)
          setData((previous) => ({
            key: loadKey,
            rows: previous?.rows ?? {},
            errors: { ...previous?.errors, [section]: message(error) },
          }));
      }
    }
    void load();
    return () => controller.abort();
  }, [restaurant.id, section, movementPage, loadKey]);

  useEffect(() => {
    let active = true;
    void loadAllStockIngredients()
      .then((ingredients) => {
        if (!active) return;
        setCatalog(ingredients.filter((ingredient) => ingredient.isActive));
        setCatalogError("");
      })
      .catch((error: unknown) => {
        if (active) setCatalogError(message(error));
      });
    return () => {
      active = false;
    };
  }, [catalogRevision]);

  const options = new Map(
    catalog.map((ingredient) => [ingredient.id, ingredient]),
  );
  for (const stock of rows.stock ?? []) {
    if (stock.ingredient?.isActive)
      options.set(stock.ingredient.id, stock.ingredient);
  }
  const ingredients = [...options.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const ingredientLabel = (id: string) => options.get(id)?.name ?? id;
  const canRequest = manager && Boolean(restaurant.franchiseId?.trim());

  function openForm(next: Form) {
    setActionError("");
    setActionUncertain(false);
    setNotice("");
    setForm(next);
    requestAnimationFrame(() => {
      sectionRef.current?.focus({ preventScroll: true });
      sectionRef.current?.scrollIntoView({ block: "nearest" });
    });
  }

  async function mutate(action: () => Promise<string>, next: Section) {
    if (lock.current || !manager || actionUncertain) return;
    lock.current = true;
    setBusy(true);
    setActionError("");
    try {
      setNotice(await action());
      setForm(null);
      setSection(next);
      setRevision((value) => value + 1);
    } catch (error) {
      if (
        !(error instanceof InventoryApiError) ||
        error.status >= 500 ||
        error.status === 408
      ) {
        setActionUncertain(true);
        setActionError(
          `${message(error)} Close this form and refresh ${next === "requests" ? "Requests" : "Deliveries"} to check whether it went through before trying again.`,
        );
      } else {
        setActionError(message(error));
      }
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-4 text-zinc-100">
      <InventoryHeader
        restaurantName={restaurant.name}
        section={section}
        refreshing={refreshing}
        busy={busy}
        showRequest={manager}
        requestDisabled={!canRequest || form !== null}
        tabsDisabled={form !== null}
        onSection={setSection}
        onRefresh={() => setRevision((value) => value + 1)}
        onRequest={() => openForm({ type: "request", preset: null })}
      />
      {manager && !canRequest && (
        <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">
          A franchise warehouse is required to request stock.
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-100"
        >
          {notice}
        </p>
      )}

      {form && (
        <section ref={sectionRef} tabIndex={-1} className="scroll-mt-20">
          <FormPanel
            title={
              form.type === "request"
                ? "New stock request"
                : form.type === "receive"
                  ? "Receive delivery"
                  : "Cancel stock request"
            }
            busy={busy}
            onClose={() => setForm(null)}
          >
            {form.type === "request" && (
              <>
                {catalogError && (
                  <div className="flex flex-wrap items-center gap-2 px-4 pt-3 text-sm text-amber-100">
                    <p>Ingredient catalog unavailable. {catalogError}</p>
                    <button
                      type="button"
                      className={button}
                      disabled={busy}
                      onClick={() => setCatalogRevision((value) => value + 1)}
                    >
                      Retry catalog
                    </button>
                  </div>
                )}
                <InventoryRequestForm
                  options={ingredients}
                  preset={form.preset}
                  busy={busy || actionUncertain}
                  error={actionError}
                  onSubmit={(payload) =>
                    void mutate(async () => {
                      if (!canRequest)
                        throw new Error("A franchise warehouse is required.");
                      await createStockRequest({
                        restaurantId: restaurant.id,
                        warehouseId: restaurant.franchiseId,
                        ...payload,
                      });
                      return "Stock request sent to the warehouse.";
                    }, "requests")
                  }
                />
              </>
            )}
            {form.type === "receive" && (
              <InventoryReceiveForm
                transfer={form.transfer}
                ingredientLabel={ingredientLabel}
                busy={busy || actionUncertain}
                error={actionError}
                onSubmit={(payload) =>
                  void mutate(async () => {
                    const result = await receiveStockTransfer(
                      form.transfer.id,
                      payload,
                    );
                    return result.status === "DISPUTED"
                      ? "Received stock was recorded. The shortage was sent for warehouse review."
                      : "Delivery received. Restaurant stock has been updated.";
                  }, "deliveries")
                }
              />
            )}
            {form.type === "cancel" && (
              <div className="space-y-3 p-4 text-sm">
                <p>
                  Cancel request{" "}
                  <strong className="font-mono">
                    #{form.request.id.slice(0, 8)}
                  </strong>
                  ?
                </p>
                {actionError && (
                  <p role="alert" className="text-rose-200">
                    {actionError}
                  </p>
                )}
                <button
                  type="button"
                  className={`${button} text-rose-200`}
                  disabled={busy || actionUncertain}
                  onClick={() =>
                    void mutate(async () => {
                      await cancelStockRequest(form.request.id);
                      return "Stock request cancelled.";
                    }, "requests")
                  }
                >
                  Confirm cancellation
                </button>
              </div>
            )}
          </FormPanel>
        </section>
      )}

      {refreshing && (
        <p role="status" className="text-xs text-zinc-300">
          {rows[section] ? "Refreshing inventory…" : "Loading inventory…"}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-100"
        >
          {error}
        </p>
      )}
      {section === "stock" && rows.stock && (
        <InventoryStockPanel
          rows={rows.stock}
          canManage={canRequest}
          busy={busy || refreshing || Boolean(error) || form !== null}
          onRequest={(row) =>
            openForm({
              type: "request",
              preset: {
                id: row.ingredientId,
                amount:
                  Number(row.reorderQuantity) > 0
                    ? String(row.reorderQuantity)
                    : "",
              },
            })
          }
        />
      )}
      {section === "requests" && rows.requests && (
        <RequestList
          rows={rows.requests}
          timezone={restaurant.timezone}
          ingredientLabel={ingredientLabel}
          canManage={manager}
          busy={busy || refreshing || Boolean(error) || form !== null}
          onCancel={(request) => openForm({ type: "cancel", request })}
        />
      )}
      {section === "deliveries" && rows.deliveries && (
        <TransferList
          rows={rows.deliveries}
          timezone={restaurant.timezone}
          ingredientLabel={ingredientLabel}
          canManage={manager}
          busy={busy || refreshing || Boolean(error) || form !== null}
          onReceive={(transfer) => openForm({ type: "receive", transfer })}
        />
      )}
      {section === "movements" && rows.movements && (
        <>
          <MovementTable
            rows={rows.movements.data}
            timezone={restaurant.timezone}
          />
          {(rows.movements.pagination.totalPages > 1 || movementPage > 1) && (
            <nav
              aria-label="Movement pages"
              className="flex items-center justify-between gap-2"
            >
              <button
                type="button"
                className={button}
                disabled={refreshing || movementPage <= 1}
                onClick={() => setMovementPage((page) => page - 1)}
              >
                Previous
              </button>
              <span className="text-xs text-zinc-300">
                Page {rows.movements.pagination.page} of{" "}
                {rows.movements.pagination.totalPages}
              </span>
              <button
                type="button"
                className={button}
                disabled={
                  refreshing ||
                  movementPage >= rows.movements.pagination.totalPages
                }
                onClick={() => setMovementPage((page) => page + 1)}
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
