import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { TerminalService } from './terminal.service.js';
import { CreateTerminalDto } from './dto/create-terminal.dto.js';
import { UpdateTerminalDto } from './dto/update-terminal.dto.js';
import { UpdateTerminalStatusDto } from './dto/update-terminal-status.dto.js';
import { PairDeviceDto } from './dto/pair-device.dto.js';

@Controller({ path: 'terminals', version: '1' })
export class TerminalController {
  constructor(private readonly terminalService: TerminalService) {}

  // ============================================================
  // CREATE TERMINAL
  // ============================================================

  @Post()
  async create(@Body() createTerminalDto: CreateTerminalDto) {
    const terminal = await this.terminalService.create(createTerminalDto);

    return {
      message: 'Terminal created successfully. Pairing code generated.',
      data: terminal,
    };
  }

  // ============================================================
  // PAIR DEVICE
  // ============================================================

  @Post('pair')
  @HttpCode(HttpStatus.OK)
  async pairDevice(@Body() dto: PairDeviceDto) {
    const terminal = await this.terminalService.pairDevice(
      dto.pairingCode,
      dto.deviceModel,
    );

    return {
      message: 'Terminal paired successfully.',
      data: terminal,
    };
  }

  // ============================================================
  // HEARTBEAT
  // ============================================================

  @Post(':id/ping')
  @HttpCode(HttpStatus.OK)
  async ping(@Param('id') id: string) {
    const terminal = await this.terminalService.ping(id);

    return {
      message: 'Heartbeat received.',
      data: terminal,
    };
  }

  // ============================================================
  // GET TERMINALS FOR ONE RESTAURANT
  // ============================================================

  @Get('restaurant/:restaurantId')
  async findByRestaurant(@Param('restaurantId') restaurantId: string) {
    const terminals = await this.terminalService.findByRestaurant(restaurantId);

    return {
      message: 'Restaurant terminals retrieved successfully.',
      data: terminals,
    };
  }

  // ============================================================
  // GET ONE TERMINAL
  // ============================================================

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const terminal = await this.terminalService.findOne(id);

    return {
      message: 'Terminal retrieved successfully.',
      data: terminal,
    };
  }

  // ============================================================
  // UPDATE TERMINAL
  // ============================================================

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTerminalDto: UpdateTerminalDto,
  ) {
    const terminal = await this.terminalService.update(id, updateTerminalDto);

    return {
      message: 'Terminal updated successfully.',
      data: terminal,
    };
  }

  // ============================================================
  // UPDATE TERMINAL STATUS
  // ============================================================

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTerminalStatusDto,
  ) {
    const terminal = await this.terminalService.updateStatus(id, dto);

    return {
      message: 'Terminal status updated successfully.',
      data: terminal,
    };
  }

  // ============================================================
  // DELETE TERMINAL
  // ============================================================

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.terminalService.remove(id);

    return {
      message: 'Terminal deleted successfully.',
    };
  }
}
