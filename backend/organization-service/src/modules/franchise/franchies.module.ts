// src/franchise/franchise.module.ts
import { Module } from '@nestjs/common';
import { FranchiseService } from './franchies.service.js';
import { FranchiseController } from './franchies.controller.js';

@Module({
  controllers: [FranchiseController],
  providers: [FranchiseService],
})
export class FranchiseModule {}
