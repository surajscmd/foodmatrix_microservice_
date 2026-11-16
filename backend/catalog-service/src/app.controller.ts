import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { CatalogAccess } from './auth/catalog-access';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @CatalogAccess('health')
  getHello(): string {
    return this.appService.getHello();
  }
}
