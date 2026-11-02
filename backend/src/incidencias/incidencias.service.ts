import { Injectable, NotFoundException } from '@nestjs/common';
import { ConsultarIncidenciaDto } from './consultar-incidencia.dto';
import { Incidencia } from './incidencia';
import { IncidenciasRepository } from './incidencias.repository';
import { LogsConsultasRepository } from './logs-consultas.repository';

@Injectable()
export class IncidenciasService {
  /**
   * @param repository Acceso de lectura a las incidencias del CRM existente.
   * @param logs Acceso de escritura exclusivo al registro de consultas.
   */
  constructor(
    private readonly repository: IncidenciasRepository,
    private readonly logs: LogsConsultasRepository,
  ) {}

  /**
   * Busca la pareja de datos y espera a registrar el intento antes de devolver el resultado.
   * @param consulta Datos validados por el DTO de entrada.
   * @returns Incidencia encontrada con su línea y los estados de sus expedientes.
   * @throws NotFoundException si el id o el identificador no coinciden.
   * @throws ServiceUnavailableException si falla la lectura o no se puede guardar su log.
   * @remarks Guarda una fila incluso sin coincidencia o si falla la lectura; no modifica incidencias ni catálogo.
   */
  async consultar(consulta: ConsultarIncidenciaDto): Promise<{ incidencia: Incidencia }> {
    const fechaHoraPeticion = new Date();
    let incidencia: Incidencia | null = null;
    try {
      incidencia = await this.repository.findByCredentials(
        Number(consulta.codigoIncidencia), consulta.identificador.trim(),
      );
    } finally {
      await this.logs.registrar(
        fechaHoraPeticion, String(consulta.codigoIncidencia), consulta.identificador, incidencia !== null,
      );
    }
    if (!incidencia) throw new NotFoundException('No se han encontrado los datos.');
    return { incidencia };
  }
}
