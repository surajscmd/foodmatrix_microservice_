import { Prisma } from '@prisma/client';

export interface ResolvedModifier {
  modifierId: string;
  name: string;
  price: Prisma.Decimal;
  quantity: number;
}

export interface ResolvedOrderLine {
  menuItemId: string;
  name: string;
  price: Prisma.Decimal;
  quantity: number;
  modifiers: ResolvedModifier[];
  total: Prisma.Decimal;
}
