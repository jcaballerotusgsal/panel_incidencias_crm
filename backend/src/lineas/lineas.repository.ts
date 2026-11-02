import { Injectable } from '@nestjs/common';
import { RowDataPacket } from 'mysql2/promise';
import { DatabaseService } from '../database/database.service';
import { Linea } from './linea';

/** Lee únicamente el identificador y nombre del catálogo existente de líneas. */
@Injectable()
export class LineasRepository {
  /** @param database Pool compartido del backend, con acceso de lectura al catálogo local. */
  constructor(private readonly database: DatabaseService) {}

  /**
   * Obtiene las líneas con nombre, manteniendo cada identificador del catálogo.
   * @returns Líneas ordenadas por nombre e id, sin filas con nombre nulo o vacío.
   * @throws ServiceUnavailableException si MySQL no puede atender la lectura.
   */
  async listar(): Promise<Linea[]> {
    return this.database.read<RowDataPacket & Linea>(`
      SELECT id_linea_amb, nom_linea_tusgsal
      FROM crm_lineas_tusgsal_amb
      WHERE nom_linea_tusgsal IS NOT NULL AND TRIM(nom_linea_tusgsal) <> ''
      ORDER BY nom_linea_tusgsal ASC, id_linea_amb ASC
    `, []);
  }
}
