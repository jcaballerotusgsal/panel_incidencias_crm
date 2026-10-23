import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { HealthModule } from './health/health.module';

/** Módulo raíz: registra los módulos funcionales del backoffice. */
@Module({ imports: [HealthModule], controllers: [AppController] })
export class AppModule {}
