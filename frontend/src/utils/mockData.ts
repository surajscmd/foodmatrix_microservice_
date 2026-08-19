import { Restaurant, Employee, MenuItem, InventoryItem, Supplier, Order, Notification, User } from './types';

export const currentUser: User = {
  id: 'USR-001',
  name: 'Marcus Vance',
  email: 'marcus.vance@foodmatrix.corp',
  role: 'Corporate Admin',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256'
};
export const dailyRevenue = [
  {
    day: "Mon",
    revenue: 8200,
  },
  {
    day: "Tue",
    revenue: 10400,
  },
  {
    day: "Wed",
    revenue: 9800,
  },
  {
    day: "Thu",
    revenue: 12450,
  },
  {
    day: "Fri",
    revenue: 14800,
  },
  {
    day: "Sat",
    revenue: 17600,
  },
  {
    day: "Sun",
    revenue: 15200,
  },
];


export const hourlyRevenue = [
  {
    hour: "8 AM",
    sales: 450,
  },
  {
    hour: "10 AM",
    sales: 900,
  },
  {
    hour: "12 PM",
    sales: 2400,
  },
  {
    hour: "2 PM",
    sales: 3200,
  },
  {
    hour: "4 PM",
    sales: 1800,
  },
  {
    hour: "6 PM",
    sales: 4200,
  },
  {
    hour: "8 PM",
    sales: 5100,
  },
  {
    hour: "10 PM",
    sales: 2200,
  },
];
export const initialRestaurants: Restaurant[] = [
  {
    id: 'R-101',
    name: 'FoodMatrix Downtown',
    region: 'East',
    status: 'Operational',
    manager: 'Sarah Jenkins',
    revenue24h: 12450.00,
    revenueMonth: 345200.00,
    employeeCount: 24,
    openOrders: 5,
    inventoryAlerts: 1,
    rating: 4.8,
    address: '455 Market St, San Francisco',
    phone: '(415) 555-0192',
    city: 'San Francisco'
  },
  {
    id: 'R-102',
    name: 'FoodMatrix Midtown',
    region: 'East',
    status: 'Operational',
    manager: 'David Miller',
    revenue24h: 9820.00,
    revenueMonth: 289100.00,
    employeeCount: 18,
    openOrders: 3,
    inventoryAlerts: 0,
    rating: 4.6,
    address: '1211 Avenue of the Americas, New York',
    phone: '(212) 555-0143',
    city: 'New York'
  },
  {
    id: 'R-103',
    name: 'FoodMatrix North Loop',
    region: 'Midwest',
    status: 'Operational',
    manager: 'Robert Chen',
    revenue24h: 8400.00,
    revenueMonth: 243500.00,
    employeeCount: 15,
    openOrders: 8,
    inventoryAlerts: 3,
    rating: 4.5,
    address: '312 N May St, Chicago',
    phone: '(312) 555-0177',
    city: 'Chicago'
  },
  {
    id: 'R-104',
    name: 'FoodMatrix Beverly Hills',
    region: 'West',
    status: 'Operational',
    manager: 'Chloe Fontaine',
    revenue24h: 15800.00,
    revenueMonth: 489000.00,
    employeeCount: 29,
    openOrders: 4,
    inventoryAlerts: 0,
    rating: 4.9,
    address: '9601 Wilshire Blvd, Los Angeles',
    phone: '(310) 555-0112',
    city: 'Los Angeles'
  },
  {
    id: 'R-105',
    name: 'FoodMatrix South Beach',
    region: 'South',
    status: 'Maintenance',
    manager: 'Alejandro Gomez',
    revenue24h: 0.00,
    revenueMonth: 195000.00,
    employeeCount: 14,
    openOrders: 0,
    inventoryAlerts: 4,
    rating: 4.3,
    address: '1100 Collins Ave, Miami',
    phone: '(305) 555-0188',
    city: 'Miami'
  },
  {
    id: 'R-106',
    name: 'FoodMatrix Pearl District',
    region: 'West',
    status: 'Opening Soon',
    manager: 'Elena Rostova',
    revenue24h: 0.00,
    revenueMonth: 0.00,
    employeeCount: 6,
    openOrders: 0,
    inventoryAlerts: 0,
    rating: 0.0,
    address: '1005 NW Couch St, Portland',
    phone: '(503) 555-0165',
    city: 'Portland'
  }
];

