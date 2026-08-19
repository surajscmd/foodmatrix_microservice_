import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Controller('database')
export class PrismaController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('test')
  async testConnection() {
    const franchiseCount = await this.prisma.franchise.count();

    return {
      connected: true,
      database: 'fmx_organization',
      franchiseCount,
    };
  }
}
