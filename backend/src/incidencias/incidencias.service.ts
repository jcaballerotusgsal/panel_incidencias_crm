import { Injectable, NotFoundException } from '@nestjs/common';
import { ConsultarIncidenciaDto } from './consultar-incidencia.dto';
import { Incidencia } from './incidencia';
import { IncidenciasRepository } from './incidencias.repository';

@Injectable()
export class IncidenciasService {
  /** @param repository Acceso de lectura a las incidencias del CRM existente. */
  constructor(private readonly repository: IncidenciasRepository) {}

  /**
   * Autoriza la lectura provisional solo si coinciden código e identificador.
   * @param consulta Datos validados por el DTO de entrada.
   * @returns Incidencia encontrada con el nombre de línea asociado, si está disponible.
   * @throws NotFoundException si el id o el identificador no coinciden.
   * @throws ServiceUnavailableException si falla el acceso a MySQL.
   */
  async consultar(consulta: ConsultarIncidenciaDto): Promise<{ incidencia: Incidencia }> {
    const incidencia = await this.repository.findByCredentials(
      consulta.codigoIncidencia, consulta.identificador.trim(),
    );
    if (!incidencia) throw new NotFoundException('No se han encontrado los datos.');
    return { incidencia };
  }
}
