import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class CreateInternalRecipeDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  menuItemIds!: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  modifierIds!: string[];
}
