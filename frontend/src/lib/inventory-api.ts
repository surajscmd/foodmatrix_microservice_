import { getRestaurant } from "@/lib/organization-api";

import type {
  AdjustmentResult,
  AdjustStockInput,
  ApiResponse,
  ApproveStockRequestInput,
  BulkReceiveStockInput,
  CreateShipmentInput,
  CreateStockRequestInput,
  CreateWasteInput,
  DeleteStockRequestResult,
  InventoryRestaurant,
  MovementQuery,
  PageQuery,
  PaginatedResult,
  ReceiveStockInput,
  ReceiveTransferInput,
  RequestOptions,
  RequestQuery,
  RestaurantStock,
  RestaurantStockView,
  Shipment,
  ShipTransferInput,
  StockMovementView,
  StockRequest,
  StockTransfer,
  TransferQuery,
  UpdateStockRequestInput,
  WarehouseStock,
  WarehouseStockView,
  WasteLogView,
  WasteResult,
} from "@/utils/types/inventory";

export type * from "@/utils/types/inventory";

const API_BASE = "/api/inventory";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

// ======================================================
// ERRORS
// ======================================================

export class InventoryApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "InventoryApiError";
    this.status = status;
  }
}

export function stockRequestError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Unable to process this stock request.";
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function errorMessage(body: unknown, status: number): string {
  if (isRecord(body)) {
    if (typeof body.message === "string") {
      return body.message;
    }

    if (Array.isArray(body.message)) {
      const messages = body.message.filter(
        (value): value is string => typeof value === "string",
      );

      if (messages.length > 0) {
        return messages.join(", ");
      }
    }
  }

  return `Inventory request failed (${status})`;
}

// ======================================================
// REQUEST HELPERS
// ======================================================

function queryString(query: object = {}): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      params.set(key, String(value));
    }
  }

  const result = params.toString();

  return result ? `?${result}` : "";
}

function segment(value: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("A required inventory ID is missing.");
  }

  return encodeURIComponent(value.trim());
}

function checkAborted(options?: RequestOptions): void {
  if (options?.signal?.aborted) {
    throw new DOMException("Request aborted", "AbortError");
  }
}

async function request<T>(
  path: string,
  method: HttpMethod = "GET",
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  checkAborted(options);

  const response = await fetch(`${API_BASE}/${path}`, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    signal: options.signal,
    headers: {
      Accept: "application/json",
      ...(body !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
    },
    ...(body !== undefined
      ? { body: JSON.stringify(body) }
      : {}),
  });

  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      throw new InventoryApiError(
        response.ok
          ? "Inventory Service returned invalid JSON."
          : `Inventory request failed (${response.status})`,
        response.status,
      );
    }
  }

  if (!response.ok) {
    throw new InventoryApiError(
      errorMessage(payload, response.status),
      response.status,
    );
  }

  if (payload === null) {
    throw new InventoryApiError(
      "Inventory Service returned an empty response.",
      response.status,
    );
  }

  return payload as T;
}

async function getData<T>(
  path: string,
  options?: RequestOptions,
): Promise<T> {
  const response = await request<ApiResponse<T>>(
    path,
    "GET",
    undefined,
    options,
  );

  return response.data;
}

async function mutate<T>(
  path: string,
  body?: unknown,
  method: "POST" | "PATCH" = "POST",
): Promise<T> {
  const response = await request<ApiResponse<T>>(
    path,
    method,
    body,
  );

  return response.data;
}

// ======================================================
// RESTAURANT LOOKUPS
// Shared by stock requests and transfers.
// Each unique restaurant is fetched once per enrichment call.
// ======================================================

async function fetchRestaurantMap(
  ids: string[],
  options?: RequestOptions,
): Promise<Map<string, InventoryRestaurant>> {
  checkAborted(options);

  const restaurantIds = [...new Set(ids.filter(Boolean))];

  const results = await Promise.allSettled(
    restaurantIds.map(
      async (id): Promise<InventoryRestaurant> => {
        const restaurant = await getRestaurant(id);

        if (
          typeof restaurant?.name !== "string" ||
          !restaurant.name.trim()
        ) {
          throw new Error(
            `Organization Service returned no name for restaurant ${id}.`,
          );
        }

        return {
          id,
          name: restaurant.name,
        };
      },
    ),
  );

  checkAborted(options);

  const restaurants = new Map<string, InventoryRestaurant>();

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      restaurants.set(result.value.id, result.value);
    } else {
      console.error(
        "Restaurant lookup failed:",
        restaurantIds[index],
        result.reason,
      );
    }
  });

  return restaurants;
}

