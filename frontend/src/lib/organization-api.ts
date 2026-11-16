import axios from "axios";

import type {
  FranchiseResponse,
  Franchise,
  RestaurantsResponse,
  RestaurantResponse,
  SystemUserResponse,
  SystemUser,
  CreateRestaurantData,
  UpdateRestaurantData,
  UpdateFranchiseData,
  UpdateSystemUserAssignmentData,
} from "@/utils/types/organization";

// ============================================================
// AXIOS INSTANCE
// ============================================================

const organizationApi = axios.create({
  baseURL: "/api/organization",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

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
export async function getManageableSystemUsers(search: string) {
  const response = await organizationApi.get<{ data: SystemUser[] }>("/system-users", { params: { search } });
  return response.data.data;
}

export async function setSystemUserActive(id: string, isActive: boolean) {
  const response = await organizationApi.patch<SystemUserResponse>(`/system-users/${id}/status`, { isActive });
  return response.data.data;
}

export async function updateSystemUserAssignment(
  id: string,
  assignment: UpdateSystemUserAssignmentData,
) {
  const response = await organizationApi.patch<SystemUserResponse>(
    `/system-users/${id}/assignment`,
    assignment,
  );
  return response.data.data;
}

export async function changeOrganizationPassword(
  currentPassword: string,
  newPassword: string,
) {
  const response = await organizationApi.post<{ message: string }>(
    "/auth/change-password",
    { currentPassword, newPassword },
  );
  return response.data;
}
