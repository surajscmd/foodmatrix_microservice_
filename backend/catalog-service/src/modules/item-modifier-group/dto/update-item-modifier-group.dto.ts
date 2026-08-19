import { PartialType } from '@nestjs/mapped-types';
import { CreateItemModifierGroupDto } from './create-item-modifier-group.dto';

export class UpdateItemModifierGroupDto extends PartialType(
  CreateItemModifierGroupDto,
) {}
