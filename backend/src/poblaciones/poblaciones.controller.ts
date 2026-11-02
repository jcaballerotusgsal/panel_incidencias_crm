import { Controller, Get, Header } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Poblacion } from './poblacion';
import { PoblacionesService } from './poblaciones.service';

@ApiTags('Poblaciones')
@Controller('poblaciones')
export class PoblacionesController {
  /** @param poblaciones Servicio del catálogo local de zonas. */
  constructor(private readonly poblaciones: PoblacionesService) {}

  /**
   * Expone los nombres de poblaciones con su id_m_zona para el formulario de queja.
   * @returns Catálogo de lectura con HTTP 200 y sin caché.
   * @throws ServiceUnavailableException si no se puede cargar el catálogo.
   */
  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Obtiene las poblaciones para seleccionar la zona del suceso' })
  @ApiResponse({ status: 200, description: 'Poblaciones con nombre, posiblemente ninguna.' })
  @ApiResponse({ status: 503, description: 'Catálogo temporalmente no disponible.' })
  listar(): Promise<{ poblaciones: Poblacion[] }> {
    return this.poblaciones.listar();
  }
}
