import { IsArray, IsUUID } from 'class-validator';

export class CreateInternalCatalogDto {
  @IsUUID()
  restaurantId!: string;

  @IsArray()
  @IsUUID('4', { each: true })
  menuItemIds!: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  modifierIds!: string[];
}
