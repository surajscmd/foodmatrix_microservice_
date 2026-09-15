import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';

import { FranchiseService } from './franchise.service.js';
import { UpdateFranchiseDto } from './dto/update-franchise.dto.js';
import { AuthGuard, Roles } from '../../auth/auth.guard.js';
import { SystemUserRole } from '@prisma/client';

@Controller('franchise')
@UseGuards(AuthGuard)
@Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.FRANCHISE_ADMIN)
export class FranchiseController {
  constructor(private readonly franchiseService: FranchiseService) {}

  @Get()
  async find() {
    const data = await this.franchiseService.find();

    return {
      message: 'Franchise fetched successfully',
      data,
    };
  }

  @Patch()
  async update(@Body() dto: UpdateFranchiseDto) {
    const data = await this.franchiseService.update(dto);

    return {
      message: 'Franchise updated successfully',
      data,
    };
  }
}
