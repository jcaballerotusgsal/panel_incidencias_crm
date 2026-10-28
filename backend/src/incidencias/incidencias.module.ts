import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { IncidenciasController } from './incidencias.controller';
import { IncidenciasRepository } from './incidencias.repository';
import { IncidenciasService } from './incidencias.service';
import { LogsConsultasRepository } from './logs-consultas.repository';

/** Registra la lectura de incidencias y la escritura de sus intentos en la tabla de logs. */
@Module({
  imports: [DatabaseModule],
  controllers: [IncidenciasController],
  providers: [IncidenciasService, IncidenciasRepository, LogsConsultasRepository],
})
export class IncidenciasModule {}
