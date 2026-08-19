import { PartialType } from '@nestjs/mapped-types';
import { CreateShiftTemplateDto } from './create-shift-template.dto.js';

export class UpdateShiftTemplateDto extends PartialType(
  CreateShiftTemplateDto,
) {}
