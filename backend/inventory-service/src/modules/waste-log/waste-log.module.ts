import { Module } from '@nestjs/common';
import { WasteLogService } from './waste-log.service.js';
import { WasteLogController } from './waste-log.controller.js';

@Module({
  controllers: [WasteLogController],
  providers: [WasteLogService],
})
export class WasteLogModule {}
