import { PartialType } from '@nestjs/mapped-types';
import { CreateFranchiseDto } from './create-franchise.dto.js';

export class UpdateFranchiseDto extends PartialType(CreateFranchiseDto) {}
