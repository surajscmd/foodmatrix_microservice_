import axios from "axios";

import type {
  CurrentUserResponse,
  FranchiseResponse,
  Franchise,
  RestaurantsResponse,
  RestaurantResponse,
  SystemUserResponse,
  SystemUser,
  CreateRestaurantData,
  UpdateRestaurantData,
  UpdateFranchiseData,
} from "@/utils/types/organization";

// ============================================================
// AXIOS INSTANCE
// ============================================================

export const organizationApi = axios.create({
  baseURL: "/api/organization",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================================
// CURRENT USER
// ============================================================

export async function getCurrentUser() {
  const response = await organizationApi.get<CurrentUserResponse>("/auth/me");

  return response.data.data;
}

// ============================================================
// FRANCHISE
// ============================================================

export async function getFranchise(franchiseId?: string) {
  const response = await organizationApi.get<FranchiseResponse>("/franchise", { params: { franchiseId } });

  return response.data.data;
}

export async function getFranchiseOptions() {
  const response = await organizationApi.get<{ data: Pick<Franchise, "id" | "name">[] }>("/franchise/options");
  return response.data.data;
}

export async function updateFranchise(data: UpdateFranchiseData, franchiseId?: string) {
  const response = await organizationApi.patch<FranchiseResponse>(
    "/franchise",
    data,
    { params: { franchiseId } },
  );

  return response.data.data;
}

// ============================================================
// RESTAURANTS
// ============================================================

export async function getRestaurants() {
  const response =
    await organizationApi.get<RestaurantsResponse>("/restaurants");

  return response.data.data;
}

export async function getRestaurant(restaurantId: string) {
  const response = await organizationApi.get<RestaurantResponse>(
    `/restaurants/${restaurantId}`,
  );

  return response.data.data;
}

export async function createRestaurant(data: CreateRestaurantData) {
  const response = await organizationApi.post<RestaurantResponse>(
    "/restaurants",
    data,
  );

  return response.data.data;
}

export async function updateRestaurant(
  restaurantId: string,
  data: UpdateRestaurantData,
) {
  const response = await organizationApi.patch<RestaurantResponse>(
    `/restaurants/${restaurantId}`,
    data,
  );

  return response.data.data;
}

export async function deleteRestaurant(restaurantId: string) {
  const response = await organizationApi.delete<RestaurantResponse>(
    `/restaurants/${restaurantId}`,
  );

  return response.data.data;
}

// ============================================================
// SYSTEM USERS
// ============================================================

export async function getSystemUser(systemUserId: string) {
  const response = await organizationApi.get<SystemUserResponse>(
    `/system-users/${systemUserId}`,
  );

  return response.data.data;
}

export async function getSystemUserByAuthId(authUserId: string) {
  const response = await organizationApi.get<SystemUserResponse>(
    `/system-users/auth/${authUserId}`,
  );

  return response.data.data;
}
export async function getManageableSystemUsers(search: string) {
  const response = await organizationApi.get<{ data: SystemUser[] }>("/system-users", { params: { search } });
  return response.data.data;
}

export async function setSystemUserActive(id: string, isActive: boolean) {
  const response = await organizationApi.patch<SystemUserResponse>(`/system-users/${id}/status`, { isActive });
  return response.data.data;
}
