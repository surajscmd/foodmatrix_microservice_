import { InventoryAccess } from './auth/inventory-access.js';
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @InventoryAccess('health')
  getHello(): string {
    return this.appService.getHello();
  }
}