export const initialEmployees: Employee[] = [
  {
    id: 'EMP-001',
    name: 'Sarah Jenkins',
    role: 'Store Manager',
    restaurantId: 'R-101',
    restaurantName: 'FoodMatrix Downtown',
    status: 'Active',
    shift: 'Morning',
    email: 's.jenkins@foodmatrix.com',
    phone: '(415) 555-9281',
    salary: 82000,
    performance: 'Outstanding'
  },
  {
    id: 'EMP-002',
    name: 'Marco Pierre',
    role: 'Head Chef',
    restaurantId: 'R-101',
    restaurantName: 'FoodMatrix Downtown',
    status: 'Active',
    shift: 'Morning',
    email: 'm.pierre@foodmatrix.com',
    phone: '(415) 555-9282',
    salary: 76000,
    performance: 'Outstanding'
  },
  {
    id: 'EMP-003',
    name: 'James Loo',
    role: 'Cashier',
    restaurantId: 'R-101',
    restaurantName: 'FoodMatrix Downtown',
    status: 'Active',
    shift: 'Morning',
    email: 'j.loo@foodmatrix.com',
    phone: '(415) 555-9283',
    salary: 42000,
    performance: 'Satisfactory'
  },
  {
    id: 'EMP-004',
    name: 'David Miller',
    role: 'Store Manager',
    restaurantId: 'R-102',
    restaurantName: 'FoodMatrix Midtown',
    status: 'Active',
    shift: 'Evening',
    email: 'd.miller@foodmatrix.com',
    phone: '(212) 555-7382',
    salary: 79000,
    performance: 'Satisfactory'
  },
  {
    id: 'EMP-005',
    name: 'Aisha Rahman',
    role: 'Server',
    restaurantId: 'R-102',
    restaurantName: 'FoodMatrix Midtown',
    status: 'Active',
    shift: 'Evening',
    email: 'a.rahman@foodmatrix.com',
    phone: '(212) 555-7385',
    salary: 38000,
    performance: 'Outstanding'
  },
  {
    id: 'EMP-006',
    name: 'Robert Chen',
    role: 'Store Manager',
    restaurantId: 'R-103',
    restaurantName: 'FoodMatrix North Loop',
    status: 'Active',
    shift: 'Morning',
    email: 'r.chen@foodmatrix.com',
    phone: '(312) 555-4421',
    salary: 77000,
    performance: 'Satisfactory'
  },
  {
    id: 'EMP-007',
    name: 'Hans Gruber',
    role: 'Line Cook',
    restaurantId: 'R-103',
    restaurantName: 'FoodMatrix North Loop',
    status: 'On Leave',
    shift: 'Night',
    email: 'h.gruber@foodmatrix.com',
    phone: '(312) 555-4424',
    salary: 46000,
    performance: 'Needs Improvement'
  },
  {
    id: 'EMP-008',
    name: 'Chloe Fontaine',
    role: 'Store Manager',
    restaurantId: 'R-104',
    restaurantName: 'FoodMatrix Beverly Hills',
    status: 'Active',
    shift: 'Morning',
    email: 'c.fontaine@foodmatrix.com',
    phone: '(310) 555-1029',
    salary: 95000,
    performance: 'Outstanding'
  },
  {
    id: 'EMP-009',
    name: 'Zack Wheeler',
    role: 'Sous Chef',
    restaurantId: 'R-104',
    restaurantName: 'FoodMatrix Beverly Hills',
    status: 'Active',
    shift: 'Evening',
    email: 'z.wheeler@foodmatrix.com',
    phone: '(310) 555-1031',
    salary: 58000,
    performance: 'Outstanding'
  },
  {
    id: 'EMP-010',
    name: 'Alejandro Gomez',
    role: 'Store Manager',
    restaurantId: 'R-105',
    restaurantName: 'FoodMatrix South Beach',
    status: 'Active',
    shift: 'Morning',
    email: 'a.gomez@foodmatrix.com',
    phone: '(305) 555-4091',
    salary: 80000,
    performance: 'Satisfactory'
  }
];

