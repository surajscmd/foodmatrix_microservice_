import {
  Body,
  Controller,
  Get,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SystemUserRole } from '@prisma/client';
import { AuthGuard, Roles } from '../../auth/auth.guard.js';
import type { AuthenticatedRequest } from '../../auth/auth.guard.js';
import { requiredFranchise } from '../../auth/organization-scope.js';
import { FranchiseService } from './franchise.service.js';
import { UpdateFranchiseDto } from './dto/update-franchise.dto.js';

@Controller('franchise')
@UseGuards(AuthGuard)
export class FranchiseController {
  constructor(private readonly franchiseService: FranchiseService) {}

  @Get('options')
  @Roles(SystemUserRole.SUPER_ADMIN)
  async options() {
    return { data: await this.franchiseService.listOptions() };
  }

  @Get()
  @Roles(
    SystemUserRole.SUPER_ADMIN,
    SystemUserRole.FRANCHISE_ADMIN,
    SystemUserRole.OPERATIONS,
  )
  async find(
    @Req() req: AuthenticatedRequest,
    @Query('franchiseId', new ParseUUIDPipe({ optional: true })) id?: string,
  ) {
    const data = await this.franchiseService.find(
      requiredFranchise(req.user!, id),
    );
    return { message: 'Franchise fetched successfully', data };
  }

  @Patch()
  @Roles(SystemUserRole.SUPER_ADMIN, SystemUserRole.FRANCHISE_ADMIN)
  async update(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateFranchiseDto,
    @Query('franchiseId', new ParseUUIDPipe({ optional: true })) id?: string,
  ) {
    const data = await this.franchiseService.update(
      requiredFranchise(req.user!, id),
      dto,
    );
    return { message: 'Franchise updated successfully', data };
  }
}
