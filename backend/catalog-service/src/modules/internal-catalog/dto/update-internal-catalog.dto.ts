import { PartialType } from '@nestjs/mapped-types';
import { CreateInternalCatalogDto } from './create-internal-catalog.dto';

export class UpdateInternalCatalogDto extends PartialType(
  CreateInternalCatalogDto,
) {}
