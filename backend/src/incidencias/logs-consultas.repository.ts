import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

/** Persiste un log por consulta sin modificar incidencias ni otros datos del CRM. */
@Injectable()
export class LogsConsultasRepository {
  /** @param database Pool del backend con permiso INSERT en la tabla de logs. */
  constructor(private readonly database: DatabaseService) {}

  /**
   * Guarda el instante de inicio y los campos recibidos, con el resultado real de la búsqueda.
   * @param fechaHoraPeticion Instante de inicio de la consulta, guardado como DATETIME UTC.
   * @param codigoIncidencia Código recibido como texto, incluidos sus ceros iniciales.
   * @param identificador Identificador recibido, antes de recortar espacios para la búsqueda.
   * @param valida Indica si la consulta ha encontrado una incidencia.
   * @returns Promesa resuelta cuando MySQL confirma el log; el id se genera en la tabla.
   * @throws ServiceUnavailableException si no se puede guardar el registro.
   */
  async registrar(
    fechaHoraPeticion: Date, codigoIncidencia: string, identificador: string, valida: boolean,
  ): Promise<void> {
    const fechaUtc = fechaHoraPeticion.toISOString().slice(0, 19).replace('T', ' ');
    await this.database.insert(`
      INSERT INTO crm_logs_consulta_incidencias
        (FechaHoraPeticion, CodIncidencia, Identificador, Valida)
      VALUES (?, ?, ?, ?)
    `, [fechaUtc, codigoIncidencia, identificador, valida ? 1 : 0]);
  }
}
