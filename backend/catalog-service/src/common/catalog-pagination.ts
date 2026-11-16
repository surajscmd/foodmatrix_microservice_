import { BadRequestException } from '@nestjs/common';

export function catalogPageOffset(page: number, limit: number) {
  const offset = (page - 1) * limit;
  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 1000 ||
    !Number.isSafeInteger(offset)
  ) {
    throw new BadRequestException(
      'Page must be positive and limit must be between 1 and 1000',
    );
  }
  return offset;
}