// ======================================================
// STOCK REQUEST ENRICHMENT
// ======================================================

async function enrichRequestRestaurants(
  requests: StockRequest[],
  options?: RequestOptions,
): Promise<StockRequest[]> {
  const restaurants = await fetchRestaurantMap(
    requests.map((item) => item.restaurantId),
    options,
  );

  return requests.map((item) => ({
    ...item,
    restaurant:
      restaurants.get(item.restaurantId) ??
      item.restaurant ??
      null,
  }));
}

async function getEnrichedRequestPage(
  path: string,
  options?: RequestOptions,
): Promise<PaginatedResult<StockRequest>> {
  const result = await getData<
    PaginatedResult<StockRequest>
  >(path, options);

  if (
    !Array.isArray(result?.data) ||
    !result.pagination ||
    !Number.isInteger(result.pagination.totalPages) ||
    result.pagination.totalPages < 0
  ) {
    throw new Error("Invalid stock request list response.");
  }

  return {
    ...result,
    data: await enrichRequestRestaurants(
      result.data,
      options,
    ),
  };
}

// ======================================================
// TRANSFER ENRICHMENT
// ======================================================

async function enrichTransferRestaurants(
  transfers: StockTransfer[],
  options?: RequestOptions,
): Promise<StockTransfer[]> {
  const restaurants = await fetchRestaurantMap(
    transfers.map((item) => item.toRestaurantId),
    options,
  );

  return transfers.map((item) => ({
    ...item,
    restaurant:
      restaurants.get(item.toRestaurantId) ??
      item.restaurant ??
      null,
  }));
}

async function getEnrichedTransferPage(
  path: string,
  options?: RequestOptions,
): Promise<PaginatedResult<StockTransfer>> {
  const result = await getData<
    PaginatedResult<StockTransfer>
  >(path, options);

  if (
    !Array.isArray(result?.data) ||
    !result.pagination ||
    !Number.isInteger(result.pagination.totalPages) ||
    result.pagination.totalPages < 0
  ) {
    throw new Error("Invalid stock transfer list response.");
  }

  return {
    ...result,
    data: await enrichTransferRestaurants(
      result.data,
      options,
    ),
  };
}

// ======================================================
// WAREHOUSE STOCK
// ======================================================

export async function getWarehouseStocks(
  warehouseId: string,
  query: PageQuery = {},
  options?: RequestOptions,
): Promise<PaginatedResult<WarehouseStockView>> {
  // Warehouse stock returns pagination at the top level.
  const result = await request<
    PaginatedResult<WarehouseStockView>
  >(
    `warehouse-stock/warehouse/${segment(warehouseId)}` +
      queryString({
        page: query.page ?? 1,
        limit: query.limit ?? 10,
      }),
    "GET",
    undefined,
    options,
  );

  return {
    data: result.data,
    pagination: result.pagination,
  };
}

export function getWarehouseIngredientStock(
  warehouseId: string,
  ingredientId: string,
  options?: RequestOptions,
): Promise<WarehouseStockView> {
  return getData<WarehouseStockView>(
    `warehouse-stock/warehouse/${segment(
      warehouseId,
    )}/ingredient/${segment(ingredientId)}`,
    options,
  );
}

export function receiveWarehouseStock(
  input: ReceiveStockInput,
): Promise<WarehouseStock> {
  return mutate<WarehouseStock>(
    "warehouse-stock/receive",
    input,
  );
}

export function bulkReceiveWarehouseStock(
  input: BulkReceiveStockInput,
): Promise<
  {
    stock: WarehouseStock;
    stockMovement: AdjustmentResult<WarehouseStock>["stockMovement"];
  }[]
