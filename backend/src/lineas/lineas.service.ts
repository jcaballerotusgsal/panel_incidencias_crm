import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Linea } from './linea';
import { LineasRepository } from './lineas.repository';

/** Proporciona el catálogo de lectura y un error público adecuado para el desplegable. */
@Injectable()
export class LineasService {
  /** @param repository Lectura de las líneas con nombre del CRM local. */
  constructor(private readonly repository: LineasRepository) {}

  /**
   * Prepara el catálogo para el formulario sin consultar ni guardar datos personales.
   * @returns Lista de líneas; una lista vacía es un resultado válido.
   * @throws ServiceUnavailableException si falla la lectura, sin detalles del driver o credenciales.
   */
  async listar(): Promise<{ lineas: Linea[] }> {
    try {
      return { lineas: await this.repository.listar() };
    } catch {
      throw new ServiceUnavailableException('No se han podido cargar las líneas. Inténtalo de nuevo.');
    }
  }
}
