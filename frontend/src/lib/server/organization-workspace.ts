import type {
  ApiResponse,
  CurrentUserData,
  Franchise,
  OrganizationWorkspace,
  Restaurant,
  SystemUserRole,
} from "@/utils/types/organization";

export const gatewayUrl =
  process.env.FOODMATRIX_API_URL ?? "http://localhost:8000";

export const frontendOrigin =
  process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";

export class WorkspaceError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function dashboardForRole(role: SystemUserRole) {
  switch (role) {
    case "SUPER_ADMIN":
    case "FRANCHISE_ADMIN":
    case "OPERATIONS":
      return "/operations";
    case "RESTAURANT_ADMIN":
    case "STAFF":
      return "/restaurant";
    default:
      return null;
  }
}

async function loadResource<T>(
  path: string,
  cookie: string,
  origin: string,
  unavailable: string,
): Promise<T> {
  const response = await fetch(`${gatewayUrl}/api/organization${path}`, {
    headers: { Cookie: cookie, Origin: origin, Accept: "application/json" },
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(8_000),
  }).catch(() => {
    throw new WorkspaceError(503, unavailable);
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new WorkspaceError(
        401,
        "Your session expired. Please sign in again.",
      );
    }
    if (response.status === 403) {
      throw new WorkspaceError(
        403,
        "Your account does not have access to this workspace.",
      );
    }
    if (response.status === 404) throw new WorkspaceError(404, unavailable);
    throw new WorkspaceError(503, unavailable);
  }

  const body = (await response
    .json()
    .catch(() => null)) as ApiResponse<T> | null;
  if (!body || body.data == null) throw new WorkspaceError(503, unavailable);
  return body.data;
}

export async function loadWorkspace(
  cookie: string,
  origin: string,
): Promise<OrganizationWorkspace> {
  if (!cookie)
    throw new WorkspaceError(401, "Please sign in to load your workspace.");
  const currentUser = await loadResource<CurrentUserData>(
    "/auth/me",
    cookie,
    origin,
    "We couldn’t load your account. Please try again.",
  );
  const { role, franchiseId, managedRestaurantId, isActive } =
    currentUser.systemUser;
  const dashboard = dashboardForRole(role);
  if (!isActive || !dashboard) {
    throw new WorkspaceError(
      403,
      "Your account does not have access to a FoodMatrix workspace.",
    );
  }

  if (dashboard === "/restaurant") {
    if (!managedRestaurantId) {
      throw new WorkspaceError(
        403,
        "Your account is not assigned to a restaurant.",
      );
    }
    const restaurant = await loadResource<Restaurant>(
      `/restaurants/${encodeURIComponent(managedRestaurantId)}`,
      cookie,
      origin,
      "We couldn’t load your assigned restaurant. Please try again.",
    );
    return {
      currentUser,
      franchise: null,
      restaurants: [restaurant],
      selectedRestaurant: restaurant,
    };
  }

  if (role !== "SUPER_ADMIN" && !franchiseId) {
    throw new WorkspaceError(
      403,
      "Your account is not assigned to a franchise.",
    );
  }
  const [franchise, restaurants] = await Promise.all([
    franchiseId
      ? loadResource<Franchise>(
          "/franchise",
          cookie,
          origin,
          "We couldn’t load your franchise. Please try again.",
        )
      : Promise.resolve(null),
    loadResource<Restaurant[]>(
      "/restaurants",
      cookie,
      origin,
      "We couldn’t load your restaurant directory. Please try again.",
    ),
  ]);

  return { currentUser, franchise, restaurants, selectedRestaurant: null };
}