> {
  return mutate<
    {
      stock: WarehouseStock;
      stockMovement: AdjustmentResult<WarehouseStock>["stockMovement"];
    }[]
  >("warehouse-stock/receive/bulk", input);
}

export function adjustWarehouseStock(
  warehouseId: string,
  ingredientId: string,
  input: AdjustStockInput,
): Promise<AdjustmentResult<WarehouseStock>> {
  return mutate<AdjustmentResult<WarehouseStock>>(
    `warehouse-stock/${segment(warehouseId)}/${segment(
      ingredientId,
    )}/adjust`,
    input,
  );
}

export async function deleteWarehouseStockRecord(
  warehouseId: string,
  ingredientId: string,
  reason: string,
): Promise<void> {
  await request<unknown>(
    `warehouse-stock/${segment(warehouseId)}/${segment(
      ingredientId,
    )}`,
    "DELETE",
    { reason },
  );
}

// ======================================================
// RESTAURANT STOCK
// ======================================================

export function getRestaurantStocks(
  restaurantId: string,
  query: PageQuery = {},
  options?: RequestOptions,
): Promise<PaginatedResult<RestaurantStockView>> {
  return request<PaginatedResult<RestaurantStockView>>(
    `restaurant-stock/${segment(restaurantId)}` +
      queryString(query),
    "GET",
    undefined,
    options,
  );
}

export function getRestaurantLowStock(
  restaurantId: string,
  query: PageQuery = {},
  options?: RequestOptions,
): Promise<PaginatedResult<RestaurantStockView>> {
  return request<PaginatedResult<RestaurantStockView>>(
    `restaurant-stock/${segment(restaurantId)}/low-stock` +
      queryString(query),
    "GET",
    undefined,
    options,
  );
}

export function getRestaurantIngredientStock(
  restaurantId: string,
  ingredientId: string,
  options?: RequestOptions,
): Promise<RestaurantStockView> {
  return getData<RestaurantStockView>(
    `restaurant-stock/${segment(restaurantId)}/${segment(
      ingredientId,
    )}`,
    options,
  );
}

export function adjustRestaurantStock(
  restaurantId: string,
  ingredientId: string,
  input: AdjustStockInput,
): Promise<AdjustmentResult<RestaurantStock>> {
  return mutate<AdjustmentResult<RestaurantStock>>(
    `restaurant-stock/${segment(restaurantId)}/${segment(
      ingredientId,
    )}/adjust`,
    input,
  );
}

// ======================================================
// STOCK MOVEMENTS
// ======================================================

export function getStockMovements(
  query: MovementQuery = {},
  options?: RequestOptions,
): Promise<PaginatedResult<StockMovementView>> {
  return getData<PaginatedResult<StockMovementView>>(
    `stock-movements${queryString(query)}`,
    options,
  );
}

export function getRestaurantStockMovements(
  restaurantId: string,
  query: MovementQuery = {},
  options?: RequestOptions,
): Promise<PaginatedResult<StockMovementView>> {
  return getData<PaginatedResult<StockMovementView>>(
    `stock-movements/restaurant/${segment(restaurantId)}` +
      queryString(query),
    options,
  );
}

export function getWarehouseStockMovements(
  warehouseId: string,
  query: MovementQuery = {},
  options?: RequestOptions,
): Promise<PaginatedResult<StockMovementView>> {
  return getData<PaginatedResult<StockMovementView>>(
    `stock-movements/warehouse/${segment(warehouseId)}` +
      queryString(query),
    options,
  );
}

// ======================================================
// STOCK REQUESTS — CREATE / LIST / DETAILS
// ======================================================

export function createStockRequest(
  input: CreateStockRequestInput,
): Promise<StockRequest> {
  return mutate<StockRequest>("stock-requests", input);
}

export function getStockRequests(
  query: RequestQuery = {},
  options?: RequestOptions,
): Promise<PaginatedResult<StockRequest>> {
  return getEnrichedRequestPage(
    `stock-requests${queryString(query)}`,
    options,
  );
}

export async function getStockRequest(
  requestId: string,
  options?: RequestOptions,
): Promise<StockRequest> {
  const stockRequest = await getData<StockRequest>(
    `stock-requests/${segment(requestId)}`,
    options,
  );

  const [enriched] = await enrichRequestRestaurants(
    [stockRequest],
    options,
  );

  return enriched ?? stockRequest;
}

