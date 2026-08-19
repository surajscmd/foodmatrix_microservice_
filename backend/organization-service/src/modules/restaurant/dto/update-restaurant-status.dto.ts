// update-restaurant-status.dto.ts
import { IsEnum } from 'class-validator';

export enum RestaurantStatusInput {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class UpdateRestaurantStatusDto {
  @IsEnum(RestaurantStatusInput, {
    message: 'status must be either ACTIVE or INACTIVE',
  })
  status!: RestaurantStatusInput;
}
