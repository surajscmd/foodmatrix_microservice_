import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { VersioningType, ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
dotenv.config();
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const PORT = process.env.PORT || 3004;

  // 1. Turn on URI Versioning (This makes the /v1/ work!)
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // 2. Enable Global Validation (So your DTOs actually run)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 🟢 Turns security BACK ON (strips bad data)
      transform: true, // 🟢 Turns transformation BACK ON
      forbidNonWhitelisted: true, // 🟢 Rejects requests with unexpected fields
    }),
  );
  await app.listen(PORT);
}
void bootstrap();
