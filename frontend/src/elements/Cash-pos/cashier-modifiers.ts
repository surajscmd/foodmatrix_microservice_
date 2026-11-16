import type { ItemModifierGroup, ModifierGroup } from "@/lib/catalog-api";
import type { OrderItemInput } from "@/lib/order-api";

export interface CartModifier {
  id: string;
  name: string;
  extraPrice: number;
}

export interface CashierModifierGroup extends Pick<
  ModifierGroup,
  "id" | "name" | "minSelections" | "maxSelections"
> {
  options: CartModifier[];
}

export function groupMenuModifiers(assignments: ItemModifierGroup[]) {
  const byMenuItem = new Map<string, CashierModifierGroup[]>();

  for (const { menuItemId, group } of assignments) {
    if (!group.isActive || group.maxSelections === 0) continue;
    const options = (group.modifiers ?? [])
      .filter((modifier) => modifier.isActive)
      .map(({ id, name, extraPrice }) => ({
        id,
        name,
        extraPrice: Number(extraPrice),
      }))
      .filter(({ extraPrice }) => Number.isFinite(extraPrice));
    if (options.length === 0 && group.minSelections === 0) continue;
    const groups = byMenuItem.get(menuItemId) ?? [];
    groups.push({
      id: group.id,
      name: group.name,
      minSelections: group.minSelections,
      maxSelections: group.maxSelections,
      options,
    });
    byMenuItem.set(menuItemId, groups);
  }

  return byMenuItem;
}

export function itemPriceInCents(price: number, modifiers: CartModifier[]) {
  return modifiers.reduce(
    (total, modifier) => total + Math.round(modifier.extraPrice * 100),
    Math.round(price * 100),
  );
}

export function cashierOrderItem(
  menuItemId: string,
  quantity: number,
  modifiers: CartModifier[],
): OrderItemInput {
  return {
    menuItemId,
    quantity,
    ...(modifiers.length > 0 && {
      modifiers: modifiers.map(({ id }) => ({ modifierId: id, quantity: 1 })),
    }),
  };
}
