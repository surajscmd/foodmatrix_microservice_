export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Corporate Admin' | 'Regional Director' | 'Operations Executive' | 'Store Manager';
  avatar: string;
}
// new types for sidebar navigation
import type { LucideIcon } from "lucide-react";
export interface SidebarHeaderConfig {
  title: string;
  subtitle: string;
}

export interface SidebarNavItem {
  title: string;
  href: string;
  icon: LucideIcon;

  header: SidebarHeaderConfig;

  badge?: number;
}

export interface SidebarNavSection {
  title: string;
  items: SidebarNavItem[];
}
export interface Restaurant {
  id: string;
  name: string;
  region: 'East' | 'West' | 'Midwest' | 'South';
  status: 'Operational' | 'Maintenance' | 'Opening Soon' | 'Suspended';
  manager: string;
  revenue24h: number;
  revenueMonth: number;
  employeeCount: number;
  openOrders: number;
  inventoryAlerts: number;
  rating: number;
  address: string;
  phone: string;
  city: string;
}

export interface Employee {
  id: string;
  name: string;
  role: 'Store Manager' | 'Head Chef' | 'Sous Chef' | 'Line Cook' | 'Cashier' | 'Server';
  restaurantId: string;
  restaurantName: string;
  status: 'Active' | 'On Leave' | 'Suspended';
  shift: 'Morning' | 'Evening' | 'Night';
  email: string;
  phone: string;
  salary: number;
  performance: 'Outstanding' | 'Satisfactory' | 'Needs Improvement';
}

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
export interface CartItem extends MenuItem {
  quantity: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  category: 'Produce' | 'Meat & Poultry' | 'Dairy' | 'Dry Goods' | 'Packaging';
  supplierId: string;
  supplierName: string;
  lastRestocked: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  unitCost: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  category: string;
  activeOrders: number;
  rating: number;
  status: 'Active' | 'Under Review' | 'Inactive';
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
export interface KdsScreenProps {
  orders: Order[];
  onProgressOrder: (
    orderId: string,
    nextStatus: Order["status"]
  ) => void;
}
export interface Notification {
  id: string;
  type: 'alert' | 'info' | 'success' | 'warning';
  title: string;
  message: string;
  time: string;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface MetricCard {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  timeframe: string;
}

export interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  restaurantId: string;
  restaurantName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'Scheduled' | 'Completed' | 'In Progress' | 'No Show';
}

export interface AttendanceLog {
  id: string;
  employeeId: string;
  employeeName: string;
  restaurantId: string;
  restaurantName: string;
  checkIn: string;
  checkOut?: string | null;
  status: 'On Time' | 'Late' | 'Overtime' | 'Active';
}

export interface InventoryRequest {
  id: string;
  requesterRestaurantId: string;
  requesterRestaurantName: string;
  itemSelector: string;
  quantity: number;
  unit: string;
  urgency: 'Standard' | 'Urgent' | 'Critical';
  status: 'Pending' | 'Approved' | 'Rejected' | 'Fulfilled';
  requestedAt: string;
  fulfilledAt?: string;
}

export interface FranchiseInventory {
  restaurantId: string;
  restaurantName: string;
  items: {
    inventoryItemId: string;
    name: string;
    quantity: number;
    unit: string;
    status: 'In Stock' | 'Low Stock' | 'Out of Stock';
    minThreshold: number;
  }[];
}

/* =========================
   Analytics
========================= */

export interface RevenueRegion {
  id: number;
  region: string;
  value: number;
  amount: string;
  color: string;
  strokeDashArray: string;
  strokeDashOffset: string;
}

export interface CategorySale {
  id: number;
  name: string;
  revenue: string;
  percentage: number;
  color: string;
}

