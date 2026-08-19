import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Controller('prisma')
export class PrismaController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('test')
  async test() {
    const staffCount = await this.prisma.staff.count();

    return {
      message: 'HR database connection successful',
      staffCount,
    };
  }
}