export const initialMenuItems: MenuItem[] = [
  {
    id: 'MN-001',
    name: 'Signature Matrix Truffle Burger',
    category: 'Mains',
    price: 18.50,
    cost: 5.20,
    status: 'Available',
    description: 'Aged prime beef, black truffle aioli, wild mushrooms, gruyère, brioche bun.',
    popularity: 'High',
    sales30d: 1420,
    prepTime: 12
  },
  {
    id: 'MN-002',
    name: 'Crispy Avocado Handrolls',
    category: 'Starters',
    price: 12.00,
    cost: 3.10,
    status: 'Available',
    description: 'Panko crust avocado, sesame soy glaze, spicy micro-greens.',
    popularity: 'High',
    sales30d: 980,
    prepTime: 8
  },
  {
    id: 'MN-003',
    name: 'Seared Wild Salmon Bowl',
    category: 'Mains',
    price: 22.00,
    cost: 7.50,
    status: 'Available',
    description: 'Atlantic salmon, quinoa, organic kale, roasted sweet potato, sesame dressing.',
    popularity: 'High',
    sales30d: 1150,
    prepTime: 15
  },
  {
    id: 'MN-004',
    name: 'Emerald Asparagus Salad',
    category: 'Starters',
    price: 11.50,
    cost: 2.80,
    status: 'Available',
    description: 'Shaved raw and charred asparagus, fresh mint, goat cheese, lemon vinaigrette.',
    popularity: 'Medium',
    sales30d: 460,
    prepTime: 6
  },
  {
    id: 'MN-005',
    name: 'Matrix Matcha Lava Cake',
    category: 'Desserts',
    price: 9.50,
    cost: 2.10,
    status: 'Available',
    description: 'Warm matcha white chocolate core, vanilla bean gelato, fresh raspberries.',
    popularity: 'High',
    sales30d: 850,
    prepTime: 10
  },
  {
    id: 'MN-006',
    name: 'Botanical Cucumber Cooler',
    category: 'Beverages',
    price: 6.50,
    cost: 0.90,
    status: 'Available',
    description: 'Muddled organic cucumber, elderflower tonic, lime, carbonated spring water.',
    popularity: 'High',
    sales30d: 1890,
    prepTime: 3
  },
  {
    id: 'MN-007',
    name: 'Parmesan Truffle Fries',
    category: 'Sides',
    price: 8.00,
    cost: 1.50,
    status: 'Available',
    description: 'Hand-cut russet potatoes, truffle oil, grated parmesan, fresh rosemary.',
    popularity: 'High',
    sales30d: 2240,
    prepTime: 5
  },
  {
    id: 'MN-008',
    name: 'Spiced Pumpkin Gelato',
    category: 'Desserts',
    price: 7.00,
    cost: 1.80,
    status: 'Seasonal',
    description: 'Artisanal micro-batch spiced pumpkin pie flavor with cinnamon crumble.',
    popularity: 'Medium',
    sales30d: 310,
    prepTime: 2
  },
  {
    id: 'MN-009',
    name: 'Wagyu Skewers (A5)',
    category: 'Starters',
    price: 34.00,
    cost: 14.00,
    status: 'Sold Out',
    description: 'Flame-broiled Japanese A5 Wagyu with sweet mirin and garlic soy glaze.',
    popularity: 'Medium',
    sales30d: 180,
    prepTime: 9
  },
  {
    id: 'MN-010',
    name: 'Hyper-Caffeine Cold Brew',
    category: 'Beverages',
    price: 5.50,
    cost: 0.60,
    status: 'Available',
    description: '24-hour slow drip nitrogen cold brew coffee, chocolate undertones.',
    popularity: 'Medium',
    sales30d: 640,
    prepTime: 2
  }
];

export const initialSuppliers: Supplier[] = [
  {
    id: 'SUP-001',
    name: 'Emerald Valley Farms',
    contactName: 'Diana Green',
    phone: '(800) 555-0101',
    email: 'diana@emeraldvalley.com',
    category: 'Produce',
    activeOrders: 2,
    rating: 4.9,
    status: 'Active'
  },
  {
    id: 'SUP-002',
    name: 'Apex Meat Distributors',
    contactName: 'Marcus Sterling',
    phone: '(800) 555-0102',
    email: 'orders@apexmeat.com',
    category: 'Meat & Poultry',
    activeOrders: 1,
    rating: 4.7,
    status: 'Active'
  },
  {
    id: 'SUP-003',
    name: 'Coastal Dairy Co-op',
    contactName: 'Elena Carter',
    phone: '(800) 555-0103',
    email: 'elena@coastaldairy.com',
    category: 'Dairy',
    activeOrders: 3,
    rating: 4.5,
    status: 'Active'
  },
  {
    id: 'SUP-004',
    name: 'Matrix Dry Wholesalers',
    contactName: 'Simon Wright',
    phone: '(800) 555-0104',
    email: 'simon@matrixwholesale.com',
    category: 'Dry Goods',
    activeOrders: 0,
    rating: 4.1,
    status: 'Under Review'
  },
  {
    id: 'SUP-005',
    name: 'BioPack Sustainable Solutions',
    contactName: 'Nisha Patel',
    phone: '(800) 555-0105',
    email: 'nisha@biopack.com',
    category: 'Packaging',
    activeOrders: 1,
    rating: 4.8,
    status: 'Active'
  }
];

