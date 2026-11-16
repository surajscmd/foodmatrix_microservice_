import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureOrganizationApp } from './configure-app.js';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });
  configureOrganizationApp(app);
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
