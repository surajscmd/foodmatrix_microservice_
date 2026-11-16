import {
  type INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';

export function configureCatalogApp(app: INestApplication) {
  app.enableVersioning({ type: VersioningType.URI });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
}
