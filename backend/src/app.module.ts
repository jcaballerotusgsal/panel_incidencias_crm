import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { HealthModule } from './health/health.module';
import { IncidenciasModule } from './incidencias/incidencias.module';

/** Módulo raíz: registra los módulos funcionales del backoffice. */
@Module({ imports: [HealthModule, IncidenciasModule], controllers: [AppController] })
export class AppModule {}
