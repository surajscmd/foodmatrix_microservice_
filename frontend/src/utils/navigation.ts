import {
  Bell,
  Boxes,
  CalendarDays,
  LayoutGrid,
  MonitorPlay,
  Settings,
  Tv,
  UserCheck,
  Utensils,
  ClipboardList,
  PackageSearch,
  ShoppingCart,
  Store,
  Users,
} from "lucide-react";

import type { SidebarNavSection } from "./types";

// resturant navigation object
export const navigation: SidebarNavSection[] = [
  {
    title: "Overview",
    items: [
      {
        title: "Edge Dashboard",
        href: "/restaurant/edge-dashboard",
        icon: LayoutGrid,
        header: {
          title: "Operations Control Center",
          subtitle: "FoodMatrix Downtown",
        },
      },
    ],
  },

  {
    title: "Operations",
    items: [
      {
        title: "Cashier POS",
        href: "/restaurant/pos",
        icon: MonitorPlay,
        header: {
          title: "Cashier POS Terminal",
          subtitle: "Sales Operations",
        },
      },
      {
        title: "Waiter Order Pad",
        href: "/restaurant/waiter",
        icon: Utensils,
        header: {
          title: "Waiter Order Management",
          subtitle: "Table Service",
        },
      },
      {
        title: "Kitchen Display",
        href: "/restaurant/kitchen",
        icon: Tv,
        header: {
          title: "Kitchen Display System",
          subtitle: "Kitchen Operations",
        },
      },
    ],
  },

  {
    title: "Workforce",
    items: [
      {
        title: "Punch Clock Station",
        href: "/restaurant/punch-clock",
        icon: UserCheck,
        header: {
          title: "Punch Clock Station",
          subtitle: "Employee Check-In & Check-Out",
        },
      },
      {
        title: "Shift & Attendance",
        href: "/restaurant/attendancereports",
        icon: CalendarDays,
        header: {
          title: "Shift & Attendance",
          subtitle: "Workforce Management",
        },
      },
    ],
  },

  {
    title: "Inventory",
    items: [
      {
        title: "Inventory",
        href: "/restaurant/inventory",
        icon: Boxes,
        header: {
          title: "Inventory Management",
          subtitle: "Stock & Procurement",
        },
      },
    ],
  },

  {
    title: "System",
    items: [
      {
        title: "Alerts",
        href: "/restaurant/alerts",
        icon: Bell,
        header: {
          title: "Alerts Hub",
          subtitle: "Notifications & Incidents",
        },
      },
      {
        title: "Settings",
        href: "/restaurant/settings",
        icon: Settings,
        header: {
          title: "Platform Settings",
          subtitle: "Restaurant Configuration",
        },
      },
    ],
  },
];
// src\app\operations
// central operation navinagion object
export const regionalNavigation: SidebarNavSection[] = [
  {
    title: "Corporate Command",
    items: [
      {
        title: "Operations Control",
        href: "/operations/info",
        icon: LayoutGrid,
        header: {
          title: "Regional Operations Command Center",
          subtitle: "Corporate Command",
        },
      },
      // {
      //   title: "Matrix Analytics",
      //   href: "/operations/analytics",
      //   icon: Building2,
      //   header: {
      //     title: "Matrix Analytics",
      //     subtitle: "Enterprise Performance Intelligence",
      //   },
      // },
    ],
  },

  {
    title: "Franchise Network",
    items: [
      {
        title: "Franchise Network",
        href: "/operations/restaurants",
        icon: Store,
        header: {
          title: "Franchise Network",
          subtitle: "Restaurant Locations & Performance",
        },
      },
      {
        title: "Staff Registry",
        href: "/operations/staff",
        icon: Users,
        header: {
          title: "Regional Staff Registry",
          subtitle: "Employee Directory & Workforce",
        },
      },
      {
        title: "Central Menu",
        href: "/operations/menu",
        icon: ClipboardList,
        header: {
          title: "Central Menu Management",
          subtitle: "Menu Standardization & Pricing",
        },
      },
    ],
  },

  {
    title: "Supply Chain",
    items: [
      {
        title: "Global Inventory",
        href: "/operations/inventory",
        icon: Boxes,
        header: {
          title: "Global Inventory",
          subtitle: "Network-wide Stock Visibility",
        },
      },
      {
        title: "Stock Requests",
        href: "/operations/stockrequests",
        icon: ShoppingCart,
        header: {
          title: "Stock Requests",
          subtitle: "Inventory Management",
        },
      },
      {
        title: "Fulfillment Ledger",
        href: "/operations/fulfillment",
        icon: PackageSearch,
        header: {
          title: "Fulfillment Ledger",
          subtitle: "Distribution & Logistics",
        },
      },
      {
        title: "Stock Audit",
        href: "/operations/stockaudit",
        icon: ClipboardList,
        header: {
          title: "Stock Audit",
          subtitle: "Inventory Movements & Audit Trail",
        },
      },
    ],
  },

  {
    title: "System Utilities",
    items: [
      {
        title: "Notifications",
        href: "/operations/notifications",
        icon: Bell,
        header: {
          title: "Notifications",
          subtitle: "Warehouse Activity & Updates",
        },
      },
      {
        title: "Platform Settings",
        href: "/operations/settings",
        icon: Settings,
        header: {
          title: "Platform Settings",
          subtitle: "Display & Notification Preferences",
        },
      },
    ],
  },
];
