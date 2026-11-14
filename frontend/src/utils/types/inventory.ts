// ======================================================
// SHARED TYPES
// ======================================================

export type DecimalValue = string | number;

export type LocationType =
  | "WAREHOUSE"
  | "RESTAURANT"
  | "TRANSIT";

export type MovementType =
  | "POS_SALE"
  | "PURCHASE"
  | "TRANSFER_IN"
  | "TRANSFER_OUT"
  | "ADJUSTMENT"
  | "WASTE";

export type StockRequestStatus =
  | "REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "FULFILLED"
  | "CANCELLED";

export type TransferStatus =
  | "REQUESTED"
  | "APPROVED"
  | "PICKING"
  | "READY_TO_SHIP"
  | "SHIPPED"
  | "IN_TRANSIT"
  | "RECEIVED"
  | "DISPUTED"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";

export type TransferDiscrepancyType =
  | "SHORT_RECEIPT"
  | "DAMAGED"
  | "MISSING"
  | "WRONG_ITEM"
  | "OTHER";

export interface Ingredient {
  id: string;
  name: string;
  uom: string;
  isActive: boolean;
}

export interface InventoryRestaurant {
  id: string;
  name: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: Pagination;
}

export interface ApiResponse<T> {
  message: string;
  data: T;
}

export interface PageQuery {
  page?: number;
  limit?: number;
}

export interface RequestQuery extends PageQuery {
  status?: StockRequestStatus;
}

export interface TransferQuery extends PageQuery {
  status?: TransferStatus;
}

export interface MovementQuery extends PageQuery {
  ingredientId?: string;
  movementType?: MovementType;
  fromDate?: string;
  toDate?: string;
}

export interface RequestOptions {
  signal?: AbortSignal;
}

// ======================================================
// WAREHOUSE STOCK
// ======================================================

export interface WarehouseStock {
  id: string;
  warehouseId: string;
  ingredientId: string;
  quantityOnHand: DecimalValue;
  updatedAt: string;
}

export interface WarehouseStockView extends WarehouseStock {
  ingredient: Ingredient | null;
}

// ======================================================
// RESTAURANT STOCK
// ======================================================

export interface RestaurantStock {
  id: string;
  restaurantId: string;
  ingredientId: string;
  quantityOnHand: DecimalValue;
  reorderLevel: DecimalValue;
  reorderQuantity: DecimalValue;
  updatedAt: string;
}

export interface RestaurantStockView extends RestaurantStock {
  ingredient: Ingredient | null;
}

// ======================================================
// STOCK MOVEMENTS
// ======================================================

export interface StockMovement {
  id: string;
  locationType: LocationType;
  locationId: string;
  ingredientId: string;
  movementType: MovementType;
  quantityChange: DecimalValue;
  referenceId: string | null;
  reason: string | null;
  createdAt: string;
}

export interface StockMovementView extends StockMovement {
  ingredient: Ingredient | null;
}

// ======================================================
// STOCK INPUTS / RESULTS
// ======================================================

export interface AdjustmentResult<T> {
  stock: T | null;
  stockMovement: StockMovement;
}

export interface ReceiveStockInput {
  warehouseId: string;
  ingredientId: string;
  quantity: number;
  referenceId?: string;
}

export interface BulkReceiveStockInput {
  warehouseId: string;
  items: {
    ingredientId: string;
    quantity: number;
    referenceId?: string;
  }[];
}

export interface AdjustStockInput {
  quantityChange: number;
  reason: string;
}

// ======================================================
// STOCK REQUESTS
// ======================================================

export interface StockRequestItem {
  id: string;
  stockRequestId: string;
  ingredientId: string;

  requestedQty: DecimalValue;
  approvedQty: DecimalValue | null;

  ingredient?: Ingredient | null;
}

export interface StockRequest {
  id: string;
  restaurantId: string;
  warehouseId: string;

  // Populated by the frontend inventory API helper.
  restaurant?: InventoryRestaurant | null;

  requestedBy: string;
  approvedBy: string | null;
  rejectedBy: string | null;

  status: StockRequestStatus;

  reason: string | null;
  rejectionReason: string | null;

  requestedAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  fulfilledAt: string | null;

  createdAt: string;
  updatedAt: string;

  // Some mutation responses omit relations.
  items?: StockRequestItem[];

  transfers?: Array<
    Pick<StockTransfer, "id"> & Partial<StockTransfer>
  >;
}

export interface StockRequestItemInput {
  ingredientId: string;
  requestedQty: number;
}

export interface CreateStockRequestInput {
  restaurantId: string;
  warehouseId: string;
  reason?: string;
  items: StockRequestItemInput[];
}

export interface UpdateStockRequestInput {
  reason?: string;
  items: StockRequestItemInput[];
}

