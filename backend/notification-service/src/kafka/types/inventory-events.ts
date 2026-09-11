export interface LowStockIngredient {
  stockId: string;
  ingredientId: string;
  ingredient: {
    id: string;
    name: string;
    uom: string;
  } | null;
}

export interface LowStockEvent {
  restaurantId: string;
  warehouseId?: string;
  items: LowStockIngredient[];
}

export interface StockRequestCreatedEvent {
  stockRequestId: string;
  restaurantId: string;
  warehouseId: string;
  requestedBy: string;
  itemCount: number;
}

export interface StockRequestApprovedItem {
  ingredientId: string;
  approvedQty: string;
}

export interface StockRequestApprovedEvent {
  stockRequestId: string;
  restaurantId: string;
  warehouseId: string;
  items: StockRequestApprovedItem[];
}

export interface StockShippedItem {
  ingredientId: string;
  shippedQty: string;
}

export interface StockShippedEvent {
  stockTransferId: string;
  stockRequestId: string | null;
  restaurantId: string;
  warehouseId: string;
  items: StockShippedItem[];
}

export interface StockReceivedItem {
  ingredientId: string;
  receivedQty: string;
}

export interface StockReceivedEvent {
  stockTransferId: string;
  stockRequestId: string | null;
  restaurantId: string;
  warehouseId: string;
  items: StockReceivedItem[];
}
