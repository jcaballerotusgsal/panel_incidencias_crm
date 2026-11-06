import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import { DatabaseService } from '../database/database.service';
import type { DatabaseTransaction } from '../database/database.transaction';
import type { Notificacion } from './notificacion';
import { NotificacionesConfig } from './notificaciones.config';

/** Mantiene la cola de correo con reservas compatibles con MySQL 5.7, sin SKIP LOCKED. */
@Injectable()
export class NotificacionesRepository {
  /** @param database Conexión local. @param config Destinatario interno, reintentos e intervalo. */
  constructor(private readonly database: DatabaseService, private readonly config: NotificacionesConfig) {}

  /**
   * Registra los dos destinatarios del alta en la transacción original, antes del COMMIT.
   * @param transaction Misma conexión que crea la queja.
   * @param incidenciaId Código generado. @param expedienteId Expediente generado. @param correo Correo validado del formulario.
   * @returns Promesa resuelta tras insertar ambos avisos; un fallo revierte toda la operación.
   */
  async registrarAlta(transaction: DatabaseTransaction, incidenciaId: number, expedienteId: number, correo: string): Promise<void> {
    const eventoId = randomUUID();
    for (const tipo of ['solicitante', 'interno']) {
      await transaction.insert(`
        INSERT INTO crm_notificaciones_correo
          (evento_id, tipo_evento, id_incidencia, id_expediente, estado_anterior, estado_nuevo,
           tipo_destinatario, destinatario, creado_en, disponible_en)
        VALUES (?, 'queja_creada', ?, ?, NULL, 'Pendiente', ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())
      `, [eventoId, incidenciaId, expedienteId, tipo, tipo === 'solicitante' ? correo : null]);
    }
  }

  /**
   * Reserva un aviso y recupera reservas caducadas; conserva el orden por incidencia y destinatario.
   * @returns Aviso reservado durante dos minutos, o null si no hay trabajo.
   * @throws ServiceUnavailableException si falla el acceso a datos; no se llama al proveedor aquí.
   */
  async reservar(): Promise<Notificacion | null> {
    return this.database.transaction(async transaction => {
      await transaction.update(`
        UPDATE crm_notificaciones_correo
        SET estado_envio = 'fallido', ultimo_error = 'RESERVA_AGOTADA', token = NULL, reservado_hasta = NULL
        WHERE intentos >= ? AND (estado_envio = 'pendiente'
          OR (estado_envio = 'procesando' AND reservado_hasta <= UTC_TIMESTAMP()))
      `, [this.config.maxAttempts]);
      const rows = await transaction.read<RowDataPacket & Omit<Notificacion, 'token'>>(`
        SELECT n.id, n.evento_id, n.tipo_evento, n.id_incidencia, n.id_expediente,
          n.estado_anterior, n.estado_nuevo, n.tipo_destinatario, n.destinatario, n.intentos
        FROM crm_notificaciones_correo AS n
        WHERE ((n.estado_envio = 'pendiente' AND n.disponible_en <= UTC_TIMESTAMP())
          OR (n.estado_envio = 'procesando' AND n.reservado_hasta <= UTC_TIMESTAMP()))
          AND n.intentos < ?
          AND NOT EXISTS (
            SELECT 1 FROM crm_notificaciones_correo AS anterior
            WHERE anterior.id_incidencia = n.id_incidencia AND anterior.tipo_destinatario = n.tipo_destinatario
              AND anterior.id < n.id AND anterior.estado_envio IN ('pendiente', 'procesando')
          )
        ORDER BY n.id ASC LIMIT 1 FOR UPDATE
      `, [this.config.maxAttempts]);
      const row = rows[0];
      if (!row) return null;
      const token = randomUUID();
      const destinatario = row.destinatario ?? (row.tipo_destinatario === 'interno' ? this.config.internalTo : null);
      const affected = await transaction.update(`
        UPDATE crm_notificaciones_correo
        SET estado_envio = 'procesando', token = ?, reservado_hasta = DATE_ADD(UTC_TIMESTAMP(), INTERVAL 120 SECOND),
          intentos = intentos + 1, destinatario = ?
        WHERE id = ?
      `, [token, destinatario, row.id]);
      if (affected !== 1) throw new Error('No se ha reservado el aviso.');
      return { ...row, destinatario, intentos: row.intentos + 1, token };
    });
  }

  /**
   * Guarda la aceptación del proveedor solo si sigue vigente la propiedad de la reserva.
   * @param aviso Fila reservada con su token; no acredita entrega en el buzón.
   * @returns Promesa tras confirmar la actualización.
   * @throws Error o error de datos si no se puede confirmar; conserva la reserva para recuperación.
   */
  async confirmar(aviso: Notificacion): Promise<void> {
    await this.database.transaction(async transaction => {
      const affected = await transaction.update(`
        UPDATE crm_notificaciones_correo SET estado_envio = 'enviado', enviado_en = UTC_TIMESTAMP(),
          ultimo_error = NULL, token = NULL, reservado_hasta = NULL
        WHERE id = ? AND token = ? AND estado_envio = 'procesando'
      `, [aviso.id, aviso.token]);
      if (affected !== 1) throw new Error('La reserva del aviso ya no está disponible.');
    });
  }

  /**
   * Registra un fallo seguro y programa su reintento, condicionado por id y token.
   * @param aviso Reserva fallida. @param errorCode Código sin respuestas externas ni correos.
   * @param permanent Si impide reintentar. @param retryAfter Espera mínima del proveedor, en segundos.
   * @returns Promesa tras guardar el resultado; un token perdido no modifica otra reserva.
   * @throws ServiceUnavailableException si no puede persistir el fallo.
   */
  async rechazar(aviso: Notificacion, errorCode: string, permanent: boolean, retryAfter = 0): Promise<void> {
    const terminal = permanent || aviso.intentos >= this.config.maxAttempts;
    const delay = Math.max(retryAfter, Math.min(3600, 60 * 2 ** (aviso.intentos - 1)));
    await this.database.transaction(async transaction => {
      await transaction.update(`
        UPDATE crm_notificaciones_correo SET estado_envio = ?, ultimo_error = ?,
          disponible_en = DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? SECOND), token = NULL, reservado_hasta = NULL
        WHERE id = ? AND token = ? AND estado_envio = 'procesando'
      `, [terminal ? 'fallido' : 'pendiente', errorCode, delay, aviso.id, aviso.token]);
    });
  }
}
