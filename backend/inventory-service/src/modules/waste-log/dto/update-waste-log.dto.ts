import { PartialType } from '@nestjs/mapped-types';
import { CreateWasteLogDto } from './create-waste-log.dto.js';

export class UpdateWasteLogDto extends PartialType(CreateWasteLogDto) {}
