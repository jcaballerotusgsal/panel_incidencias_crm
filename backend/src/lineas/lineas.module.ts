import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { LineasController } from './lineas.controller';
import { LineasRepository } from './lineas.repository';
import { LineasService } from './lineas.service';

/** Comparte la conexión existente para exponer exclusivamente la lectura de líneas. */
@Module({
  imports: [DatabaseModule],
  controllers: [LineasController],
  providers: [LineasRepository, LineasService],
})
export class LineasModule {}
