import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { IncidenciasController } from './incidencias.controller';
import { IncidenciasRepository } from './incidencias.repository';
import { IncidenciasService } from './incidencias.service';

/** Registra la consulta de incidencias sin habilitar operaciones de escritura. */
@Module({
  imports: [DatabaseModule],
  controllers: [IncidenciasController],
  providers: [IncidenciasService, IncidenciasRepository],
})
export class IncidenciasModule {}
