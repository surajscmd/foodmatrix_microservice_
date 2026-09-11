import { IsBooleanString, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetNotificationsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;

  @IsOptional()
  @IsBooleanString()
  isRead?: string;
}
