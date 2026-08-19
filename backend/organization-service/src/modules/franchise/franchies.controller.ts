// src/franchise/franchise.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { FranchiseService } from './franchies.service.js';
import { CreateFranchiseDto } from './dto/create-franchise.dto.js';
import { UpdateFranchiseDto } from './dto/update-franchise.dto.js';
@Controller({ path: 'franchises', version: '1' })
export class FranchiseController {
  constructor(private readonly franchiseService: FranchiseService) {}
  // POST /v1/franchises
  @Post()
  async createFranchise(@Body() createFranchiseDto: CreateFranchiseDto) {
    const franchise =
      await this.franchiseService.createFranchise(createFranchiseDto);

    return {
      message: 'Franchise created successfully',
      data: franchise,
    };
  }
  // GET /v1/franchises
  @Get()
  async findAllFranchises() {
    const franchises = await this.franchiseService.findAllFranchises();
    return {
      message: 'Franchises retrieved successfully',
      data: franchises,
    };
  }
  // GET /v1/franchises/:id
  @Get(':id')
  async getFranchiseById(@Param('id') id: string) {
    const franchise = await this.franchiseService.findOne(id);
    return {
      message: 'A Franchise retrieved successfully',
      data: franchise,
    };
  }

  // PATCH /v1/franchises/:id
  @Patch(':id')
  async updateFranchise(
    @Param('id') id: string,
    @Body() payload: UpdateFranchiseDto,
  ) {
    const updatedFranchise = await this.franchiseService.update(id, payload);

    return {
      message: 'Franchise updated successfully',
      data: updatedFranchise,
    };
  }
  // DELETE /v1/franchises/:id
  @Delete(':id')
  async deleteFranchise(@Param('id') id: string) {
    const franchise = await this.franchiseService.delete(id);

    return {
      message: 'Franchise deleted successfully',
      data: franchise,
    };
  }
}
