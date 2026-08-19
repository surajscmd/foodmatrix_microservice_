import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { CreateRegionDto } from './dto/create-region.dto.js';
import { UpdateRegionDto } from './dto/update-region.dto.js';
import { RegionsService } from './regions.service.js';

@Controller({ path: 'regions', version: '1' })
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}
  // Create a new region
  @Post()
  async createRegion(@Body() createRegionDto: CreateRegionDto) {
    const region = await this.regionsService.create(createRegionDto);

    return {
      message: 'Region created successfully',
      data: region,
    };
  }
  // Get all regions or filter by franchise ID
  @Get()
  async findAllRegion(@Query('franchiseId') franchiseId?: string) {
    const regions = franchiseId
      ? await this.regionsService.findByFranchise(franchiseId)
      : await this.regionsService.findAll();

    return {
      message: franchiseId
        ? 'Regions retrieved successfully for the franchise'
        : 'Regions retrieved successfully',
      data: regions,
    };
  }
  // Get a single region by ID
  @Get(':id')
  async findOneRegion(@Param('id') id: string) {
    const region = await this.regionsService.findOne(id);

    return {
      message: 'Region retrieved successfully',
      data: region,
    };
  }
  // Update a region by ID
  @Patch(':id')
  async updateRegion(
    @Param('id') id: string,
    @Body() payload: UpdateRegionDto,
  ) {
    const updatedRegion = await this.regionsService.update(id, payload);

    return {
      message: 'Region updated successfully',
      data: updatedRegion,
    };
  }
  // Delete a region by ID
  @Delete(':id')
  async removeRegion(@Param('id') id: string) {
    const deletedRegion = await this.regionsService.remove(id);

    return {
      message: 'Region deleted successfully',
      data: deletedRegion,
    };
  }
}
