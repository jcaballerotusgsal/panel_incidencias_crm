import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { NotificacionesConfig } from './notificaciones.config';
import { NotificacionesRepository } from './notificaciones.repository';

/** La API solo registra avisos; no construye transportes ni inicia envíos. */
@Module({ imports: [DatabaseModule], providers: [NotificacionesConfig, NotificacionesRepository], exports: [NotificacionesConfig, NotificacionesRepository] })
export class NotificacionesModule {}