export const initialInventory: InventoryItem[] = [
  {
    id: 'INV-001',
    name: 'Prime Beef Patties (8oz)',
    quantity: 450,
    unit: 'pcs',
    minThreshold: 100,
    category: 'Meat & Poultry',
    supplierId: 'SUP-002',
    supplierName: 'Apex Meat Distributors',
    lastRestocked: '2026-07-14',
    status: 'In Stock',
    unitCost: 2.20
  },
  {
    id: 'INV-002',
    name: 'Aged Truffle Cheese Grate',
    quantity: 12,
    unit: 'kg',
    minThreshold: 15,
    category: 'Dairy',
    supplierId: 'SUP-003',
    supplierName: 'Coastal Dairy Co-op',
    lastRestocked: '2026-07-10',
    status: 'Low Stock',
    unitCost: 18.50
  },
  {
    id: 'INV-003',
    name: 'Organic Haas Avocados',
    quantity: 180,
    unit: 'pcs',
    minThreshold: 50,
    category: 'Produce',
    supplierId: 'SUP-001',
    supplierName: 'Emerald Valley Farms',
    lastRestocked: '2026-07-16',
    status: 'In Stock',
    unitCost: 1.10
  },
  {
    id: 'INV-004',
    name: 'Artisanal Brioche Buns',
    quantity: 20,
    unit: 'pcs',
    minThreshold: 80,
    category: 'Dry Goods',
    supplierId: 'SUP-04',
    supplierName: 'Matrix Dry Wholesalers',
    lastRestocked: '2026-07-15',
    status: 'Low Stock',
    unitCost: 0.45
  },
  {
    id: 'INV-005',
    name: 'Organic Ceremony Matcha',
    quantity: 4.5,
    unit: 'kg',
    minThreshold: 1.0,
    category: 'Dry Goods',
    supplierId: 'SUP-001',
    supplierName: 'Emerald Valley Farms',
    lastRestocked: '2026-07-02',
    status: 'In Stock',
    unitCost: 45.00
  },
  {
    id: 'INV-006',
    name: 'Eco-Craft Burger Boxes',
    quantity: 2500,
    unit: 'pcs',
    minThreshold: 500,
    category: 'Packaging',
    supplierId: 'SUP-005',
    supplierName: 'BioPack Sustainable Solutions',
    lastRestocked: '2026-07-12',
    status: 'In Stock',
    unitCost: 0.12
  },
  {
    id: 'INV-007',
    name: 'Fresh English Asparagus',
    quantity: 0,
    unit: 'lbs',
    minThreshold: 20,
    category: 'Produce',
    supplierId: 'SUP-001',
    supplierName: 'Emerald Valley Farms',
    lastRestocked: '2026-07-08',
    status: 'Out of Stock',
    unitCost: 3.50
  },
  {
    id: 'INV-008',
    name: 'Heavy Whipping Cream 36%',
    quantity: 45,
    unit: 'Liters',
    minThreshold: 15,
    category: 'Dairy',
    supplierId: 'SUP-003',
    supplierName: 'Coastal Dairy Co-op',
    lastRestocked: '2026-07-15',
    status: 'In Stock',
    unitCost: 4.20
  }
];

