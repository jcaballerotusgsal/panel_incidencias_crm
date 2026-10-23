import { Injectable } from '@nestjs/common';
import { RowDataPacket } from 'mysql2/promise';
import { DatabaseService } from '../database/database.service';
import { Incidencia } from './incidencia';

/** Consulta una incidencia con su línea; las claves primarias mantienen una única fila. */
@Injectable()
export class IncidenciasRepository {
  /** @param database Pool del backend, sin acceso a conexiones desde el navegador. */
  constructor(private readonly database: DatabaseService) {}

  /**
   * Busca por id e identificador y resuelve el nombre de línea mediante la clave única AMB.
   * @param id Clave primaria validada de crm_incidencia.
   * @param identificador DNI, correo o código AMB completo, sin búsquedas parciales.
   * @returns Sus 28 columnas y nom_linea_tusgsal, nulo si no hay línea; null si no coincide la pareja.
   * @throws ServiceUnavailableException si MySQL no puede atender la consulta.
   */
  async findByCredentials(id: number, identificador: string): Promise<Incidencia | null> {
    const rows = await this.database.read<RowDataPacket & Incidencia>(`
      SELECT
        i.id, i.fecha_recepcion, i.via_recepcion, i.atendido_por,
        i.dp_nombre, i.dp_apellidos, i.dp_dni, i.dp_sexo, i.dp_idioma,
        i.dp_telefono, i.dp_email, i.dp_correoPostal,
        i.m_tipo, i.m_fechaAcontecimiento_date, i.m_hora, i.m_linea,
        l.nom_linea_tusgsal AS nom_linea_tusgsal,
        i.m_vehiculo, i.m_zona, i.m_parada, i.m_sentido, i.m_detalle, i.nombre_corto,
        i.incidencia_created_date, i.incidencia_date_updated,
        i.e_matricula, i.e_conductor, i.e_fecha, i.e_tempo
      FROM crm_incidencia AS i
      LEFT JOIN crm_lineas_tusgsal_amb AS l ON i.m_linea = l.id_linea_amb
      WHERE i.id = ? AND (TRIM(i.dp_dni) = ? OR TRIM(i.dp_email) = ? OR TRIM(i.dp_apellidos) = ?)
      LIMIT 1
    `, [id, identificador, identificador, identificador]);
    return rows[0] ?? null;
  }
}
