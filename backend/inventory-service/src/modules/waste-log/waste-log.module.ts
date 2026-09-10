import { Module } from '@nestjs/common';
import { WasteLogService } from './waste-log.service.js';
import { WasteLogController } from './waste-log.controller.js';
import { CatalogGatewayService } from '../../utils/caltalog-gateway.service.js';

@Module({
  controllers: [WasteLogController],
  providers: [WasteLogService, CatalogGatewayService ],
})
export class WasteLogModule {}
