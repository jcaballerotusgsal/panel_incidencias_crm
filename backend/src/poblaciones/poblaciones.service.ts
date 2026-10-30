import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { Poblacion } from './poblacion';
import { PoblacionesRepository } from './poblaciones.repository';

/** Ofrece el catálogo de lectura con errores públicos sin información de conexión. */
@Injectable()
export class PoblacionesService {
  /** @param repository Lectura de nombres e ids de zonas existentes. */
  constructor(private readonly repository: PoblacionesRepository) {}

  /**
   * Obtiene las poblaciones para el desplegable sin consultar datos personales.
   * @returns Lista de opciones; un catálogo vacío sigue siendo una respuesta válida.
   * @throws ServiceUnavailableException ante indisponibilidad de la lectura.
   */
  async listar(): Promise<{ poblaciones: Poblacion[] }> {
    try { return { poblaciones: await this.repository.listar() }; } catch {
      throw new ServiceUnavailableException('No se han podido cargar las poblaciones. Inténtalo de nuevo.');
    }
  }
}