export interface ApproveStockRequestInput {
  items: {
    ingredientId: string;
    approvedQty: number;
  }[];
}

export interface DeleteStockRequestResult {
  message: string;
  requestId: string;
}

// ======================================================
// OPERATIONS STOCK REQUEST VIEWS
// ======================================================

export type RequestStatus = StockRequestStatus;

export type StockRequestLine = StockRequestItem;

export type OperationsStockRequest = Omit<
  StockRequest,
  "items"
> & {
  items: StockRequestItem[];
};

export type StockRequestPage =
  PaginatedResult<OperationsStockRequest>;

export type ApproveRequestPayload =
  ApproveStockRequestInput;

// ======================================================
// STOCK TRANSFERS
// ======================================================

export interface StockTransferItem {
  id: string;
  transferId: string;
  ingredientId: string;

  requestedQty: DecimalValue;
  approvedQty: DecimalValue | null;
  shippedQty: DecimalValue | null;
  receivedQty: DecimalValue | null;

  ingredient?: Ingredient | null;
}

export interface StockTransfer {
  id: string;
  stockRequestId: string | null;

  fromWarehouseId: string;
  toRestaurantId: string;

  // Destination restaurant, populated by the API helper.
  restaurant?: InventoryRestaurant | null;

  status: TransferStatus;

  requestedBy: string | null;
  approvedBy: string | null;
  rejectedBy: string | null;
  shippedBy: string | null;
  receivedBy: string | null;

  requestedAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  shippedAt: string | null;
  receivedAt: string | null;
  completedAt: string | null;

  rejectionReason: string | null;

  createdAt: string;
  updatedAt: string;

  // Relations differ between list, detail, and mutation responses.
  items?: StockTransferItem[];
  shipment?: Shipment | null;
  discrepancies?: TransferDiscrepancy[];
  stockRequest?: Partial<StockRequest> | null;
}

// ======================================================
// OPERATIONS TRANSFER VIEWS
// ======================================================

export type OperationsStockTransfer = Omit<
  StockTransfer,
  "items"
> & {
  items: StockTransferItem[];
};

// ======================================================
// SHIPMENTS
// ======================================================

export interface Shipment {
  id: string;
  transferId: string;

  carrierName: string | null;
  trackingNumber: string | null;

  shipperName: string | null;
  shipperPhone: string | null;

  driverName: string | null;
  driverPhone: string | null;

  vehicleNumber: string | null;
  vehicleType: string | null;

  dispatchLocation: string | null;
  deliveryLocation: string | null;

  estimatedArrival: string | null;
  dispatchedAt: string | null;
  deliveredAt: string | null;

  notes: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface CreateShipmentInput {
  carrierName?: string;
  trackingNumber?: string;

  // Backend maps dispatcher fields to Shipment.shipper fields.
  dispatcherName?: string;
  dispatcherPhone?: string;

  driverName?: string;
  driverPhone?: string;

  vehicleNumber?: string;
  vehicleType?: string;

  dispatchLocation?: string;
  deliveryLocation?: string;

  estimatedArrival?: string;
  notes?: string;
}

// ======================================================
// TRANSFER INPUTS
// ======================================================

export interface ShipTransferInput {
  items: {
    transferItemId: string;
    shippedQty: number;
  }[];
}

export interface ReceiveTransferInput {
  items: {
    transferItemId: string;
    receivedQty: number;
    reason?: string;
  }[];
}

// ======================================================
// TRANSFER DISCREPANCIES
// ======================================================

export interface TransferDiscrepancy {
  id: string;
  transferId: string;
  transferItemId: string;

  type: TransferDiscrepancyType;

  expectedQty: DecimalValue | null;
  actualQty: DecimalValue | null;

  reason: string | null;

  reportedBy: string;
  resolvedBy: string | null;
  resolution: string | null;

  createdAt: string;
  resolvedAt: string | null;
}

// ======================================================
// WASTE
// ======================================================

export interface WasteLog {
  id: string;
  restaurantId: string;
  ingredientId: string;
  qty: DecimalValue;
  reason: string;
  createdAt: string;
}

export interface WasteLogView extends WasteLog {
  ingredient: Ingredient | null;
}

export interface CreateWasteInput {
  restaurantId: string;
  ingredientId: string;
  qty: number;
  reason: string;
}

export interface WasteResult {
  wasteLog: WasteLog;
  stockMovement: StockMovement;
  stock: RestaurantStock | null;
}
// ======================================================
// STOCK AUDIT FILTERS
// ======================================================

export interface StockAuditFilterValues {
  location: "WAREHOUSE" | "RESTAURANT";
  restaurantId: string;
  ingredientId: string;
  movementType: MovementType | "";
  fromDate: string;
  toDate: string;
}