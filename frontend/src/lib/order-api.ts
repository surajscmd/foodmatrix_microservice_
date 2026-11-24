export type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY";
type OrderStatus =
  "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";
export type OrderItemStatus = "PENDING" | "PREPARING" | "READY" | "CANCELLED";
export type RegisterOrderView = "open" | "history";
export type UnavailabilityDecision = "approve" | "cancel-order" | "dismiss";
export type PaymentMethod = "CASH" | "CARD" | "UPI" | "ONLINE";
type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Page<T> {
  data: T[];
  pagination: Pagination;
}

interface Message {
  message: string;
}

interface Result<T> extends Message {
  data: T;
}

interface Customer {
  id: string;
  phone: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  name: string;
  price: string;
  quantity: number;
  total: string;
  status: OrderItemStatus;
  unavailableReason?: string | null;
  unavailableRequestedAt?: string | null;
  unavailableResolvedAt?: string | null;
  modifiers: Array<{
    id: string;
    orderItemId: string;
    modifierId: string;
    name: string;
    price: string;
    quantity: number;
  }>;
}

export function needsUnavailableReview(item: OrderItem) {
  return Boolean(item.unavailableRequestedAt && !item.unavailableResolvedAt);
}

interface Payment {
  id: string;
  orderId: string;
  amount: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId: string | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNumber: number;
  restaurantId: string;
  staffId: string | null;
  customerId: string | null;
  tableId: string | null;
  type: OrderType;
  status: OrderStatus;
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  payments: Payment[];
  customer: Customer | null;
}

export interface OrderDashboard {
  queueTotal: number;
  queue: Array<Pick<Order, "id" | "orderNumber" | "status" | "createdAt">>;
  revenue: Array<{ day: string; amount: number }>;
}

export interface OrderItemInput {
  menuItemId: string;
  quantity?: number;
  modifiers?: Array<{ modifierId: string; quantity?: number }>;
}

export type CreateOrderInput = {
  phone: string;
  name?: string;
  items: OrderItemInput[];
} & (
  | { type: "DINE_IN"; tableId: string }
  | { type: "TAKEAWAY" | "DELIVERY"; tableId?: never }
);

export interface CreatePaymentInput {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  transactionId?: string;
}

interface OrderPayments {
  orderId: string;
  orderTotal: string;
  paidAmount: string;
  remainingAmount: string;
  isFullyPaid: boolean;
  payments: Payment[];
}

interface RecordedPayment {
  payment: Payment;
  orderTotal: string;
  previousPaidAmount: string;
  newPaidAmount: string;
  remainingAmount: string;
  fullyPaid: boolean;
}

export class OrderApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "OrderApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/order/${path}`, {
    ...init,
    credentials: "same-origin",
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.message;
    throw new OrderApiError(
      response.status,
      Array.isArray(message)
        ? message.join(", ")
        : typeof message === "string"
          ? message
          : `Order Service request failed (${response.status}).`,
    );
  }

  return payload as T;
}

async function readData<T>(path: string, init?: RequestInit): Promise<T> {
  return (await request<Result<T>>(path, init)).data;
}

function json(method: "POST" | "PATCH", body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

const orderPath = (id: string) => `orders/${encodeURIComponent(id)}`;
const orderPaymentsPath = (id: string) =>
  `payments/order/${encodeURIComponent(id)}`;
function changeOrderStatus(
  orderId: string,
  action: "confirm" | "prepare" | "ready" | "complete",
) {
  return readData<Order>(`${orderPath(orderId)}/${action}`, { method: "POST" });
}

export const orderApi = {
  getDashboard: (signal?: AbortSignal) =>
    request<OrderDashboard>("orders/dashboard", { signal }),

  getRestaurantDashboard: (restaurantId: string, signal?: AbortSignal) =>
    request<OrderDashboard>(
      `orders/dashboard?${new URLSearchParams({ restaurantId })}`,
      { signal },
    ),

  getRegisterOrders: (
    view: RegisterOrderView,
    page: number,
    signal?: AbortSignal,
  ) => {
    const query = new URLSearchParams({ view, page: String(page) });
    return request<Page<Order>>(`orders?${query}`, { signal });
  },

  getOrder: (orderId: string, signal?: AbortSignal) =>
    readData<Order>(orderPath(orderId), { signal }),

  createOrder: (input: CreateOrderInput, idempotencyKey: string) =>
    readData<Order>("orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(input),
    }),

  addItems: (orderId: string, items: OrderItemInput[]) =>
    readData<Order>(`${orderPath(orderId)}/items`, json("POST", { items })),

  setItemStatus: (orderId: string, itemId: string, status: OrderItemStatus) =>
    readData<{ item: OrderItem; order: Order }>(
      `${orderPath(orderId)}/kitchen/items/${encodeURIComponent(itemId)}/status`,
      json("PATCH", { status }),
    ),

  reportUnavailable: (orderId: string, itemId: string, reason: string) =>
    readData<Order>(
      `${orderPath(orderId)}/items/${encodeURIComponent(itemId)}/unavailability`,
      json("POST", { reason }),
    ),

  reviewUnavailable: (
    orderId: string,
    itemId: string,
    decision: UnavailabilityDecision,
  ) =>
    readData<Order>(
      `${orderPath(orderId)}/items/${encodeURIComponent(itemId)}/unavailability`,
      json("PATCH", { decision }),
    ),

  removeItem: (orderId: string, itemId: string) =>
    readData<Order>(
      `${orderPath(orderId)}/items/${encodeURIComponent(itemId)}`,
      {
        method: "DELETE",
      },
    ),

  confirmOrder: (orderId: string) => changeOrderStatus(orderId, "confirm"),
  prepareOrder: (orderId: string) => changeOrderStatus(orderId, "prepare"),
  markOrderReady: (orderId: string) => changeOrderStatus(orderId, "ready"),
  completeOrder: (orderId: string) => changeOrderStatus(orderId, "complete"),

  createPayment: (input: CreatePaymentInput) =>
    readData<RecordedPayment>("payments", json("POST", input)),

  getOrderPayments: (orderId: string) =>
    readData<OrderPayments>(orderPaymentsPath(orderId)),
};
