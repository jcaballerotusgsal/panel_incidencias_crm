import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

/**
 * Inicia la API sobre Express, configura validación y habilita Swagger en desarrollo.
 * @throws Error si PORT no es válido o no se puede iniciar el servidor.
 */
async function bootstrap(): Promise<void> {
  const port = Number(process.env.PORT ?? '3001');
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT debe ser un entero entre 1 y 65535.');
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.disable('x-powered-by');
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  app.enableShutdownHooks();

  // El navegador utiliza /api en Next.js: no necesita CORS para este flujo.
  // CORS no sustituye a autenticación ni autorización.
  if (process.env.ENABLE_SWAGGER === 'true') {
    const config = new DocumentBuilder()
      .setTitle('Backoffice API')
      .setDescription('API del backoffice con consulta de incidencias en el MySQL del CRM.')
      .setVersion('0.1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(port, '0.0.0.0');
  Logger.log(`API iniciada en el puerto ${port}. Salud: /api/health`, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  Logger.error(error instanceof Error ? error.message : 'Error desconocido', undefined, 'Bootstrap');
  process.exit(1);
});
