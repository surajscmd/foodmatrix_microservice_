import { expect, it } from '@jest/globals';
import { validate } from 'class-validator';
import { UpdateFranchiseDto } from './franchise/dto/update-franchise.dto.js';
import { UpdateRestaurantDto } from './restaurant/dto/update-restaurant.dto.js';

it('accepts real currency and time zone values and permits omitting either setting', async () => {
  await expect(
    validate(
      Object.assign(new UpdateFranchiseDto(), { defaultCurrency: 'INR' }),
    ),
  ).resolves.toEqual([]);
  await expect(
    validate(
      Object.assign(new UpdateRestaurantDto(), { timezone: 'Asia/Kolkata' }),
    ),
  ).resolves.toEqual([]);
  await expect(validate(new UpdateFranchiseDto())).resolves.toEqual([]);
  await expect(validate(new UpdateRestaurantDto())).resolves.toEqual([]);
});

it('rejects unknown settings and null, which cannot be stored in either field', async () => {
  for (const defaultCurrency of ['ZZZ', null]) {
    const errors = await validate(
      Object.assign(new UpdateFranchiseDto(), { defaultCurrency }),
    );
    expect(errors.map((error) => error.property)).toEqual(['defaultCurrency']);
  }
  for (const timezone of ['Asia/Unknown', null]) {
    const errors = await validate(
      Object.assign(new UpdateRestaurantDto(), { timezone }),
    );
    expect(errors.map((error) => error.property)).toEqual(['timezone']);
  }
});