export const initialOrders: Order[] = [
  {
    id: 'ORD-8001',
    restaurantId: 'R-101',
    restaurantName: 'FoodMatrix Downtown',
    items: [
      { menuItemId: 'MN-001', name: 'Signature Matrix Truffle Burger', quantity: 2, price: 18.50 },
      { menuItemId: 'MN-007', name: 'Parmesan Truffle Fries', quantity: 1, price: 8.00 },
      { menuItemId: 'MN-006', name: 'Botanical Cucumber Cooler', quantity: 2, price: 6.50 }
    ],
    total: 58.00,
    status: 'Preparing',
    timestamp: '14:28',
    type: 'Dine-In',
    cashierName: 'James Loo',
    customerName: 'Marcus Vance',
    tableNumber: 'Table 4'
  },
  {
    id: 'ORD-8002',
    restaurantId: 'R-101',
    restaurantName: 'FoodMatrix Downtown',
    items: [
      { menuItemId: 'MN-003', name: 'Seared Wild Salmon Bowl', quantity: 1, price: 22.00 },
      { menuItemId: 'MN-002', name: 'Crispy Avocado Handrolls', quantity: 1, price: 12.00 }
    ],
    total: 34.00,
    status: 'Pending',
    timestamp: '14:32',
    type: 'Takeout',
    cashierName: 'James Loo'
  },
  {
    id: 'ORD-8003',
    restaurantId: 'R-102',
    restaurantName: 'FoodMatrix Midtown',
    items: [
      { menuItemId: 'MN-001', name: 'Signature Matrix Truffle Burger', quantity: 4, price: 18.50 },
      { menuItemId: 'MN-007', name: 'Parmesan Truffle Fries', quantity: 4, price: 8.00 },
      { menuItemId: 'MN-005', name: 'Matrix Matcha Lava Cake', quantity: 2, price: 9.50 }
    ],
    total: 125.00,
    status: 'Ready',
    timestamp: '14:15',
    type: 'Dine-In',
    cashierName: 'Aisha Rahman',
    customerName: 'Diana Sterling',
    tableNumber: 'Table 15'
  },
  {
    id: 'ORD-8004',
    restaurantId: 'R-103',
    restaurantName: 'FoodMatrix North Loop',
    items: [
      { menuItemId: 'MN-004', name: 'Emerald Asparagus Salad', quantity: 1, price: 11.50 },
      { menuItemId: 'MN-010', name: 'Hyper-Caffeine Cold Brew', quantity: 1, price: 5.50 }
    ],
    total: 17.00,
    status: 'Completed',
    timestamp: '13:55',
    type: 'Drive-Thru',
    cashierName: 'Robert Chen'
  },
  {
    id: 'ORD-8005',
    restaurantId: 'R-104',
    restaurantName: 'FoodMatrix Beverly Hills',
    items: [
      { menuItemId: 'MN-001', name: 'Signature Matrix Truffle Burger', quantity: 1, price: 18.50 },
      { menuItemId: 'MN-005', name: 'Matrix Matcha Lava Cake', quantity: 1, price: 9.50 }
    ],
    total: 28.00,
    status: 'Preparing',
    timestamp: '14:25',
    type: 'Takeout',
    cashierName: 'Zack Wheeler'
  },
  {
    id: 'ORD-8006',
    restaurantId: 'R-101',
    restaurantName: 'FoodMatrix Downtown',
    items: [
      { menuItemId: 'MN-002', name: 'Crispy Avocado Handrolls', quantity: 2, price: 12.00 }
    ],
    total: 24.00,
    status: 'Completed',
    timestamp: '13:20',
    type: 'Dine-In',
    cashierName: 'James Loo',
    customerName: 'David Lee',
    tableNumber: 'Table 2'
  }
];

export const initialNotifications: Notification[] = [
  {
    id: 'NOT-001',
    type: 'alert',
    title: 'Critical Stock Level',
    message: 'FoodMatrix Downtown is out of Fresh English Asparagus.',
    time: '5m ago',
    read: false,
    priority: 'high'
  },
  {
    id: 'NOT-002',
    type: 'warning',
    title: 'Supplier Delayed',
    message: 'Apex Meat Distributors reported a 2-hour delay on Chicago route.',
    time: '18m ago',
    read: false,
    priority: 'medium'
  },
  {
    id: 'NOT-003',
    type: 'success',
    title: 'Audit Approved',
    message: 'Midtown restaurant successfully passed regional safety inspection with score 98/100.',
    time: '1h ago',
    read: false,
    priority: 'low'
  },
  {
    id: 'NOT-004',
    type: 'info',
    title: 'Menu Sync Completed',
    message: 'Autumn beverage additions pushed successfully to all North American POS nodes.',
    time: '3h ago',
    read: true,
    priority: 'low'
  },
  {
    id: 'NOT-005',
    type: 'alert',
    title: 'Revenue Spike',
    message: 'Beverly Hills franchise exceeded daily peak threshold. 158% increase in drive-thru velocity.',
    time: '4h ago',
    read: true,
    priority: 'medium'
  }
];

export const corporateMetrics = {
  activeStores: { value: '184', change: '+12%', trend: 'up' },
  totalRevenueMonthly: { value: '$2.84M', change: '+18.4%', trend: 'up' },
  avgTicketSize: { value: '$42.50', change: '+3.1%', trend: 'up' },
  wasteReduction: { value: '14.2%', change: '-5.8%', trend: 'up' }, // down in waste is good
  laborEfficiency: { value: '92.1%', change: '+1.5%', trend: 'up' },
  outOfStockRate: { value: '1.2%', change: '-0.4%', trend: 'up' } // down is good
};

