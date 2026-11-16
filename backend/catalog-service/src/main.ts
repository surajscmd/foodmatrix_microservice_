import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureCatalogApp } from './configure-app.js';
import * as dotenv from 'dotenv';
dotenv.config();
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const PORT = process.env.PORT || 3004;

  configureCatalogApp(app);
  await app.listen(PORT);
}
void bootstrap();
