import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';

/** Comparte el pool MySQL únicamente entre módulos del backend. */
@Module({ providers: [DatabaseService], exports: [DatabaseService] })
export class DatabaseModule {}