export function getRestaurantStockRequests(
  restaurantId: string,
  query: RequestQuery = {},
  options?: RequestOptions,
): Promise<PaginatedResult<StockRequest>> {
  return getEnrichedRequestPage(
    `stock-requests/restaurant/${segment(restaurantId)}` +
      queryString(query),
    options,
  );
}

export function getWarehouseStockRequests(
  warehouseId: string,
  query: RequestQuery = {},
  options?: RequestOptions,
): Promise<PaginatedResult<StockRequest>> {
  return getEnrichedRequestPage(
    `stock-requests/warehouse/${segment(warehouseId)}` +
      queryString(query),
    options,
  );
}

// ======================================================
// STOCK REQUESTS — ACTIONS
// ======================================================

export function updateStockRequest(
  requestId: string,
  input: UpdateStockRequestInput,
): Promise<StockRequest | null> {
  return mutate<StockRequest | null>(
    `stock-requests/${segment(requestId)}`,
    input,
    "PATCH",
  );
}

export function deleteStockRequest(
  requestId: string,
  restaurantId: string,
  userId: string,
): Promise<DeleteStockRequestResult> {
  // This endpoint returns its result without a data envelope.
  return request<DeleteStockRequestResult>(
    `stock-requests/${segment(
      requestId,
    )}/restaurant/${segment(restaurantId)}` +
      queryString({ userId }),
    "DELETE",
  );
}

export function cancelStockRequest(
  requestId: string,
): Promise<StockRequest | null> {
  return mutate<StockRequest | null>(
    `stock-requests/${segment(requestId)}/cancel`,
  );
}

export function approveStockRequest(
  requestId: string,
  input: ApproveStockRequestInput,
): Promise<StockTransfer> {
  // Approval returns the newly created transfer.
  return mutate<StockTransfer>(
    `stock-requests/${segment(requestId)}/approve`,
    input,
  );
}

export function rejectStockRequest(
  requestId: string,
  reason: string,
): Promise<StockRequest | null> {
  return mutate<StockRequest | null>(
    `stock-requests/${segment(requestId)}/reject`,
    { reason },
  );
}

export function createStockRequestFromLowStock(
  restaurantId: string,
): Promise<StockRequest> {
  return mutate<StockRequest>(
    `stock-requests/restaurant/${segment(
      restaurantId,
    )}/from-low-stock`,
  );
}

export function getStockRequestLowStock(
  restaurantId: string,
  query: PageQuery = {},
  options?: RequestOptions,
): Promise<PaginatedResult<RestaurantStockView>> {
  return getData<PaginatedResult<RestaurantStockView>>(
    `stock-requests/restaurant/${segment(
      restaurantId,
    )}/low-stock${queryString(query)}`,
    options,
  );
}

// ======================================================
// TRANSFERS — LISTS
// ======================================================

export function getWarehouseTransfers(
  warehouseId: string,
  query: TransferQuery = {},
  options?: RequestOptions,
): Promise<PaginatedResult<StockTransfer>> {
  return getEnrichedTransferPage(
    `stock-transfers/warehouse/${segment(warehouseId)}` +
      queryString(query),
    options,
  );
}

export function getRestaurantTransfers(
  restaurantId: string,
  query: TransferQuery = {},
  options?: RequestOptions,
): Promise<PaginatedResult<StockTransfer>> {
  return getEnrichedTransferPage(
    `stock-transfers/restaurant/${segment(restaurantId)}` +
      queryString(query),
    options,
  );
}

// ======================================================
// TRANSFER DETAILS
// Returns items, shipment, discrepancies, request relations,
// and the destination restaurant name.
// ======================================================

export async function getStockTransfer(
  transferId: string,
  options?: RequestOptions,
): Promise<StockTransfer> {
  const transfer = await getData<StockTransfer>(
    `stock-transfers/${segment(transferId)}`,
    options,
  );

  const [enriched] = await enrichTransferRestaurants(
    [transfer],
    options,
  );

  return enriched ?? transfer;
}

