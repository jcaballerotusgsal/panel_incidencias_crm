import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

/** Agrupa el endpoint de salud y su lógica. */
@Module({ controllers: [HealthController], providers: [HealthService] })
export class HealthModule {}
