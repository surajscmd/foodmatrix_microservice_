import type { ResolvedModifier } from '../types/order.types';

interface ExistingModifier {
  modifierId: string;
  quantity: number;
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
    }))
    .sort((a, b) => a.modifierId.localeCompare(b.modifierId));

  const incoming = newModifiers
    .map((modifier) => ({
      modifierId: modifier.modifierId,
      quantity: modifier.quantity,
    }))
    .sort((a, b) => a.modifierId.localeCompare(b.modifierId));

  return existing.every(
    (modifier, index) =>
      modifier.modifierId === incoming[index].modifierId &&
      modifier.quantity === incoming[index].quantity,
  );
}