// ======================================================
// TRANSFERS — WAREHOUSE PREPARATION
// ======================================================

export function startTransferPicking(
  transferId: string,
): Promise<StockTransfer | null> {
  return mutate<StockTransfer | null>(
    `stock-transfers/${segment(transferId)}/start-picking`,
  );
}

export function markTransferReadyToShip(
  transferId: string,
): Promise<StockTransfer | null> {
  return mutate<StockTransfer | null>(
    `stock-transfers/${segment(transferId)}/ready-to-ship`,
  );
}

// ======================================================
// TRANSFERS — SHIPMENT / DISPATCH
// ======================================================

export function createTransferShipment(
  transferId: string,
  input: CreateShipmentInput,
): Promise<Shipment> {
  return mutate<Shipment>(
    `stock-transfers/${segment(transferId)}/shipment`,
    input,
  );
}

export function shipStockTransfer(
  transferId: string,
  input: ShipTransferInput,
): Promise<StockTransfer> {
  return mutate<StockTransfer>(
    `stock-transfers/${segment(transferId)}/ship`,
    input,
  );
}

export function markTransferInTransit(
  transferId: string,
): Promise<StockTransfer | null> {
  return mutate<StockTransfer | null>(
    `stock-transfers/${segment(transferId)}/in-transit`,
  );
}

// ======================================================
// TRANSFERS — RESTAURANT RECEIPT
// ======================================================

export function receiveStockTransfer(
  transferId: string,
  input: ReceiveTransferInput,
): Promise<StockTransfer> {
  return mutate<StockTransfer>(
    `stock-transfers/${segment(transferId)}/receive`,
    input,
  );
}

// ======================================================
// TRANSFERS — DISCREPANCY RESOLUTION
// ======================================================

export function resolveTransferDiscrepancy(
  transferId: string,
  resolution: string,
): Promise<StockTransfer> {
  return mutate<StockTransfer>(
    `stock-transfers/${segment(
      transferId,
    )}/resolve-discrepancy`,
    { resolution },
  );
}

// ======================================================
// WASTE LOGS
// ======================================================

export function createWasteLog(
  input: CreateWasteInput,
): Promise<WasteResult> {
  return mutate<WasteResult>("waste-logs", input);
}

export function getRestaurantWasteLogs(
  restaurantId: string,
  query: PageQuery = {},
  options?: RequestOptions,
): Promise<PaginatedResult<WasteLogView>> {
  return getData<PaginatedResult<WasteLogView>>(
    `waste-logs/restaurant/${segment(restaurantId)}` +
      queryString(query),
    options,
  );
}

export function getWasteLog(
  wasteLogId: string,
  options?: RequestOptions,
): Promise<WasteLogView> {
  return getData<WasteLogView>(
    `waste-logs/${segment(wasteLogId)}`,
    options,
  );
}

// ======================================================
// LOAD ALL WAREHOUSE STOCK
// ======================================================

export async function loadAllWarehouseStock(
  warehouseId: string,
  signal: AbortSignal,
): Promise<WarehouseStockView[]> {
  const records = new Map<string, WarehouseStockView>();

  let page = 1;
  let totalPages = 1;

  do {
    checkAborted({ signal });

    const result = await getWarehouseStocks(
      warehouseId,
      { page, limit: 50 },
      { signal },
    );

    if (
      !Array.isArray(result?.data) ||
      !result.pagination ||
      !Number.isInteger(result.pagination.totalPages) ||
      result.pagination.totalPages < 0
    ) {
      throw new Error("Invalid warehouse stock response.");
    }

    for (const stock of result.data) {
      records.set(stock.id, stock);
    }

    totalPages = result.pagination.totalPages;
    page++;
  } while (page <= totalPages);

  checkAborted({ signal });

  return [...records.values()];
}

// ======================================================
// LOAD WAREHOUSE MOVEMENT PAGE
// ======================================================

export function loadStockMovements(
  warehouseId: string,
  filters: MovementQuery,
  signal: AbortSignal,
): Promise<PaginatedResult<StockMovementView>> {
  return getWarehouseStockMovements(
    warehouseId,
    filters,
    { signal },
  );
}