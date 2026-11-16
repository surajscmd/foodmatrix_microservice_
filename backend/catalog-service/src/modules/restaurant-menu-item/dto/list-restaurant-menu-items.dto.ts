import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ListRestaurantMenuItemsDto {
  @IsString()
  page = '1';

  @IsString()
  limit = '10';

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(['available', 'unavailable'])
  availability?: 'available' | 'unavailable';

  @IsOptional()
  @IsIn(['true', 'false'])
  includeAvailabilityCounts?: 'true' | 'false';
}
