import { CreateInternalCatalogDto } from './dto/create-internal-catalog.dto';
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { InternalCatalogService } from './internal-catalog.service';
import { InternalAuthGuard } from '../../common/guards/internal-auth.guard';

@Controller('internal/catalog')
@UseGuards(InternalAuthGuard)
export class InternalCatalogController {
  constructor(private readonly internalService: InternalCatalogService) {}

  @Post('bulk-pricing')
  async getBulkPricing(@Body() dto: CreateInternalCatalogDto) {
    // 2. Use the DTO here
    return this.internalService.getBulkPricing(
      dto.restaurantId,
      dto.menuItemIds,
      dto.modifierIds,
    );
  }
}
