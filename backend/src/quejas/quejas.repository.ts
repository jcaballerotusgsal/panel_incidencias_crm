import { BadRequestException, Injectable } from '@nestjs/common';
import type { RowDataPacket } from 'mysql2/promise';
import { DatabaseService } from '../database/database.service';
import type { NuevaQueja } from './nueva-queja';

/** Inserta incidencia, respuesta y expediente como una única unidad de trabajo. */
@Injectable()
export class QuejasRepository {
  /** @param database Pool del backend con lectura del catálogo e inserción en las tres tablas locales. */
  constructor(private readonly database: DatabaseService) {}

  /**
   * Verifica la línea y crea las tres filas en su orden de claves foráneas.
   * @param datos Campos ya validados, con dirección postal y detalle preparados por el servicio.
   * @param momento Fecha/hora de recepción del servidor, idéntica para todos los campos de registro.
   * @returns Id de la incidencia solo después de confirmar la transacción completa.
   * @throws BadRequestException si la línea no existe o no tiene nombre disponible.
   * @throws ServiceUnavailableException ante un fallo; se intenta revertir la transacción completa.
   */
  async crear(datos: NuevaQueja, momento: string): Promise<number> {
    return this.database.transaction(async (transaction) => {
      // El bloqueo compartido mantiene la opción del catálogo durante las tres inserciones.
      const lineas = await transaction.read<RowDataPacket>(`
        SELECT id_linea_amb
        FROM crm_lineas_tusgsal_amb
        WHERE id_linea_amb = ? AND nom_linea_tusgsal IS NOT NULL AND TRIM(nom_linea_tusgsal) <> ''
        LIMIT 1 LOCK IN SHARE MODE
      `, [datos.linea]);
      if (lineas.length !== 1) throw new BadRequestException('Selecciona una línea disponible en el catálogo.');

      const incidenciaId = await transaction.insert(`
        INSERT INTO crm_incidencia (
          fecha_recepcion, via_recepcion, atendido_por,
          dp_nombre, dp_apellidos, dp_dni, dp_sexo, dp_idioma,
          dp_telefono, dp_email, dp_correoPostal,
          m_tipo, m_fechaAcontecimiento_date, m_hora, m_linea,
          m_vehiculo, m_zona, m_parada, m_sentido, m_detalle, nombre_corto,
          incidencia_created_date, incidencia_date_updated,
          e_matricula, e_conductor, e_fecha, e_tempo
        ) VALUES (
          ?, 'formulario web', NULL,
          ?, ?, ?, NULL, '',
          ?, ?, ?,
          'Queja', ?, ?, ?,
          ?, NULL, ?, ?, ?, NULL,
          ?, ?,
          NULL, NULL, NULL, NULL
        )
      `, [
        momento, datos.nombre, datos.apellidos, datos.dni || null,
        datos.telefono || null, datos.correo, datos.direccionPostal,
        datos.fecha.split('-').reverse().join('-'), datos.hora, datos.linea,
        datos.numeroVehiculo || null, datos.parada || null, datos.sentido || null, datos.detalle,
        momento, momento,
      ]);
      const respuestaId = await transaction.insert(`
        INSERT INTO crm_respuesta (
          id_incidencia, estado, fecha, medio, tiempo, respuesta, estado2, observaciones,
          respuesta_created_date, respuesta_date_updated
        ) VALUES (?, 'pendiente', ?, 'correo electronico', NULL, '', 'abierta', '', ?, ?)
      `, [incidenciaId, momento.slice(0, 10), momento, momento]);
      await transaction.insert(`
        INSERT INTO crm_expediente (id_incidencia, id_resolucion, estado)
        VALUES (?, ?, 'Pendiente')
      `, [incidenciaId, respuestaId]);
      return incidenciaId;
    });
  }
}
