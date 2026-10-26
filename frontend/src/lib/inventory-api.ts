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

// Re-export types so components can import from this file.
export type * from "@/utils/types/inventory";

const API_BASE = "/api/inventory";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export class InventoryApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "InventoryApiError";
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
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

      if (messages.length) {
        return messages.join(", ");
      }
    }
  }

  return `Inventory request failed (${status})`;
}

function queryString(query: object = {}): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }

  const result = params.toString();

  return result ? `?${result}` : "";
}

function segment(value: string): string {
  if (!value.trim()) {
    throw new Error("A required inventory ID is missing");
  }

  return encodeURIComponent(value);
}

async function request<T>(
  path: string,
  method: HttpMethod = "GET",
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}/${path}`, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    signal: options.signal,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      throw new InventoryApiError(
        response.ok
          ? "Inventory Service returned invalid JSON"
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
      "Inventory Service returned an empty response",
      response.status,
    );
  }

  return payload as T;
}

async function getData<T>(path: string, options?: RequestOptions): Promise<T> {
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
  const response = await request<ApiResponse<T>>(path, method, body);

  return response.data;
}

// ======================================================
// WAREHOUSE STOCK — 5 ROUTES
// ======================================================

export async function getWarehouseStocks(
  warehouseId: string,
  query: PageQuery = {},
  options: RequestOptions = {},
): Promise<PaginatedResult<WarehouseStockView>> {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(query.limit ?? 10),
  });

  const response = await fetch(
    `/api/inventory/warehouse-stock/warehouse/${encodeURIComponent(
      warehouseId,
    )}?${params}`,
    {
      credentials: "same-origin",
      cache: "no-store",
      signal: options.signal,
    },
  );

  const body = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof body.message === "string"
        ? body.message
        : "Failed to fetch warehouse stock",
    );
  }

  return {
    data: body.data,
    pagination: body.pagination,
  };
}
export function getWarehouseIngredientStock(
  warehouseId: string,
  ingredientId: string,
  options?: RequestOptions,
): Promise<WarehouseStockView> {
  return getData(
    `warehouse-stock/warehouse/${segment(
      warehouseId,
    )}/ingredient/${segment(ingredientId)}`,
    options,
  );
}

export function receiveWarehouseStock(
  input: ReceiveStockInput,
): Promise<WarehouseStock> {
  return mutate("warehouse-stock/receive", input);
}

export function bulkReceiveWarehouseStock(
  input: BulkReceiveStockInput,
): Promise<
  {
    stock: WarehouseStock;
    stockMovement: AdjustmentResult<WarehouseStock>["stockMovement"];
  }[]
> {
  return mutate("warehouse-stock/receive/bulk", input);
}

export function adjustWarehouseStock(
  warehouseId: string,
  ingredientId: string,
  input: AdjustStockInput,
): Promise<AdjustmentResult<WarehouseStock>> {
  return mutate(
    `warehouse-stock/${segment(warehouseId)}/${segment(ingredientId)}/adjust`,
    input,
  );
}

// ======================================================
// RESTAURANT STOCK — 4 ROUTES
// ======================================================

export function getRestaurantStocks(
  restaurantId: string,
  query: PageQuery = {},
  options?: RequestOptions,
): Promise<PaginatedResult<RestaurantStockView>> {
  return request(
    `restaurant-stock/${segment(restaurantId)}` + queryString(query),
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
  return request(
    `restaurant-stock/${segment(restaurantId)}/low-stock` + queryString(query),
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
  return getData(
    `restaurant-stock/${segment(restaurantId)}/${segment(ingredientId)}`,
    options,
  );
}

export function adjustRestaurantStock(
  restaurantId: string,
  ingredientId: string,
  input: AdjustStockInput,
): Promise<AdjustmentResult<RestaurantStock>> {
  return mutate(
    `restaurant-stock/${segment(restaurantId)}/${segment(ingredientId)}/adjust`,
    input,
  );
}

// ======================================================
// STOCK MOVEMENTS — 3 ROUTES
// ======================================================

export function getStockMovements(
  query: MovementQuery = {},
  options?: RequestOptions,
): Promise<PaginatedResult<StockMovementView>> {
  return getData(`stock-movements${queryString(query)}`, options);
}

export function getRestaurantStockMovements(
  restaurantId: string,
  query: MovementQuery = {},
  options?: RequestOptions,
): Promise<PaginatedResult<StockMovementView>> {
  return getData(
    `stock-movements/restaurant/${segment(restaurantId)}` + queryString(query),
    options,
  );
}

export function getWarehouseStockMovements(
  warehouseId: string,
  query: MovementQuery = {},
  options?: RequestOptions,
): Promise<PaginatedResult<StockMovementView>> {
  return getData(
    `stock-movements/warehouse/${segment(warehouseId)}` + queryString(query),
    options,
  );
}

// ======================================================
// STOCK REQUESTS — 12 ROUTES
// ======================================================

export function createStockRequest(
  input: CreateStockRequestInput,
): Promise<StockRequest> {
  return mutate("stock-requests", input);
}

export function getStockRequests(
  query: RequestQuery = {},
  options?: RequestOptions,
): Promise<PaginatedResult<StockRequest>> {
  return getData(`stock-requests${queryString(query)}`, options);
}

export function getStockRequest(
  requestId: string,
  options?: RequestOptions,
): Promise<StockRequest> {
  return getData(`stock-requests/${segment(requestId)}`, options);
}

export function getRestaurantStockRequests(
  restaurantId: string,
  query: RequestQuery = {},
  options?: RequestOptions,
): Promise<PaginatedResult<StockRequest>> {
  return getData(
    `stock-requests/restaurant/${segment(restaurantId)}` + queryString(query),
    options,
  );
}

export function getWarehouseStockRequests(
  warehouseId: string,
  query: RequestQuery = {},
  options?: RequestOptions,
): Promise<PaginatedResult<StockRequest>> {
  return getData(
    `stock-requests/warehouse/${segment(warehouseId)}` + queryString(query),
    options,
  );
}

export function updateStockRequest(
  requestId: string,
  input: UpdateStockRequestInput,
): Promise<StockRequest | null> {
  return mutate(`stock-requests/${segment(requestId)}`, input, "PATCH");
}

export function deleteStockRequest(
  requestId: string,
  restaurantId: string,
  userId: string,
): Promise<DeleteStockRequestResult> {
  // This endpoint has no outer { message, data } envelope.
  return request(
    `stock-requests/${segment(requestId)}/restaurant/${segment(restaurantId)}` +
      queryString({ userId }),
    "DELETE",
  );
}

export function cancelStockRequest(
  requestId: string,
): Promise<StockRequest | null> {
  return mutate(`stock-requests/${segment(requestId)}/cancel`);
}

export function approveStockRequest(
  requestId: string,
  input: ApproveStockRequestInput,
): Promise<StockTransfer> {
  // Backend returns the newly created transfer.
  return mutate(`stock-requests/${segment(requestId)}/approve`, input);
}

export function rejectStockRequest(
  requestId: string,
  reason: string,
): Promise<StockRequest | null> {
  return mutate(`stock-requests/${segment(requestId)}/reject`, { reason });
}

export function createStockRequestFromLowStock(
  restaurantId: string,
): Promise<StockRequest> {
  return mutate(
    `stock-requests/restaurant/${segment(restaurantId)}/from-low-stock`,
  );
}

export function getStockRequestLowStock(
  restaurantId: string,
  query: PageQuery = {},
  options?: RequestOptions,
): Promise<PaginatedResult<RestaurantStockView>> {
  return getData(
    `stock-requests/restaurant/${segment(
      restaurantId,
    )}/low-stock${queryString(query)}`,
    options,
  );
}

// ======================================================
// STOCK TRANSFERS — 10 ROUTES
// ======================================================

export function getWarehouseTransfers(
  warehouseId: string,
  query: TransferQuery = {},
  options?: RequestOptions,
): Promise<PaginatedResult<StockTransfer>> {
  return getData(
    `stock-transfers/warehouse/${segment(warehouseId)}` + queryString(query),
    options,
  );
}

export function getRestaurantTransfers(
  restaurantId: string,
  query: TransferQuery = {},
  options?: RequestOptions,
): Promise<PaginatedResult<StockTransfer>> {
  return getData(
    `stock-transfers/restaurant/${segment(restaurantId)}` + queryString(query),
    options,
  );
}

export function getStockTransfer(
  transferId: string,
  options?: RequestOptions,
): Promise<StockTransfer> {
  return getData(`stock-transfers/${segment(transferId)}`, options);
}

export function startTransferPicking(
  transferId: string,
): Promise<StockTransfer | null> {
  return mutate(`stock-transfers/${segment(transferId)}/start-picking`);
}

export function markTransferReadyToShip(
  transferId: string,
): Promise<StockTransfer | null> {
  return mutate(`stock-transfers/${segment(transferId)}/ready-to-ship`);
}

export function createTransferShipment(
  transferId: string,
  input: CreateShipmentInput,
): Promise<Shipment> {
  return mutate(`stock-transfers/${segment(transferId)}/shipment`, input);
}

export function shipStockTransfer(
  transferId: string,
  input: ShipTransferInput,
): Promise<StockTransfer> {
  return mutate(`stock-transfers/${segment(transferId)}/ship`, input);
}

export function markTransferInTransit(
  transferId: string,
): Promise<StockTransfer | null> {
  return mutate(`stock-transfers/${segment(transferId)}/in-transit`);
}

export function receiveStockTransfer(
  transferId: string,
  input: ReceiveTransferInput,
): Promise<StockTransfer> {
  return mutate(`stock-transfers/${segment(transferId)}/receive`, input);
}

export function resolveTransferDiscrepancy(
  transferId: string,
  resolution: string,
): Promise<StockTransfer> {
  return mutate(`stock-transfers/${segment(transferId)}/resolve-discrepancy`, {
    resolution,
  });
}

// ======================================================
// WASTE LOGS — 3 ROUTES
// ======================================================

export function createWasteLog(input: CreateWasteInput): Promise<WasteResult> {
  return mutate("waste-logs", input);
}

export function getRestaurantWasteLogs(
  restaurantId: string,
  query: PageQuery = {},
  options?: RequestOptions,
): Promise<PaginatedResult<WasteLogView>> {
  return getData(
    `waste-logs/restaurant/${segment(restaurantId)}` + queryString(query),
    options,
  );
}

export function getWasteLog(
  wasteLogId: string,
  options?: RequestOptions,
): Promise<WasteLogView> {
  return getData(`waste-logs/${segment(wasteLogId)}`, options);
}

// ======================================================
// LOAD ALL WAREHOUSE STOCK
// Used for warehouse-wide search, metrics, and pagination.
// ======================================================

export async function loadAllWarehouseStock(
  warehouseId: string,
  signal: AbortSignal,
): Promise<WarehouseStockView[]> {
  const records = new Map<string, WarehouseStockView>();

  let page = 1;
  let totalPages = 1;

  do {
    if (signal.aborted) {
      throw new DOMException("Request aborted", "AbortError");
    }

    const response = await getWarehouseStocks(
      warehouseId,
      { page, limit: 50 },
      { signal },
    );

    response.data.forEach((item) => {
      records.set(item.id, item);
    });

    totalPages = response.pagination.totalPages;
    page += 1;
  } while (page <= totalPages);

  return [...records.values()];
}

// ======================================================
// LOAD WAREHOUSE MOVEMENT PAGE
// getWarehouseStockMovements already unwraps the response.
// ======================================================

export async function loadStockMovements(
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

// ======================================================
// DELETE WAREHOUSE STOCK
// Requires the DELETE endpoint provided previously.
// ======================================================

export async function deleteWarehouseStockRecord(
  warehouseId: string,
  ingredientId: string,
  reason: string,
): Promise<void> {
  await request(
    `warehouse-stock/${encodeURIComponent(
      warehouseId,
    )}/${encodeURIComponent(ingredientId)}`,
    "DELETE",
    { reason },
  );
}