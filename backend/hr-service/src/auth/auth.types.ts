export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  franchiseId: string | null;
  managedRestaurantId: string | null;
}
