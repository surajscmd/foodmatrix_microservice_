// app/restaurant/waiter/types.ts

export interface MenuItem {
  id: string;
  name: string;

  category:
    | "Starters"
    | "Mains"
    | "Desserts"
    | "Beverages"
    | "Sides";

  description: string;

  price: number;
  cost: number;

  status:
    | "Available"
    | "Sold Out"
    | "Seasonal"
    | "Discontinued";

  popularity: "High" | "Medium" | "Low";

  sales30d: number;

  prepTime: number;

  isVeg?: boolean;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Restaurant {
  id: string;
  name: string;
}

export interface Order {
  id: string;

  restaurantId: string;
  restaurantName: string;

  items: OrderItem[];

  total: number;

  status:
    | "Pending"
    | "Preparing"
    | "Ready"
    | "Completed"
    | "Cancelled";

  type: "Dine-In" | "Takeaway" | "Delivery";

  timestamp: string;

  cashierName: string;

  customerName: string;

  tableNumber: string;
}

export interface WaiterScreenProps {
  menuItems: MenuItem[];
  restaurants: Restaurant[];
  searchTerm: string;
  onAddOrder: (order: Partial<Order>) => void;
}

export interface MenuGridProps {
  items: MenuItem[];
  category: string;
  setCategory: (category: string) => void;
  onAddToCart: (item: MenuItem) => void;
}

export interface CartPanelProps {
  table: string;
  customerName: string;
  guests: number;

  cart: CartItem[];

  subtotal: number;
  tax: number;
  total: number;

  onIncrease: (id: string) => void;
  onDecrease: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onSend: () => void;
}