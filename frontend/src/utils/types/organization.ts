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

type RestaurantStatus = "ACTIVE" | "INACTIVE";

// ------------------------------------------------------------
// BETTER AUTH USER
// ------------------------------------------------------------

interface AuthUser {
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

export interface UpdateSystemUserAssignmentData {
  role: Exclude<SystemUserRole, "SUPER_ADMIN">;
  franchiseId: string;
  managedRestaurantId: string | null;
}

// ------------------------------------------------------------
// CURRENT USER
// ------------------------------------------------------------

export interface CurrentUserData {
  user: AuthUser;
  systemUser: SystemUser;
}

export interface OrganizationWorkspace {
  currentUser: CurrentUserData;
  franchise: Franchise | null;
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
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

export interface Restaurant {
  id: string;
  name: string;
  // Keep/add other fields returned by Organization Service
}