import { Shift, AttendanceLog, InventoryRequest, FranchiseInventory } from './types';

export const initialShifts: Shift[] = [
  {
    id: 'SHF-001',
    employeeId: 'EMP-001',
    employeeName: 'Elena Rostova',
    role: 'Store Manager',
    restaurantId: 'R-101',
    restaurantName: 'FoodMatrix Downtown',
    date: '2026-07-17',
    startTime: '08:00',
    endTime: '16:00',
    status: 'In Progress'
  },
  {
    id: 'SHF-002',
    employeeId: 'EMP-002',
    employeeName: 'Marcus Brodie',
    role: 'Head Chef',
    restaurantId: 'R-101',
    restaurantName: 'FoodMatrix Downtown',
    date: '2026-07-17',
    startTime: '10:00',
    endTime: '18:00',
    status: 'In Progress'
  },
  {
    id: 'SHF-003',
    employeeId: 'EMP-003',
    employeeName: 'Sanjay Gupta',
    role: 'Sous Chef',
    restaurantId: 'R-101',
    restaurantName: 'FoodMatrix Downtown',
    date: '2026-07-17',
    startTime: '14:00',
    endTime: '22:00',
    status: 'Scheduled'
  },
  {
    id: 'SHF-004',
    employeeId: 'EMP-004',
    employeeName: 'Chloe Vance',
    role: 'Line Cook',
    restaurantId: 'R-101',
    restaurantName: 'FoodMatrix Downtown',
    date: '2026-07-17',
    startTime: '16:00',
    endTime: '24:00',
    status: 'Scheduled'
  },
  {
    id: 'SHF-005',
    employeeId: 'EMP-005',
    employeeName: 'Aiden Gallagher',
    role: 'Cashier',
    restaurantId: 'R-101',
    restaurantName: 'FoodMatrix Downtown',
    date: '2026-07-17',
    startTime: '07:30',
    endTime: '15:30',
    status: 'Completed'
  },
  {
    id: 'SHF-006',
    employeeId: 'EMP-006',
    employeeName: 'Yuki Tanaka',
    role: 'Server',
    restaurantId: 'R-101',
    restaurantName: 'FoodMatrix Downtown',
    date: '2026-07-17',
    startTime: '11:00',
    endTime: '19:00',
    status: 'In Progress'
  }
];

export const initialAttendance: AttendanceLog[] = [
  {
    id: 'ATT-001',
    employeeId: 'EMP-001',
    employeeName: 'Elena Rostova',
    restaurantId: 'R-101',
    restaurantName: 'FoodMatrix Downtown',
    checkIn: '2026-07-17T07:55:00Z',
    status: 'On Time'
  },
  {
    id: 'ATT-002',
    employeeId: 'EMP-002',
    employeeName: 'Marcus Brodie',
    restaurantId: 'R-101',
    restaurantName: 'FoodMatrix Downtown',
    checkIn: '2026-07-17T10:05:00Z',
    status: 'Late'
  },
  {
    id: 'ATT-003',
    employeeId: 'EMP-005',
    employeeName: 'Aiden Gallagher',
    restaurantId: 'R-101',
    restaurantName: 'FoodMatrix Downtown',
    checkIn: '2026-07-17T07:28:00Z',
    checkOut: '2026-07-17T15:32:00Z',
    status: 'On Time'
  },
  {
    id: 'ATT-004',
    employeeId: 'EMP-006',
    employeeName: 'Yuki Tanaka',
    restaurantId: 'R-101',
    restaurantName: 'FoodMatrix Downtown',
    checkIn: '2026-07-17T10:58:00Z',
    status: 'On Time'
  }
];

export const initialInventoryRequests: InventoryRequest[] = [
  {
    id: 'REQ-001',
    requesterRestaurantId: 'R-101',
    requesterRestaurantName: 'FoodMatrix Downtown',
    itemSelector: 'Prime Beef Patties',
    quantity: 150,
    unit: 'lbs',
    urgency: 'Urgent',
    status: 'Pending',
    requestedAt: '2026-07-17'
  },
  {
    id: 'REQ-002',
    requesterRestaurantId: 'R-103',
    requesterRestaurantName: 'FoodMatrix North Loop',
    itemSelector: 'Fresh Brioche Buns',
    quantity: 300,
    unit: 'pcs',
    urgency: 'Critical',
    status: 'Pending',
    requestedAt: '2026-07-17'
  },
  {
    id: 'REQ-003',
    requesterRestaurantId: 'R-102',
    requesterRestaurantName: 'FoodMatrix Midtown',
    itemSelector: 'Cheddar Cheese Slices',
    quantity: 80,
    unit: 'lbs',
    urgency: 'Standard',
    status: 'Approved',
    requestedAt: '2026-07-16'
  },
  {
    id: 'REQ-004',
    requesterRestaurantId: 'R-104',
    requesterRestaurantName: 'FoodMatrix Beverly Hills',
    itemSelector: 'Avocados',
    quantity: 120,
    unit: 'pcs',
    urgency: 'Standard',
    status: 'Fulfilled',
    requestedAt: '2026-07-15',
    fulfilledAt: '2026-07-16'
  }
];

