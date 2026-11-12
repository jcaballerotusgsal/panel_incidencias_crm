import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { QuejasController } from './quejas.controller';
import { QuejasRepository } from './quejas.repository';
import { QuejasService } from './quejas.service';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

/** Reutiliza la conexión local para el alta transaccional, sin modificar el esquema del CRM. */
@Module({
  imports: [DatabaseModule, NotificacionesModule],
  controllers: [QuejasController],
  providers: [QuejasService, QuejasRepository],
})
export class QuejasModule {}
