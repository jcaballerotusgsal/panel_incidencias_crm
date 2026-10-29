import { Injectable } from '@nestjs/common';
import { RowDataPacket } from 'mysql2/promise';
import { DatabaseService } from '../database/database.service';
import { Incidencia } from './incidencia';

/** Consulta una incidencia y lee los estados de sus expedientes tras verificar el acceso. */
@Injectable()
export class IncidenciasRepository {
  /** @param database Pool del backend, sin acceso a conexiones desde el navegador. */
  constructor(private readonly database: DatabaseService) {}

  /**
   * Busca por id e identificador y obtiene la línea y los estados vinculados por id_incidencia.
   * @param id Clave primaria validada de crm_incidencia.
   * @param identificador DNI, correo o código AMB completo, sin búsquedas parciales.
   * @returns Una incidencia con línea y estados ordenados por id de expediente; null si no coincide.
   * @throws ServiceUnavailableException si falla la lectura de la incidencia o de sus expedientes.
   * @remarks Consulta expedientes solo tras validar la pareja; una lista vacía indica que no hay ninguno.
   */
  async findByCredentials(id: number, identificador: string): Promise<Incidencia | null> {
    const rows = await this.database.read<RowDataPacket & Omit<Incidencia, 'estados_expedientes'>>(`
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
    const incidencia = rows[0];
    if (!incidencia) return null;

    const expedientes = await this.database.read<RowDataPacket & { estado: string | null }>(`
      SELECT estado
      FROM crm_expediente
      WHERE id_incidencia = ?
      ORDER BY id ASC
    `, [incidencia.id]);
    // Cada elemento representa un expediente; no se presupone unicidad ni se elige un estado prioritario.
    return { ...incidencia, estados_expedientes: expedientes.map((expediente) => expediente.estado) };
  }
}
