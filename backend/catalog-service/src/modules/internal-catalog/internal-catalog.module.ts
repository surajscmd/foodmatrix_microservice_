import { Module } from '@nestjs/common';
import { InternalCatalogService } from './internal-catalog.service';
import { InternalCatalogController } from './internal-catalog.controller';

@Module({
  controllers: [InternalCatalogController],
  providers: [InternalCatalogService],
})
export class InternalCatalogModule {}
