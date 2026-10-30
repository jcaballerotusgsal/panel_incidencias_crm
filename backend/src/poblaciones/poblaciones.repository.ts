import { Injectable } from '@nestjs/common';
import type { RowDataPacket } from 'mysql2/promise';
import { DatabaseService } from '../database/database.service';
import type { Poblacion } from './poblacion';

/** Lee el catálogo existente para seleccionar la zona del suceso. */
@Injectable()
export class PoblacionesRepository {
  /** @param database Conexión del backend con permiso SELECT sobre el catálogo local. */
  constructor(private readonly database: DatabaseService) {}

  /**
   * Enumera los ids y nombres de poblaciones que se pueden ofrecer en el formulario.
   * @returns Opciones con nombre informado, ordenadas por población e id sin agrupar nombres repetidos.
   * @throws ServiceUnavailableException si no puede leerse el catálogo.
   */
  async listar(): Promise<Poblacion[]> {
    return this.database.read<RowDataPacket & Poblacion>(`
      SELECT id_m_zona, poblacion
      FROM crm_m_zona_poblaciones
      WHERE poblacion IS NOT NULL AND TRIM(poblacion) <> ''
      ORDER BY poblacion ASC, id_m_zona ASC
    `, []);
  }
}
