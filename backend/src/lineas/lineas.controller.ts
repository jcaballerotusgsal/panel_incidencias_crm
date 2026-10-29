import { Controller, Get, Header } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Linea } from './linea';
import { LineasService } from './lineas.service';

@ApiTags('Líneas')
@Controller('lineas')
export class LineasController {
  /** @param lineas Servicio de consulta del catálogo para formularios. */
  constructor(private readonly lineas: LineasService) {}

  /**
   * Expone las líneas disponibles sin aceptar datos de quejas ni modificar el CRM.
   * @returns Identificador y nombre de cada línea con nombre informado.
   * @throws ServiceUnavailableException si no se puede cargar el catálogo.
   */
  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Obtiene las líneas para el formulario de queja' })
  @ApiResponse({ status: 200, description: 'Catálogo de líneas, posiblemente vacío.' })
  @ApiResponse({ status: 503, description: 'Catálogo temporalmente no disponible.' })
  listar(): Promise<{ lineas: Linea[] }> {
    return this.lineas.listar();
  }
}
