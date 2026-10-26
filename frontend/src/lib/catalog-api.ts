import axios from "axios";

export const catalogApi = axios.create({
  baseURL: "/api/catalog",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================================
// TYPES
// ============================================================

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  sku: string;
  description?: string | null;
  basePrice: number;
  isAvailable: boolean;

  category: MenuCategory;

  
  // Catalog statistics
  configuredRestaurantCount?: number;
  unavailableRestaurantIds?: string[];
  recipeIngredientCount?: number;
  modifierGroupCount?: number;

  createdAt?: string;
  updatedAt?: string;
}
export interface MenuItemListResponse {
  message: string;
  data: MenuItem[];
  pagination: Pagination;
}

export interface MenuItemResponse {
  message: string;
  data: MenuItem;
}

export interface MenuCategoryListResponse {
  message: string;
  data: MenuCategory[];
}

export interface CreateMenuItemPayload {
  categoryId: string;
  name: string;
  sku: string;
  description?: string;
  basePrice: number;
  isAvailable?: boolean;
}

export interface UpdateMenuItemPayload {
  categoryId?: string;
  name?: string;
  sku?: string;
  description?: string;
  basePrice?: number;
  isAvailable?: boolean;
}

// ============================================================
// MENU ITEMS
// ============================================================

export async function getMenuItems(
  page = 1,
  limit = 10,
): Promise<MenuItemListResponse> {
  const response = await catalogApi.get<MenuItemListResponse>("/menu-items", {
    params: {
      page,
      limit,
    },
  });

  return response.data;
}
export async function getMenuItemsByCategory(
  categoryId: string,
): Promise<MenuItemListResponse> {
  const [itemsResponse, categoriesResponse] = await Promise.all([
    catalogApi.get<MenuItemListResponse>(`/menu-items/category/${categoryId}`),
    getMenuCategories(),
  ]);

  const response = itemsResponse.data;
  const categories = categoriesResponse.data;

  const category = categories.find((item) => item.id === categoryId);

  return {
    ...response,
    data: response.data.map((item) => ({
      ...item,
      category:
        item.category ??
        category ??
        ({
          id: categoryId,
          name: "Unknown",
          sortOrder: 0,
          isActive: true,
        } as MenuCategory),
    })),
  };
}
export async function getMenuItemById(
  menuItemId: string,
): Promise<MenuItemResponse> {
  const response = await catalogApi.get<MenuItemResponse>(
    `/menu-items/${menuItemId}`,
  );

  return response.data;
}

export async function createMenuItem(
  data: CreateMenuItemPayload,
): Promise<MenuItemResponse> {
  const response = await catalogApi.post<MenuItemResponse>("/menu-items", data);

  return response.data;
}

export async function updateMenuItem(
  menuItemId: string,
  data: UpdateMenuItemPayload,
): Promise<MenuItemResponse> {
  const response = await catalogApi.patch<MenuItemResponse>(
    `/menu-items/${menuItemId}`,
    data,
  );

  return response.data;
}

export async function deleteMenuItem(
  menuItemId: string,
): Promise<MenuItemResponse> {
  const response = await catalogApi.delete<MenuItemResponse>(
    `/menu-items/${menuItemId}`,
  );

  return response.data;
}

// ============================================================
// CATEGORIES
// ============================================================

export async function getMenuCategories(): Promise<MenuCategoryListResponse> {
  const response =
    await catalogApi.get<MenuCategoryListResponse>("/menu-categories");

  return response.data;
}
// ============================================================
// MENU CATEGORY WRITE OPERATIONS
// ============================================================

export interface MenuCategoryResponse {
  message: string;
  data: MenuCategory;
}

export interface CreateMenuCategoryPayload {
  name: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateMenuCategoryPayload {
  name?: string;
  sortOrder?: number;
  isActive?: boolean;
}

// ============================================================
// GET ONE
// GET /menu-categories/:id
// ============================================================

export async function getMenuCategoryById(
  categoryId: string,
): Promise<MenuCategoryResponse> {
  const response = await catalogApi.get<MenuCategoryResponse>(
    `/menu-categories/${categoryId}`,
  );

  return response.data;
}

// ============================================================
// CREATE
// POST /menu-categories
// ============================================================

export async function createMenuCategory(
  data: CreateMenuCategoryPayload,
): Promise<MenuCategoryResponse> {
  const response = await catalogApi.post<MenuCategoryResponse>(
    "/menu-categories",
    data,
  );

  return response.data;
}

// ============================================================
// UPDATE
// PATCH /menu-categories/:id
// ============================================================

export async function updateMenuCategory(
  categoryId: string,
  data: UpdateMenuCategoryPayload,
): Promise<MenuCategoryResponse> {
  const response = await catalogApi.patch<MenuCategoryResponse>(
    `/menu-categories/${categoryId}`,
    data,
  );

  return response.data;
}

// ============================================================
// DELETE / SOFT DEACTIVATE
// DELETE /menu-categories/:id
// ============================================================

export async function deactivateMenuCategory(categoryId: string) {
  const response = await catalogApi.delete(`/menu-categories/${categoryId}`);
  return response.data;
}
// ============================================================
// RESTAURANT PRICING FOR MENU ITEM
// GET /menu-items/:menuItemId/restaurants
// ============================================================

export interface RestaurantMenuPrice {
  restaurantMenuItemId: string;
  restaurantId: string;
  price: number | string;
  priceDifference: number | string;
  isAvailable: boolean;
  updatedAt: string;
}

export interface MenuItemRestaurantPricing {
  menuItem: MenuItem;

  restaurants: RestaurantMenuPrice[];
}

export interface MenuItemRestaurantPricingResponse {
  message: string;
  data: MenuItemRestaurantPricing;
}

export async function getMenuItemRestaurantPricing(
  menuItemId: string,
): Promise<MenuItemRestaurantPricingResponse> {
  const response = await catalogApi.get<MenuItemRestaurantPricingResponse>(
    `/menu-items/${menuItemId}/restaurants`,
  );

  return response.data;
}

// ============================================================
// RESTAURANT MENU ITEM
// ============================================================

export interface RestaurantMenuItem {
  id: string;
  restaurantId: string;
  menuItemId: string;

  price: number | string;
  isAvailable: boolean;

  createdAt?: string;
  updatedAt?: string;

  menuItem?: MenuItem;
}

export interface CreateRestaurantMenuItemPayload {
  restaurantId: string;
  menuItemId: string;
  price?: number;
  isAvailable?: boolean;
}

export interface UpdateRestaurantMenuItemPayload {
  price?: number;
  isAvailable?: boolean;
}

export interface RestaurantMenuItemResponse {
  message: string;
  data: RestaurantMenuItem;
}

// ============================================================
// CREATE RESTAURANT MENU ITEM
// POST /restaurant-menu-item
// ============================================================

export async function createRestaurantMenuItem(
  data: CreateRestaurantMenuItemPayload,
): Promise<RestaurantMenuItemResponse> {
  const response = await catalogApi.post<RestaurantMenuItemResponse>(
    "/restaurant-menu-item",
    data,
  );

  return response.data;
}

// ============================================================
// GET RESTAURANT MENU ITEM
// GET /restaurant-menu-item/:id
// ============================================================

export async function getRestaurantMenuItemById(
  restaurantMenuItemId: string,
): Promise<RestaurantMenuItemResponse> {
  const response = await catalogApi.get<RestaurantMenuItemResponse>(
    `/restaurant-menu-item/${restaurantMenuItemId}`,
  );

  return response.data;
}

// ============================================================
// UPDATE RESTAURANT MENU ITEM
// PATCH /restaurant-menu-item/:id
//
// ONLY:
// - price
// - isAvailable
// ============================================================

export async function updateRestaurantMenuItem(
  restaurantMenuItemId: string,
  data: UpdateRestaurantMenuItemPayload,
): Promise<RestaurantMenuItemResponse> {
  const response = await catalogApi.patch<RestaurantMenuItemResponse>(
    `/restaurant-menu-item/${restaurantMenuItemId}`,
    data,
  );

  return response.data;
}

// ============================================================
// DELETE RESTAURANT MENU ITEM
// DELETE /restaurant-menu-item/:id
// ============================================================

export async function deleteRestaurantMenuItem(
  restaurantMenuItemId: string,
): Promise<RestaurantMenuItemResponse> {
  const response = await catalogApi.delete<RestaurantMenuItemResponse>(
    `/restaurant-menu-item/${restaurantMenuItemId}`,
  );

  return response.data;
}

// ============================================================
// RESTAURANT MENU
// GET /restaurant-menu-item/restaurant/:restaurantId
// ============================================================

export async function getRestaurantMenuItems(
  restaurantId: string,
  page = 1,
  limit = 20,
) {
  const response = await catalogApi.get(
    `/restaurant-menu-item/restaurant/${restaurantId}`,
    {
      params: {
        page,
        limit,
      },
    },
  );

  return response.data;
}

// ============================================================
// CHANGED RESTAURANT MENU ITEMS
// GET /restaurant-menu-item/restaurant/:restaurantId/changed
// ============================================================

export async function getChangedRestaurantMenuItems(
  restaurantId: string,
  page = 1,
  limit = 20,
) {
  const response = await catalogApi.get(
    `/restaurant-menu-item/restaurant/${restaurantId}/changed`,
    {
      params: {
        page,
        limit,
      },
    },
  );

  return response.data;
}

// ============================================================
// ALL CHANGED RESTAURANT MENU ITEMS
// GET /restaurant-menu-item/changed
// ============================================================

export async function getAllChangedRestaurantMenuItems(page = 1, limit = 20) {
  const response = await catalogApi.get("/restaurant-menu-item/changed", {
    params: {
      page,
      limit,
    },
  });

  return response.data;
}
// ============================================================
// INGREDIENTS
// ============================================================

export interface Ingredient {
  id: string;
  name: string;
  uom: string;
  isActive: boolean;

  createdAt?: string;
  updatedAt?: string;
}

export interface CreateIngredientPayload {
  name: string;
  uom: string;
  isActive?: boolean;
}

export interface UpdateIngredientPayload {
  name?: string;
  uom?: string;
  isActive?: boolean;
}
export interface IngredientListResponse {
  message: string;
  data: Ingredient[];
  pagination: Pagination;
}

export async function getIngredients(
  page = 1,
  limit = 20,
  search = "",
): Promise<IngredientListResponse> {
  const response = await catalogApi.get<IngredientListResponse>(
    "/ingredients",
    {
      params: {
        page,
        limit,
        ...(search.trim()
          ? {
              search: search.trim(),
            }
          : {}),
      },
    },
  );

  return response.data;
}

export async function getIngredientById(ingredientId: string) {
  const response = await catalogApi.get(`/ingredients/${ingredientId}`);

  return response.data;
}

export async function createIngredient(data: CreateIngredientPayload) {
  const response = await catalogApi.post("/ingredients", data);

  return response.data;
}

export async function updateIngredient(
  ingredientId: string,
  data: UpdateIngredientPayload,
) {
  const response = await catalogApi.patch(`/ingredients/${ingredientId}`, data);

  return response.data;
}

export async function deleteIngredient(ingredientId: string) {
  const response = await catalogApi.delete(`/ingredients/${ingredientId}`);

  return response.data;
}

// ============================================================
// MODIFIER GROUP
// ============================================================

// Backend controller route:
// /modifier-group

export interface ModifierGroup {
  id: string;
  name: string;
  sortOrder: number;
  minSelections: number;
  maxSelections: number;
  isActive: boolean;

  modifiers?: Modifier[];

  createdAt?: string;
  updatedAt?: string;
}

export interface CreateModifierGroupPayload {
  name: string;
  sortOrder?: number;
  minSelections?: number;
  maxSelections?: number;
  isActive?: boolean;
}

export interface UpdateModifierGroupPayload {
  name?: string;
  sortOrder?: number;
  minSelections?: number;
  maxSelections?: number;
  isActive?: boolean;
}

export async function getModifierGroups(): Promise<ModifierGroup[]> {
  const response = await catalogApi.get<ModifierGroup[]>("/modifier-group");

  return response.data;
}

export async function getModifierGroupById(
  groupId: string,
): Promise<ModifierGroup> {
  const response = await catalogApi.get<ModifierGroup>(
    `/modifier-group/${groupId}`,
  );

  return response.data;
}

export async function createModifierGroup(
  data: CreateModifierGroupPayload,
): Promise<ModifierGroup> {
  const response = await catalogApi.post<ModifierGroup>(
    "/modifier-group",
    data,
  );

  return response.data;
}

export async function updateModifierGroup(
  groupId: string,
  data: UpdateModifierGroupPayload,
): Promise<ModifierGroup> {
  const response = await catalogApi.patch<ModifierGroup>(
    `/modifier-group/${groupId}`,
    data,
  );

  return response.data;
}

export async function deleteModifierGroup(groupId: string) {
  const response = await catalogApi.delete(`/modifier-group/${groupId}`);

  return response.data;
}

// ============================================================
// MODIFIER
// ============================================================

export interface Modifier {
  id: string;
  groupId: string;
  name: string;
  sortOrder: number;
  extraPrice: number | string;
  isActive: boolean;

  group?: ModifierGroup;

  createdAt?: string;
  updatedAt?: string;
}

export interface ModifierListResponse {
  message: string;
  result: Modifier[];
}

export interface ModifierMutationResponse {
  message: string;
  result: {
    group: ModifierGroup;
    modifier: Modifier;
  };
}

export interface CreateModifierPayload {
  groupId: string;
  name: string;
  sortOrder?: number;
  extraPrice?: number;
  isActive?: boolean;
}

export interface UpdateModifierPayload {
  groupId?: string;
  name?: string;
  sortOrder?: number;
  extraPrice?: number;
  isActive?: boolean;
}

export async function getModifiers(
  groupId?: string,
): Promise<ModifierListResponse> {
  const response = await catalogApi.get<ModifierListResponse>("/modifiers", {
    params: groupId
      ? {
          groupId,
        }
      : undefined,
  });

  return response.data;
}

export async function getModifierById(modifierId: string): Promise<{
  message: string;
  result: ModifierMutationResponse["result"];
}> {
  const response = await catalogApi.get<{
    message: string;
    result: ModifierMutationResponse["result"];
  }>(`/modifiers/${modifierId}`);

  return response.data;
}

export async function createModifier(
  data: CreateModifierPayload,
): Promise<ModifierMutationResponse> {
  const response = await catalogApi.post<ModifierMutationResponse>(
    "/modifiers",
    data,
  );

  return response.data;
}

export async function updateModifier(
  modifierId: string,
  data: UpdateModifierPayload,
): Promise<ModifierMutationResponse> {
  const response = await catalogApi.patch<ModifierMutationResponse>(
    `/modifiers/${modifierId}`,
    data,
  );

  return response.data;
}

export async function deleteModifier(modifierId: string) {
  const response = await catalogApi.delete(`/modifiers/${modifierId}`);

  return response.data;
}

// ============================================================
// ITEM MODIFIER GROUP
// ============================================================

export interface ItemModifierGroup {
  menuItemId: string;
  groupId: string;

  menuItem?: MenuItem;

  group: ModifierGroup;
}

export interface ItemModifierGroupListResponse {
  message: string;
  result: ItemModifierGroup[];
}

export interface AssignModifierGroupPayload {
  menuItemId: string;
  groupId: string;
}

// ============================================================
// ASSIGN MODIFIER GROUP
// POST /item-modifier-groups
// ============================================================

export async function assignModifierGroupToMenuItem(
  data: AssignModifierGroupPayload,
) {
  const response = await catalogApi.post("/item-modifier-groups", data);

  return response.data;
}

// ============================================================
// GET ITEM MODIFIER GROUPS
// GET /item-modifier-groups?menuItemId=...
// ============================================================

export async function getMenuItemModifierGroups(
  menuItemId: string,
): Promise<ItemModifierGroupListResponse> {
  const response = await catalogApi.get<ItemModifierGroupListResponse>(
    "/item-modifier-groups",
    {
      params: {
        menuItemId,
      },
    },
  );

  return response.data;
}

// ============================================================
// GET ONE
// GET /item-modifier-groups/:menuItemId/:groupId
// ============================================================

export async function getItemModifierGroup(
  menuItemId: string,
  groupId: string,
) {
  const response = await catalogApi.get(
    `/item-modifier-groups/${menuItemId}/${groupId}`,
  );

  return response.data;
}

// ============================================================
// REMOVE GROUP FROM MENU ITEM
// DELETE /item-modifier-groups/:menuItemId/:groupId
// ============================================================

export async function removeModifierGroupFromMenuItem(
  menuItemId: string,
  groupId: string,
) {
  const response = await catalogApi.delete(
    `/item-modifier-groups/${menuItemId}/${groupId}`,
  );

  return response.data;
}
// ============================================================
// RECIPE ITEMS
// ============================================================

export interface RecipeItem {
  id: string;

  menuItemId: string | null;
  modifierId: string | null;

  ingredientId: string;

  quantityNeeded: number | string;

  ingredient?: Ingredient;
  menuItem?: MenuItem;
  modifier?: Modifier;
}

export interface CreateRecipeItemPayload {
  menuItemId?: string;
  modifierId?: string;
  ingredientId: string;
  quantityNeeded: number;
}

export interface CreateBulkRecipeItem {
  ingredientId: string;
  quantityNeeded: number;
}

export interface CreateBulkRecipeItemPayload {
  menuItemId?: string;
  modifierId?: string;
  recipes: CreateBulkRecipeItem[];
}

export interface RecipeIngredientRow {
  recipeItemId: string;
  ingredientId: string;
  name: string;
  uom: string;
  isActive: boolean;
  quantityNeeded: number | string;
}

export interface MenuItemRecipeResponse {
  message: string;

  menuItem: {
    id: string;
    name: string;
    sku: string;
  };

  data: RecipeIngredientRow[];
}

export interface ModifierRecipeResponse {
  message: string;

  modifier: {
    id: string;
    name: string;
    groupId: string;
  };

  data: RecipeIngredientRow[];
}

export interface UpdateRecipeItemPayload {
  ingredientId?: string;
  quantityNeeded?: number;
}

// ============================================================
// CREATE RECIPE ITEM
// POST /recipe-items
// ============================================================

export async function createRecipeItem(data: CreateRecipeItemPayload) {
  const response = await catalogApi.post("/recipe-items", data);

  return response.data;
}

// ============================================================
// BULK CREATE RECIPE ITEMS
// POST /recipe-items/bulk
//
// IMPORTANT:
// Backend expects:
// {
//   menuItemId?: string,
//   modifierId?: string,
//   recipes: [
//     {
//       ingredientId: string,
//       quantityNeeded: number
//     }
//   ]
// }
// ============================================================

export async function createRecipeItemsBulk(data: CreateBulkRecipeItemPayload) {
  const response = await catalogApi.post("/recipe-items/bulk", data);

  return response.data;
}

// ============================================================
// MENU ITEM RECIPES
// GET /recipe-items/menu-items/:menuItemId
// ============================================================

export async function getMenuItemRecipes(
  menuItemId: string,
): Promise<MenuItemRecipeResponse> {
  const response = await catalogApi.get<MenuItemRecipeResponse>(
    `/recipe-items/menu-items/${menuItemId}`,
  );

  return response.data;
}

// ============================================================
// MODIFIER RECIPES
// GET /recipe-items/modifiers/:modifierId
// ============================================================

export async function getModifierRecipes(
  modifierId: string,
): Promise<ModifierRecipeResponse> {
  const response = await catalogApi.get<ModifierRecipeResponse>(
    `/recipe-items/modifiers/${modifierId}`,
  );

  return response.data;
}

// ============================================================
// GET RECIPE ITEM
// GET /recipe-items/:id
// ============================================================

export async function getRecipeItemById(recipeItemId: string) {
  const response = await catalogApi.get(`/recipe-items/${recipeItemId}`);

  return response.data;
}

// ============================================================
// UPDATE RECIPE ITEM
// PATCH /recipe-items/:id
// ============================================================

export async function updateRecipeItem(
  recipeItemId: string,
  data: UpdateRecipeItemPayload,
) {
  const response = await catalogApi.patch(
    `/recipe-items/${recipeItemId}`,
    data,
  );

  return response.data;
}

// ============================================================
// DELETE RECIPE ITEM
// DELETE /recipe-items/:id
// ============================================================

export async function deleteRecipeItem(recipeItemId: string) {
  const response = await catalogApi.delete(`/recipe-items/${recipeItemId}`);

  return response.data;
}

// ============================================================
// PAGINATED MENU ITEM RECIPES
// GET /recipe-items/menu-items
// ============================================================

export async function getAllMenuItemRecipes(page = 1, limit = 20) {
  const response = await catalogApi.get("/recipe-items/menu-items", {
    params: {
      page,
      limit,
    },
  });

  return response.data;
}

// ============================================================
// PAGINATED MODIFIER RECIPES
// GET /recipe-items/modifiers
// ============================================================

export async function getAllModifierRecipes(page = 1, limit = 20) {
  const response = await catalogApi.get("/recipe-items/modifiers", {
    params: {
      page,
      limit,
    },
  });

  return response.data;
}

export async function loadAllStockIngredients(): Promise<
  Ingredient[]
> {
  const records = new Map<string, Ingredient>();

  let page = 1;
  let totalPages = 1;

  do {
    const response = await getIngredients(page, 50);

    response.data.forEach((ingredient) => {
      records.set(ingredient.id, ingredient);
    });

    totalPages = response.pagination.totalPages;
    page += 1;
  } while (page <= totalPages);

  return [...records.values()];
}

// GET     /menu-items
// GET     /menu-items/:id
// GET     /menu-items/category/:categoryId
// POST    /menu-items
// PATCH   /menu-items/:id
// DELETE  /menu-items/:id

// GET     /menu-items/:menuItemId/restaurants

// GET     /menu-categories
// GET     /menu-categories/:id
// POST    /menu-categories
// PATCH   /menu-categories/:id
// DELETE   /menu-categories/:id

// POST    /restaurant-menu-item
// GET     /restaurant-menu-item/:id
// PATCH   /restaurant-menu-item/:id
// DELETE  /restaurant-menu-item/:id

// GET     /restaurant-menu-item/restaurant/:restaurantId
// GET     /restaurant-menu-item/restaurant/:restaurantId/changed
// GET     /restaurant-menu-item/changed

// POST    /ingredients
// GET     /ingredients
// GET     /ingredients/:id
// PATCH   /ingredients/:id
// DELETE  /ingredients/:id

// POST    /modifier-group
// GET     /modifier-group
// GET     /modifier-group/:id
// PATCH   /modifier-group/:id
// DELETE  /modifier-group/:id

// POST    /modifiers
// GET     /modifiers
// GET     /modifiers/:id
// PATCH   /modifiers/:id
// DELETE  /modifiers/:id

// POST    /item-modifier-groups
// GET     /item-modifier-groups
// GET     /item-modifier-groups/:menuItemId/:groupId
// DELETE  /item-modifier-groups/:menuItemId/:groupId

// POST    /recipe-items
// POST    /recipe-items/bulk
// GET     /recipe-items/menu-items
// GET     /recipe-items/menu-items/:menuItemId
// GET     /recipe-items/modifiers
// GET     /recipe-items/modifiers/:modifierId
// GET     /recipe-items/:id
// PATCH   /recipe-items/:id
// DELETE  /recipe-items/:id
