import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PoblacionesController } from './poblaciones.controller';
import { PoblacionesRepository } from './poblaciones.repository';
import { PoblacionesService } from './poblaciones.service';

/** Registra la lectura de zonas sin añadir objetos ni conexiones independientes al CRM. */
@Module({ imports: [DatabaseModule], controllers: [PoblacionesController], providers: [PoblacionesService, PoblacionesRepository] })
export class PoblacionesModule {}
