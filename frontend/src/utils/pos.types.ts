// components/restaurant/pos/pos.types.ts
export interface MenuItem {
  id: string;
  name: string;
  category: 'Starters' | 'Mains' | 'Desserts' | 'Beverages' | 'Sides';
  price: number;
  cost: number;
  status: 'Available' | 'Sold Out' | 'Seasonal' | 'Discontinued';
  description: string;
  popularity: 'High' | 'Medium' | 'Low';
  sales30d: number;
  prepTime: number; // in minutes
}

export interface Order {
  id: string;
  restaurantId: string;
  restaurantName: string;
  items: {
    menuItemId: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  status: 'Pending' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';
  timestamp: string;
  type: 'Dine-In' | 'Takeout' | 'Drive-Thru';
  cashierName: string;
  customerName?: string;
  tableNumber?: string;
}


export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export type PaymentMethod = "Cash" | "Card" | "UPI";

export type FulfillmentType = "Takeout" | "Drive-Thru";

export interface OrderPayload {
  restaurantId: string;
  restaurantName: string;

  items: {
    menuItemId: string;
    name: string;
    quantity: number;
    price: number;
  }[];

  total: number;

  status: Order["status"];

  timestamp: string;

  type: FulfillmentType;

  cashierName: string;

  customerName: string;
}
