import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Controller('prisma')
export class PrismaController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('test')
  async test() {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      message: 'HR database connection successful',
    };
  }
}
