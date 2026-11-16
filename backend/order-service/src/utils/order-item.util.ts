import type { Prisma } from '@prisma/client';
import type { ResolvedModifier } from '../types/order.types';

export const MAX_ORDER_QUANTITY = 32767;

interface ExistingModifier {
  modifierId: string;
  quantity: number;
  price: Prisma.Decimal;
}

export function areModifiersEqual(
  existingModifiers: readonly ExistingModifier[],
  newModifiers: readonly ResolvedModifier[],
): boolean {
  if (existingModifiers.length !== newModifiers.length) {
    return false;
  }

  if (existingModifiers.length === 0) {
    return true;
  }

  const existing = existingModifiers
    .map((modifier) => ({
      modifierId: modifier.modifierId,
      quantity: modifier.quantity,
      price: modifier.price,
    }))
    .sort((a, b) => a.modifierId.localeCompare(b.modifierId));

  const incoming = newModifiers
    .map((modifier) => ({
      modifierId: modifier.modifierId,
      quantity: modifier.quantity,
      price: modifier.price,
    }))
    .sort((a, b) => a.modifierId.localeCompare(b.modifierId));

  return existing.every(
    (modifier, index) =>
      modifier.modifierId === incoming[index].modifierId &&
      modifier.quantity === incoming[index].quantity &&
      modifier.price.equals(incoming[index].price),
  );
}
