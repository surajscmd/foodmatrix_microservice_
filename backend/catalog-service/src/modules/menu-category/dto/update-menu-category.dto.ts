import { PartialType } from '@nestjs/mapped-types';
import { CreateMenuCategoryDto } from './create-menu-category.dto.js';

export class UpdateMenuCategoryDto extends PartialType(CreateMenuCategoryDto) {}
