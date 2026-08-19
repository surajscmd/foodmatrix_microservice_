import { Module } from '@nestjs/common';
import { ShiftTemplateController } from './shift-template.controller';
import { ShiftTemplateService } from './shift-template.service';

@Module({
  controllers: [ShiftTemplateController],
  providers: [ShiftTemplateService],
})
export class ShiftTemplateModule {}