// Initial individual franchise stocks derived for R-101, R-102, R-103, R-104
export const initialFranchiseInventory: FranchiseInventory[] = [
  {
    restaurantId: 'R-101',
    restaurantName: 'FoodMatrix Downtown',
    items: [
      { inventoryItemId: 'INV-001', name: 'Prime Beef Patties', quantity: 24, unit: 'lbs', status: 'Low Stock', minThreshold: 60 },
      { inventoryItemId: 'INV-002', name: 'Fresh Brioche Buns', quantity: 240, unit: 'pcs', status: 'In Stock', minThreshold: 100 },
      { inventoryItemId: 'INV-003', name: 'Cheddar Cheese Slices', quantity: 15, unit: 'lbs', status: 'Low Stock', minThreshold: 20 },
      { inventoryItemId: 'INV-004', name: 'Organic Romaine Lettuce', quantity: 45, unit: 'lbs', status: 'In Stock', minThreshold: 25 },
      { inventoryItemId: 'INV-005', name: 'Whole Milk', quantity: 12, unit: 'gallons', status: 'In Stock', minThreshold: 8 }
    ]
  },
  {
    restaurantId: 'R-102',
    restaurantName: 'FoodMatrix Midtown',
    items: [
      { inventoryItemId: 'INV-001', name: 'Prime Beef Patties', quantity: 180, unit: 'lbs', status: 'In Stock', minThreshold: 60 },
      { inventoryItemId: 'INV-002', name: 'Fresh Brioche Buns', quantity: 90, unit: 'pcs', status: 'Low Stock', minThreshold: 100 },
      { inventoryItemId: 'INV-003', name: 'Cheddar Cheese Slices', quantity: 35, unit: 'lbs', status: 'In Stock', minThreshold: 20 },
      { inventoryItemId: 'INV-004', name: 'Organic Romaine Lettuce', quantity: 15, unit: 'lbs', status: 'Low Stock', minThreshold: 25 },
      { inventoryItemId: 'INV-005', name: 'Whole Milk', quantity: 18, unit: 'gallons', status: 'In Stock', minThreshold: 8 }
    ]
  },
  {
    restaurantId: 'R-103',
    restaurantName: 'FoodMatrix North Loop',
    items: [
      { inventoryItemId: 'INV-001', name: 'Prime Beef Patties', quantity: 50, unit: 'lbs', status: 'Low Stock', minThreshold: 60 },
      { inventoryItemId: 'INV-002', name: 'Fresh Brioche Buns', quantity: 15, unit: 'pcs', status: 'Out of Stock', minThreshold: 100 },
      { inventoryItemId: 'INV-003', name: 'Cheddar Cheese Slices', quantity: 12, unit: 'lbs', status: 'Low Stock', minThreshold: 20 },
      { inventoryItemId: 'INV-004', name: 'Organic Romaine Lettuce', quantity: 55, unit: 'lbs', status: 'In Stock', minThreshold: 25 },
      { inventoryItemId: 'INV-005', name: 'Whole Milk', quantity: 2, unit: 'gallons', status: 'Low Stock', minThreshold: 8 }
    ]
  },
  {
    restaurantId: 'R-104',
    restaurantName: 'FoodMatrix Beverly Hills',
    items: [
      { inventoryItemId: 'INV-001', name: 'Prime Beef Patties', quantity: 220, unit: 'lbs', status: 'In Stock', minThreshold: 60 },
      { inventoryItemId: 'INV-002', name: 'Fresh Brioche Buns', quantity: 410, unit: 'pcs', status: 'In Stock', minThreshold: 100 },
      { inventoryItemId: 'INV-003', name: 'Cheddar Cheese Slices', quantity: 85, unit: 'lbs', status: 'In Stock', minThreshold: 20 },
      { inventoryItemId: 'INV-004', name: 'Organic Romaine Lettuce', quantity: 62, unit: 'lbs', status: 'In Stock', minThreshold: 25 },
      { inventoryItemId: 'INV-005', name: 'Whole Milk', quantity: 30, unit: 'gallons', status: 'In Stock', minThreshold: 8 }
    ]
  }
];


