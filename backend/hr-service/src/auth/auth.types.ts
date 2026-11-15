export interface HrRestaurant {
  id: string;
  name: string;
  timezone: string;
  currency: string;
}

export interface AuthenticatedUser {
  id: string;
  role: string;
  franchiseId: string | null;
  managedRestaurantId: string | null;
  systemUserId?: string;
  restaurants: HrRestaurant[];
}
