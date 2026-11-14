// ============================================================
// FOODMATRIX — ORGANIZATION SERVICE TYPES
// ============================================================

export interface OrganizationSidebarUser {
  id: string;
  name: string;
  email: string;
  role: SystemUserRole;
}

// ------------------------------------------------------------
// ROLES
// ------------------------------------------------------------

export type SystemUserRole =
  | "SUPER_ADMIN"
  | "FRANCHISE_ADMIN"
  | "RESTAURANT_ADMIN"
  | "STAFF"
  | "OPERATIONS";

// ------------------------------------------------------------
// RESTAURANT STATUS
// ------------------------------------------------------------

export type RestaurantStatus = "ACTIVE" | "INACTIVE";

// ------------------------------------------------------------
// BETTER AUTH USER
// ------------------------------------------------------------

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------
// SYSTEM USER
// ------------------------------------------------------------

export interface SystemUser {
  id: string;
  authUserId: string;

  firstName: string;
  lastName: string;

  email: string;

  role: SystemUserRole;

  franchiseId: string | null;
  managedRestaurantId: string | null;

  isActive: boolean;
  lastLoginAt: string | null;

  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------
// CURRENT USER
// ------------------------------------------------------------

export interface CurrentUserData {
  user: AuthUser;
  systemUser: SystemUser;
}

// ------------------------------------------------------------
// FRANCHISE
// ------------------------------------------------------------

export interface Franchise {
  id: string;
  name: string;
  taxId: string | null;
  defaultCurrency: string;

  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------
// RESTAURANT
// ------------------------------------------------------------

export interface Restaurant {
  id: string;

  name: string;

  address: string;
  city: string;
  state: string | null;
  country: string;

  timezone: string;

  status: RestaurantStatus;

  franchiseId: string;
  defaultCurrency?: string;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------
// GENERIC API RESPONSE
// ------------------------------------------------------------

export interface ApiResponse<T> {
  message: string;
  data: T;
}

// ------------------------------------------------------------
// API RESPONSE TYPES
// ------------------------------------------------------------

export type CurrentUserResponse = ApiResponse<CurrentUserData>;

export type FranchiseResponse = ApiResponse<Franchise>;

export type RestaurantsResponse = ApiResponse<Restaurant[]>;

export type RestaurantResponse = ApiResponse<Restaurant>;

export type SystemUserResponse = ApiResponse<SystemUser>;

// ------------------------------------------------------------
// CREATE RESTAURANT
// ------------------------------------------------------------

export interface CreateRestaurantData {
  name: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  timezone?: string;
  status?: RestaurantStatus;
  franchiseId: string;
}

// ------------------------------------------------------------
// UPDATE RESTAURANT
// ------------------------------------------------------------

export interface UpdateRestaurantData {
  name?: string;
  address?: string;
  city?: string;
  state?: string | null;
  country?: string;
  timezone?: string;
  status?: RestaurantStatus;
}

// ------------------------------------------------------------
// UPDATE FRANCHISE
// ------------------------------------------------------------

export interface UpdateFranchiseData {
  name?: string;
  taxId?: string;
  defaultCurrency?: string;
}

// ------------------------------------------------------------
// API ERROR
// ------------------------------------------------------------

export interface OrganizationApiError {
  message: string;
  statusCode?: number;
  error?: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  basePrice: number;
  isAvailable: boolean;

  category: MenuCategory;
}

export interface RestaurantMenuItem {
  restaurantMenuItemId: string;
  restaurantId: string;
  price: number;
  priceDifference: number;
  isAvailable: boolean;
  updatedAt: string;
}

export interface MenuItemRestaurantPricing {
  menuItem: {
    id: string;
    name: string;
    sku: string;
    description: string | null;
    basePrice: number;
    isAvailable: boolean;
    category: {
      id: string;
      name: string;
      sortOrder: number;
    };
  };

  restaurants: RestaurantMenuItem[];
}

export interface Restaurant {
  id: string;
  name: string;
  // Keep/add other fields returned by Organization Service
}
