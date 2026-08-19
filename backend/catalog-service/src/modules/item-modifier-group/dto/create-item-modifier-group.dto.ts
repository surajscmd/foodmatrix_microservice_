import { IsUUID } from 'class-validator';

export class CreateItemModifierGroupDto {
  @IsUUID()
  menuItemId!: string;

  @IsUUID()
  groupId!: string;
}
