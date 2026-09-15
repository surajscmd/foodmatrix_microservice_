import { Module } from '@nestjs/common';
import { FranchiseService } from './franchise.service.js';
import { FranchiseController } from './franchise.controller.js';

@Module({
  controllers: [FranchiseController],
  providers: [FranchiseService],
})
export class FranchiseModule {}