import {
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";

export interface KPIStat {
  id: number;
  title: string;
  value: string;
  subtitle: string;
  accent: "emerald" | "default";
  trend: "up" | "down" | "neutral";
  icon?: typeof ArrowUpRight;
}

export interface RevenueRegion {
  id: number;
  name: string;
  value: number;
  amount: string;
  color: string;
  strokeDashArray: string;
  strokeDashOffset: string;
}

export interface CategorySale {
  id: number;
  name: string;
  amount: string;
  percentage: number;
  color: string;
}

export interface PerformanceLog {
  date: string;
  receipts: number;
  avgTicket: number;
  waste: string;
  rating: number;
  score: string;
}

export const kpiStats: KPIStat[] = [
  {
    id: 1,
    title: "Gross Sourcing Revenue",
    value: "$2.84M",
    subtitle: "+18.4% vs benchmark",
    accent: "default",
    trend: "up",
    icon: ArrowUpRight,
  },
  {
    id: 2,
    title: "Labor Cost Ratio",
    value: "28.4%",
    subtitle: "-1.2% optimal target",
    accent: "default",
    trend: "down",
    icon: ArrowDownRight,
  },
  {
    id: 3,
    title: "Food Waste Factor",
    value: "1.2%",
    subtitle: "Corporate limit: 2.5% max",
    accent: "emerald",
    trend: "neutral",
  },
  {
    id: 4,
    title: "Operational Score",
    value: "94.8%",
    subtitle: "+0.8% efficiency gain",
    accent: "default",
    trend: "up",
    icon: ArrowUpRight,
  },
];

export const revenueDistribution: RevenueRegion[] = [
  {
    id: 1,
    name: "East Franchise Region",
    value: 40,
    amount: "$1.12M",
    color: "#10b981",
    strokeDashArray: "95.5 238.7",
    strokeDashOffset: "0",
  },
  {
    id: 2,
    name: "West Franchise Region",
    value: 30,
    amount: "$840K",
    color: "#3b82f6",
    strokeDashArray: "71.6 238.7",
    strokeDashOffset: "-95.5",
  },
  {
    id: 3,
    name: "Midwest Region",
    value: 20,
    amount: "$560K",
    color: "#a855f7",
    strokeDashArray: "47.7 238.7",
    strokeDashOffset: "-167.1",
  },
  {
    id: 4,
    name: "South Region",
    value: 10,
    amount: "$280K",
    color: "#fbbf24",
    strokeDashArray: "23.9 238.7",
    strokeDashOffset: "-214.8",
  },
];

export const categorySales: CategorySale[] = [
  {
    id: 1,
    name: "Gourmet Mains",
    amount: "$1.24M",
    percentage: 45,
    color: "#10b981",
  },
  {
    id: 2,
    name: "Gourmet Starters",
    amount: "$690K",
    percentage: 25,
    color: "#3b82f6",
  },
  {
    id: 3,
    name: "Dessert Assets",
    amount: "$410K",
    percentage: 15,
    color: "#a855f7",
  },
  {
    id: 4,
    name: "Beverages Core",
    amount: "$275K",
    percentage: 10,
    color: "#fbbf24",
  },
];

export const performanceLogs: PerformanceLog[] = [
  {
    date: "2026-07-16",
    receipts: 142000,
    avgTicket: 43.1,
    waste: "1.4%",
    rating: 4.8,
    score: "94%",
  },
  {
    date: "2026-07-15",
    receipts: 138500,
    avgTicket: 42.8,
    waste: "1.5%",
    rating: 4.7,
    score: "93%",
  },
  {
    date: "2026-07-14",
    receipts: 151200,
    avgTicket: 44.2,
    waste: "1.2%",
    rating: 4.9,
    score: "96%",
  },
  {
    date: "2026-07-13",
    receipts: 121000,
    avgTicket: 41.5,
    waste: "1.8%",
    rating: 4.5,
    score: "91%",
  },
  {
    date: "2026-07-12",
    receipts: 118000,
    avgTicket: 40.9,
    waste: "1.9%",
    rating: 4.4,
    score: "90%",
  },
  {
    date: "2026-07-11",
    receipts: 162000,
    avgTicket: 45.5,
    waste: "1.1%",
    rating: 4.8,
    score: "98%",
  },
];
