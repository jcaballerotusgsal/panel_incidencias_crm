import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { HealthModule } from './health/health.module';
import { IncidenciasModule } from './incidencias/incidencias.module';
import { LineasModule } from './lineas/lineas.module';

/** Módulo raíz: registra los módulos funcionales del backoffice. */
@Module({ imports: [HealthModule, IncidenciasModule, LineasModule], controllers: [AppController] })
export class AppModule {}
