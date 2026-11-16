import { Controller, Get } from '@nestjs/common';
import { OrderAccess } from './auth/order-access';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @OrderAccess('health')
  getHello(): string {
    return this.appService.getHello();
  }
}
