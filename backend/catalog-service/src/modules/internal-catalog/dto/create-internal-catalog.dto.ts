import { IsArray, IsString } from 'class-validator';

export class CreateInternalCatalogDto {
  @IsString()
  restaurantId!: string;

  @IsArray()
  @IsString({ each: true })
  menuItemIds!: string[];

  @IsArray()
  @IsString({ each: true })
  modifierIds!: string[];
}
