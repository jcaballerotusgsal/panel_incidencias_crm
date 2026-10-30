import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { HealthModule } from './health/health.module';
import { IncidenciasModule } from './incidencias/incidencias.module';
import { LineasModule } from './lineas/lineas.module';
import { QuejasModule } from './quejas/quejas.module';

/** Módulo raíz: registra los módulos funcionales del backoffice. */
@Module({ imports: [HealthModule, IncidenciasModule, LineasModule, QuejasModule], controllers: [AppController] })
export class AppModule {}
